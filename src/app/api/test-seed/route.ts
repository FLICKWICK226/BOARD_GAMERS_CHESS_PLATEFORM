import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const puzzles = [
    {
      puzzle_date: new Date().toISOString().split('T')[0],
      level: 'beginner',
      lichess_id: 'test_beg',
      fen: '4k3/8/4K3/8/8/8/8/8 w - - 0 1',
      last_move: 'e6e7',
      solution: ['e6e7', 'e8f8'],
      rating: 800,
      themes: ['mateIn1']
    },
    {
      puzzle_date: new Date().toISOString().split('T')[0],
      level: 'intermediate',
      lichess_id: 'test_int',
      fen: '4k3/8/4K3/4Q3/8/8/8/8 w - - 0 1',
      last_move: 'e5e7',
      solution: ['e5e7', 'e8f8'],
      rating: 1500,
      themes: ['tactical']
    },
    {
      puzzle_date: new Date().toISOString().split('T')[0],
      level: 'expert',
      lichess_id: 'test_exp',
      fen: '4k3/8/4K3/4Q3/3R4/8/8/8 w - - 0 1',
      last_move: 'd4d7',
      solution: ['d4d7', 'e8f8'],
      rating: 2200,
      themes: ['opening']
    }
  ]

  const { data, error } = await supabase
    .from('daily_content')
    .upsert(puzzles, { onConflict: 'puzzle_date,level' })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true, seeded: puzzles.length })
}
