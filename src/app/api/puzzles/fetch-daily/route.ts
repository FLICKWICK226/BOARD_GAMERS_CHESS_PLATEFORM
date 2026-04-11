import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ────────────────────────────────────────────
// Types from Lichess API
// ────────────────────────────────────────────
interface LichessDailyPuzzle {
  game: {
    id: string
    pgn: string
    players: Array<{
      name: string
      id: string
      color: string
      rating: number
    }>
  }
  puzzle: {
    id: string
    rating: number
    plays: number
    solution: string[]
    themes: string[]
    fen: string
    lastMove: string
    initialPly: number
  }
}

interface LichessBatchPuzzle {
  puzzles: Array<{
    puzzle: {
      id: string
      rating: number
      plays: number
      solution: string[]
      themes: string[]
      fen: string
      lastMove: string
      initialPly: number
    }
    game?: {
      id: string
      pgn?: string
      players?: Array<{ name: string; id: string; color: string; rating: number }>
    }
  }>
}

// ────────────────────────────────────────────
// Rating brackets per level
// ────────────────────────────────────────────
const LEVEL_RATINGS: Record<string, { min: number; max: number }> = {
  beginner:     { min: 400,  max: 900  },
  intermediate: { min: 1000, max: 1500 },
  expert:       { min: 1600, max: 2400 },
}

// ────────────────────────────────────────────
// Fetch the official daily puzzle from Lichess
// ────────────────────────────────────────────
async function fetchLichessDailyPuzzle(): Promise<LichessDailyPuzzle> {
  const res = await fetch('https://lichess.org/api/puzzle/daily', {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Lichess daily puzzle error: ${res.status}`)
  return res.json()
}

// ────────────────────────────────────────────
// Fetch a batch puzzle filtered by rating range
// ────────────────────────────────────────────
async function fetchPuzzleByRating(
  level: 'beginner' | 'intermediate'
): Promise<LichessBatchPuzzle['puzzles'][0] | null> {
  const bracket = LEVEL_RATINGS[level]

  const res = await fetch(
    `https://lichess.org/api/puzzle/batch?nb=15&difficulty=${level === 'beginner' ? 'easiest' : 'normal'}`,
    { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } }
  )

  let data: LichessBatchPuzzle

  if (!res.ok) {
    const fallback = await fetch('https://lichess.org/api/puzzle/batch?nb=30', {
      headers: { Accept: 'application/json' },
    })
    if (!fallback.ok) throw new Error(`Lichess batch error: ${fallback.status}`)
    data = await fallback.json()
  } else {
    data = await res.json()
  }

  const filtered = data.puzzles.filter(
    (p) => p.puzzle.rating >= bracket.min && p.puzzle.rating <= bracket.max
  )
  const midpoint = (bracket.min + bracket.max) / 2
  filtered.sort(
    (a, b) =>
      Math.abs(a.puzzle.rating - midpoint) - Math.abs(b.puzzle.rating - midpoint)
  )
  return filtered.length > 0 ? filtered[0] : data.puzzles[0] ?? null
}

// ────────────────────────────────────────────
// POST /api/puzzles/fetch-daily
// Protected by CRON_SECRET header
// ────────────────────────────────────────────
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const xApiKey = request.headers.get('x-api-key')
  const cronSecret = process.env.CRON_SECRET

  const isAuthorized = 
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecret && xApiKey === cronSecret)

  if (!isAuthorized) {
    console.error(`[API] Unauthorized access attempt to fetch-daily. Auth provided: ${authHeader ? 'Bearer' : 'None'}, X-API-Key: ${xApiKey ? 'Yes' : 'No'}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const results: Record<string, unknown> = {}
  const errors: Record<string, string> = {}

  // ── 1. Expert: official Lichess daily puzzle ──
  try {
    const daily = await fetchLichessDailyPuzzle()
    const { puzzle, game } = daily

    const { error } = await supabase.from('daily_content').upsert(
      {
        puzzle_date: today,
        level: 'expert',
        lichess_id: puzzle.id,
        lichess_game_id: game.id,
        fen: puzzle.fen,
        last_move: puzzle.lastMove,
        solution: puzzle.solution,
        rating: puzzle.rating,
        themes: puzzle.themes,
        initial_ply: puzzle.initialPly,
        pgn: game.pgn,
        players: game.players,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'puzzle_date,level' }
    )

    if (error) throw new Error(error.message)
    results.expert = { id: puzzle.id, rating: puzzle.rating, themes: puzzle.themes, fen: puzzle.fen }
  } catch (err) {
    errors.expert = String(err instanceof Error ? err.message : err)
  }

  // ── 2. Intermediate: batch puzzle ~Elo 1000-1500 ──
  try {
    const match = await fetchPuzzleByRating('intermediate')
    if (!match) throw new Error('No puzzle found in rating range')
    const { puzzle, game } = match

    const { error } = await supabase.from('daily_content').upsert(
      {
        puzzle_date: today,
        level: 'intermediate',
        lichess_id: puzzle.id,
        lichess_game_id: game?.id ?? null,
        fen: puzzle.fen,
        last_move: puzzle.lastMove,
        solution: puzzle.solution,
        rating: puzzle.rating,
        themes: puzzle.themes,
        initial_ply: puzzle.initialPly,
        pgn: game?.pgn ?? null,
        players: game?.players ?? null,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'puzzle_date,level' }
    )

    if (error) throw new Error(error.message)
    results.intermediate = { id: puzzle.id, rating: puzzle.rating, themes: puzzle.themes, fen: puzzle.fen }
  } catch (err) {
    errors.intermediate = String(err instanceof Error ? err.message : err)
  }

  // ── 3. Beginner: batch puzzle ~Elo 400-900 ──
  try {
    const match = await fetchPuzzleByRating('beginner')
    if (!match) throw new Error('No puzzle found in rating range')
    const { puzzle, game } = match

    const { error } = await supabase.from('daily_content').upsert(
      {
        puzzle_date: today,
        level: 'beginner',
        lichess_id: puzzle.id,
        lichess_game_id: game?.id ?? null,
        fen: puzzle.fen,
        last_move: puzzle.lastMove,
        solution: puzzle.solution,
        rating: puzzle.rating,
        themes: puzzle.themes,
        initial_ply: puzzle.initialPly,
        pgn: game?.pgn ?? null,
        players: game?.players ?? null,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'puzzle_date,level' }
    )

    if (error) throw new Error(error.message)
    results.beginner = { id: puzzle.id, rating: puzzle.rating, themes: puzzle.themes, fen: puzzle.fen }
  } catch (err) {
    errors.beginner = String(err instanceof Error ? err.message : err)
  }

  const hasErrors = Object.keys(errors).length > 0
  return NextResponse.json(
    {
      puzzle_date: today,
      success: !hasErrors,
      puzzles: results,
      ...(hasErrors && { errors }),
    },
    { status: hasErrors ? 207 : 200 }
  )
}

// ────────────────────────────────────────────
// GET /api/puzzles/fetch-daily
// Returns today's stored puzzles (public read)
// ────────────────────────────────────────────
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_content')
    .select('*')
    .eq('puzzle_date', today)
    .order('level')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ puzzle_date: today, puzzles: data })
}
