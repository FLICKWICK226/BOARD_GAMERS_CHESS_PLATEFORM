'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

// ─────────────────────────────────────────────────────────────
// Generic auth error — never reveal whether email exists or not.
// Prevents account enumeration attacks.
// ─────────────────────────────────────────────────────────────
const GENERIC_AUTH_ERROR = 'Identifiants incorrects. Vérifiez votre email et mot de passe.'

// ─────────────────────────────────────────────────────────────
// Password strength validation
// NIST SP 800-63B: minimum 8 chars, no constraint on character
// classes, but block trivially weak passwords.
// ─────────────────────────────────────────────────────────────
const COMMON_PASSWORDS = new Set([
  'password', 'password1', '12345678', '123456789', 'qwerty123',
  'iloveyou', 'sunshine', 'princess', 'football', 'welcome1',
  'monkey123', 'shadow123', 'master12', 'dragon12', 'passw0rd',
])

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères.'
  }
  if (/^\d+$/.test(password)) {
    return 'Le mot de passe ne peut pas être composé uniquement de chiffres.'
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'Ce mot de passe est trop courant. Choisissez-en un plus unique.'
  }
  return null
}

// ─────────────────────────────────────────────────────────────
// signIn
// ─────────────────────────────────────────────────────────────
export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).toLowerCase().trim()
  const password = formData.get('password') as string

  // ── Rate limit: 5 login attempts per email per 10 minutes ──
  const loginRl = rateLimit(`login:${email}`, 5, 600_000)
  if (!loginRl.allowed) {
    const mins = Math.ceil(loginRl.resetInMs / 60_000)
    return {
      error: `Trop de tentatives. Réessayez dans ${mins} minute(s).`,
    }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // SECURITY: Never reveal whether the email exists or the password is wrong.
    // Log the real error server-side for debugging, return generic message.
    console.warn(`[auth] signIn failed for ${email}: ${error.message}`)
    return { error: GENERIC_AUTH_ERROR }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ─────────────────────────────────────────────────────────────
// signUp
// ─────────────────────────────────────────────────────────────
export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).toLowerCase().trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const level = formData.get('level') as string || 'beginner'

  // ── Rate limit: 3 account creations per IP per hour ──
  const headerStore = await headers()
  const ip =
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerStore.get('x-real-ip') ??
    'unknown'
  const signupRl = rateLimit(`signup:${ip}`, 3, 3_600_000)
  if (!signupRl.allowed) {
    const mins = Math.ceil(signupRl.resetInMs / 60_000)
    return {
      error: `Trop de comptes créés depuis cette adresse. Réessayez dans ${mins} minute(s).`,
    }
  }

  if (password !== confirmPassword) {
    return { error: 'Les mots de passe ne correspondent pas.' }
  }

  // ── Password strength check ──
  const pwError = validatePassword(password)
  if (pwError) return { error: pwError }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { level },
    },
  })

  if (error) {
    console.warn(`[auth] signUp failed for ${email}: ${error.message}`)
    // Generic message — do not reveal if email is already registered
    return { error: 'Impossible de créer le compte. Vérifiez vos informations et réessayez.' }
  }

  revalidatePath('/', 'layout')
  redirect('/login?msg=confirm')
}

// ─────────────────────────────────────────────────────────────
// signOut — global scope to invalidate ALL sessions/devices
// ─────────────────────────────────────────────────────────────
export async function signOut() {
  const supabase = await createClient()
  // scope: 'global' revokes all refresh tokens server-side,
  // not just the current browser session cookie.
  await supabase.auth.signOut({ scope: 'global' })
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ─────────────────────────────────────────────────────────────
// resetPassword — send a password reset email
// Rate limited: 3 requests per email per 15 minutes
// ─────────────────────────────────────────────────────────────
export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string).toLowerCase().trim()

  // Rate limit to prevent email flooding
  const rl = rateLimit(`reset:${email}`, 3, 900_000)
  if (!rl.allowed) {
    const mins = Math.ceil(rl.resetInMs / 60_000)
    return { error: `Trop de demandes. Réessayez dans ${mins} minute(s).` }
  }

  // SECURITY: Always return success — never confirm whether the email exists.
  // Supabase will only send an email if the address is registered.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  })

  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// updatePassword — called from the reset-password page after
// the user clicks the link in their email and is redirected
// back with a valid session.
// ─────────────────────────────────────────────────────────────
export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Session expirée. Demandez un nouveau lien de réinitialisation.' }
  }

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Les mots de passe ne correspondent pas.' }
  }

  const pwError = validatePassword(password)
  if (pwError) return { error: pwError }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: 'Impossible de mettre à jour le mot de passe.' }
  }

  // Invalidate all other sessions after password change
  await supabase.auth.signOut({ scope: 'others' })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ─────────────────────────────────────────────────────────────
// updateLevel — safe profile mutation (level only)
// ─────────────────────────────────────────────────────────────
const VALID_LEVELS = new Set(['beginner', 'intermediate', 'expert'])

export async function updateLevel(level: string) {
  if (!VALID_LEVELS.has(level)) {
    return { error: 'Niveau invalide.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('users')
    .update({ level })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { success: true }
}
