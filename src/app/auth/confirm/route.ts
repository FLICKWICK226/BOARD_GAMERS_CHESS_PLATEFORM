import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── Allowlist of valid OTP types this route accepts ──
const ALLOWED_OTP_TYPES: EmailOtpType[] = [
  'signup',
  'recovery',
  'invite',
  'email',
  'email_change',
]

// ── Allowlist of internal paths `next` can redirect to ──
// Prevents open redirect: an attacker crafting a link that sends
// users to an external phishing page after email confirmation.
const ALLOWED_NEXT_PATHS = ['/dashboard', '/profile', '/puzzle', '/play', '/coach']

function isSafeInternalPath(path: string): boolean {
  // Must start with / and not contain protocol or double-slash
  if (!path.startsWith('/')) return false
  if (path.includes('://')) return false
  if (path.startsWith('//')) return false
  return ALLOWED_NEXT_PATHS.some((p) => path === p || path.startsWith(`${p}/`))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const rawNext = searchParams.get('next')

  // ── Validate `next` param — default to /dashboard if missing/invalid ──
  const next =
    rawNext && isSafeInternalPath(rawNext) ? rawNext : '/dashboard'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  // Strip all auth params from the redirect URL (never leak token to destination)
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('next')

  // ── Validate token_hash and type before doing anything ──
  if (
    !token_hash ||
    !type ||
    !ALLOWED_OTP_TYPES.includes(type)
  ) {
    console.warn(`[auth/confirm] Invalid or missing params: type=${type}, token_hash=${token_hash ? '[present]' : '[missing]'}`)
    redirectTo.pathname = '/login'
    redirectTo.searchParams.set('msg', 'error')
    return NextResponse.redirect(redirectTo)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  })

  if (error) {
    console.warn(`[auth/confirm] OTP verification failed: ${error.message}`)
    redirectTo.pathname = '/login'
    redirectTo.searchParams.set('msg', 'error')
    return NextResponse.redirect(redirectTo)
  }

  return NextResponse.redirect(redirectTo)
}
