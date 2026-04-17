/**
 * scratch/import_lichess_puzzles.js
 *
 * Import puzzles from a Lichess puzzle CSV into Supabase daily_content.
 * Supports 10 puzzles per level per day (puzzle_number 1–10).
 *
 * USAGE (PowerShell – set env vars first in the same session):
 *   $env:SUPABASE_URL="https://xxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   node scratch/import_lichess_puzzles.js \
 *     --input "C:\path\to\lichess_db_puzzle.csv" \
 *     --days 300 \
 *     --start-date 2026-04-15
 *
 * WHAT IT DOES:
 *   - Streams the CSV line-by-line  → never loads 1.3 GB in RAM
 *   - Keeps a reservoir of (days × 10) puzzles per level via reservoir sampling
 *   - Assigns puzzle_number 1–10 for each day, so each day gets exactly 10 challenges
 *   - Upserts into daily_content using the (puzzle_date, level, puzzle_number) unique key
 *
 * RATING BRACKETS:
 *   beginner:     400 – 900
 *   intermediate: 1000 – 1499
 *   expert:       1500 – 2400
 */

import { createClient } from '@supabase/supabase-js'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { parseArgs } from 'util'

// ── CLI Args ──────────────────────────────────────────────────────
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    input:        { type: 'string', default: 'lichess_db_puzzle.csv' },
    days:         { type: 'string', default: '300' },   // how many days of content
    'per-day':    { type: 'string', default: '10' },    // puzzles per level per day
    'start-date': { type: 'string', default: new Date().toISOString().slice(0, 10) },
  },
})

const INPUT_FILE  = values['input']
const DAYS        = parseInt(values['days'], 10)
const PER_DAY     = parseInt(values['per-day'], 10)
const PER_LEVEL   = DAYS * PER_DAY   // total puzzles needed per level
const START_DATE  = values['start-date']

// ── Supabase ──────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

// ── Rating brackets ───────────────────────────────────────────────
const BRACKETS = {
  beginner:     { min: 400,  max: 900  },
  intermediate: { min: 1000, max: 1499 },
  expert:       { min: 1500, max: 2400 },
}

// ── Reservoir sampling ────────────────────────────────────────────
// Keeps exactly N random items from a massive stream without loading all data
function makeReservoir(size) {
  const reservoir = []
  let count = 0
  return {
    add(item) {
      count++
      if (reservoir.length < size) {
        reservoir.push(item)
      } else {
        const j = Math.floor(Math.random() * count)
        if (j < size) reservoir[j] = item
      }
    },
    get() { return reservoir },
  }
}

// ── CSV parsing (Lichess format) ──────────────────────────────────
// CSV header: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
// Moves field: "lastMove solution1 solution2 ..."  → first token is last_move (opponent's move), rest is solution
function parseLine(line) {
  const [id, fen, movesRaw, ratingStr, , , , themesRaw] = line.split(',')
  const rating = parseInt(ratingStr, 10)
  if (!id || isNaN(rating) || !fen || !movesRaw) return null
  const moves = movesRaw.trim().split(' ')
  return {
    id,
    fen,
    last_move: moves[0],          // the move that triggered the puzzle position
    solution:  moves.slice(1),    // the correct move sequence
    rating,
    themes: themesRaw ? themesRaw.split(' ') : [],
  }
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log(`📂 Reading: ${INPUT_FILE}`)
  console.log(`🎯 Target: ${DAYS} days × ${PER_DAY} puzzles/level = ${PER_LEVEL} per level`)
  console.log(`📅 Starting from: ${START_DATE}\n`)

  // One reservoir per level, sized (days × per-day)
  const reservoirs = {
    beginner:     makeReservoir(PER_LEVEL),
    intermediate: makeReservoir(PER_LEVEL),
    expert:       makeReservoir(PER_LEVEL),
  }

  let linesRead = 0
  let header = true

  const rl = createInterface({
    input: createReadStream(INPUT_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    if (header) { header = false; continue }   // skip CSV header row
    linesRead++
    if (linesRead % 200_000 === 0) {
      process.stdout.write(`  … ${linesRead.toLocaleString()} lines scanned\r`)
    }

    const puzzle = parseLine(line)
    if (!puzzle) continue

    for (const [level, bracket] of Object.entries(BRACKETS)) {
      if (puzzle.rating >= bracket.min && puzzle.rating <= bracket.max) {
        reservoirs[level].add(puzzle)
        break
      }
    }
  }

  console.log(`\n✅ Scan complete — ${linesRead.toLocaleString()} lines processed\n`)

  // ── Build rows: 10 puzzles per level per day ──────────────────
  const rows = []
  const baseDate = new Date(START_DATE)

  for (const [level, reservoir] of Object.entries(reservoirs)) {
    const puzzles = reservoir.get()
    console.log(`  ${level}: ${puzzles.length} puzzles selected (need ${PER_LEVEL})`)

    for (let dayIdx = 0; dayIdx < DAYS; dayIdx++) {
      const date = new Date(baseDate)
      date.setDate(baseDate.getDate() + dayIdx)
      const puzzleDate = date.toISOString().slice(0, 10)

      for (let num = 1; num <= PER_DAY; num++) {
        const puzzleIdx = dayIdx * PER_DAY + (num - 1)
        const puzzle = puzzles[puzzleIdx]
        if (!puzzle) continue  // in case reservoir didn't fill completely

        rows.push({
          puzzle_date:   puzzleDate,
          level,
          puzzle_number: num,        // 1–10 within the day
          lichess_id:    puzzle.id,
          lichess_game_id: null,
          fen:           puzzle.fen,
          last_move:     puzzle.last_move,
          solution:      puzzle.solution,
          rating:        puzzle.rating,
          themes:        puzzle.themes,
          initial_ply:   0,
          pgn:           null,
          players:       null,
          fetched_at:    new Date().toISOString(),
        })
      }
    }
  }

  console.log(`\n🚀 Inserting ${rows.length} rows into Supabase daily_content…`)

  // Insert in batches of 50 rows
  const BATCH = 50
  let inserted = 0
  let failed   = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('daily_content')
      .upsert(batch, { onConflict: 'puzzle_date,level,puzzle_number' })

    if (error) {
      console.error(`\n❌ Batch error at row ${i}: ${error.message}`)
      failed += batch.length
    } else {
      inserted += batch.length
      process.stdout.write(`  … ${inserted}/${rows.length} inserted\r`)
    }
  }

  const lastDate = rows.at(-1)?.puzzle_date ?? '?'
  console.log(`\n\n🎉 Done! ${inserted} puzzles imported, ${failed} failed.`)
  console.log(`   Coverage: ${START_DATE} → ${lastDate} (${DAYS} days)`)
  console.log(`   Per day per level: ${PER_DAY} puzzles`)
  console.log(`   Total per day: ${PER_DAY * 3} puzzles (3 levels)`)
}

main().catch(err => { console.error(err); process.exit(1) })
