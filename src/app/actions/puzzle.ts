'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * Server Action: Save a completed puzzle attempt.
 *
 * Uses the server-side Supabase client (cookie-based session) to verify
 * the caller is authenticated, then writes the attempt using the service
 * role client so that the rating column (which is revoked from `authenticated`)
 * can be updated securely.
 *
 * IDOR protection:
 *  - `userId` is taken from the server-side session — never trusted from the client.
 *  - `puzzleId` is a UUID that references `daily_content`. The RLS policy on
 *    `puzzle_attempts` ensures no row can be inserted for a different `user_id`.
 */
export async function savePuzzleAttempt({
  puzzleId,
  wrongMoves,
  timeSpentSeconds,
  points,
  currentRating,
}: {
  puzzleId: string
  wrongMoves: number
  timeSpentSeconds: number
  points: number
  currentRating: number
}): Promise<{ newRating: number; error?: string }> {
  // 1. Verify session server-side
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { newRating: currentRating, error: 'Non authentifié' }
  }

  // 2. Use admin client (service_role) for privileged writes
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // 3. Insert the attempt — user_id taken from verified session
  const { error: insertError } = await admin.from('puzzle_attempts').insert({
    user_id: user.id,
    puzzle_id: puzzleId,
    solved: true,
    attempts_count: wrongMoves + 1,
    time_spent_seconds: timeSpentSeconds,
  })

  if (insertError) {
    console.error('[savePuzzleAttempt] Insert error:', insertError.message)
    return { newRating: currentRating, error: insertError.message }
  }

  // 4. Update rating via service role (revoked from authenticated role)
  const newRating = currentRating + Math.floor(points / 5)

  if (points > 0) {
    const { error: ratingError } = await admin
      .from('users')
      .update({ rating: newRating })
      .eq('id', user.id)

    if (ratingError) {
      console.error('[savePuzzleAttempt] Rating update error:', ratingError.message)
      // Don't fail the whole operation — attempt was saved
      return { newRating: currentRating, error: `Rating update failed: ${ratingError.message}` }
    }
  }

  return { newRating }
}
