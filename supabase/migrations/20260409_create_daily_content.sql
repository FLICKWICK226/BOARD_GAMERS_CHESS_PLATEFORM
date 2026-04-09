-- ============================================================
-- Migration: create daily_content table (v3 — robust)
-- Stores 3 daily puzzles (one per level) fetched from Lichess
-- ============================================================

-- Drop existing assets to ensure a clean start and avoid schema mismatches
DROP VIEW IF EXISTS public.todays_puzzles CASCADE;
DROP TABLE IF EXISTS public.daily_content CASCADE;

-- Create table with correct naming
CREATE TABLE public.daily_content (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  level           TEXT        NOT NULL,

  -- Lichess identifiers
  lichess_id      TEXT        NOT NULL,
  lichess_game_id TEXT,

  -- Position data
  fen             TEXT        NOT NULL,
  last_move       TEXT        NOT NULL,
  solution        TEXT[]      NOT NULL,

  -- Puzzle metadata
  rating          INTEGER     NOT NULL,
  themes          TEXT[],
  initial_ply     INTEGER,

  -- Game context (from the daily puzzle endpoint)
  pgn             TEXT,
  players         JSONB,

  -- Creation tracking
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT daily_content_level_check CHECK (level IN ('beginner', 'intermediate', 'expert')),
  CONSTRAINT daily_content_date_level_key UNIQUE (puzzle_date, level)
);

-- ── Enable RLS ──────────────────────────────────────────────
ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;

-- Authenticated users: read only
CREATE POLICY "Authenticated users can read daily_content"
  ON public.daily_content
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role: full access (used by fetch-daily API route)
CREATE POLICY "Service role can manage daily_content"
  ON public.daily_content
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Index ───────────────────────────────────────────────────
CREATE INDEX idx_daily_content_date_level
  ON public.daily_content (puzzle_date, level);

-- ── View: today's puzzles ───────────────────────────────────
CREATE OR REPLACE VIEW public.todays_puzzles AS
  SELECT
    dc.id,
    dc.puzzle_date,
    dc.level,
    dc.lichess_id,
    dc.lichess_game_id,
    dc.fen,
    dc.last_move,
    dc.solution,
    dc.rating,
    dc.themes,
    dc.initial_ply,
    dc.pgn,
    dc.players,
    dc.fetched_at,
    CASE dc.level
      WHEN 'beginner'     THEN 1
      WHEN 'intermediate' THEN 2
      WHEN 'expert'       THEN 3
      ELSE 99
    END AS level_order
  FROM public.daily_content dc
  WHERE dc.puzzle_date = CURRENT_DATE
  ORDER BY level_order;
