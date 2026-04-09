-- ============================================================
-- Migration: Enhanced puzzle_attempts table
-- Tracks user performance on daily puzzles
-- ============================================================

-- Drop old table if it exists
DROP TABLE IF EXISTS public.puzzle_attempts CASCADE;

CREATE TABLE public.puzzle_attempts (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    puzzle_id       UUID            NOT NULL REFERENCES public.daily_content(id) ON DELETE CASCADE,
    
    -- Status and performance
    status          TEXT            NOT NULL CHECK (status IN ('success', 'failed')),
    wrong_moves     INTEGER         NOT NULL DEFAULT 0,
    time_spent      INTEGER         NOT NULL DEFAULT 0, -- in seconds
    
    -- Scoring
    points_awarded  INTEGER         NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    
    -- Constraints
    -- A user should only have one recorded ATTEMPT per puzzle to avoid point farming
    -- (We can update the existing one if they retry, or just keep the first one)
    CONSTRAINT unique_user_puzzle_attempt UNIQUE (user_id, puzzle_id)
);

-- ── Enable RLS ──────────────────────────────────────────────
ALTER TABLE public.puzzle_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see and manage their own attempts
CREATE POLICY "Users can manage their own attempts"
    ON public.puzzle_attempts
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can do everything
CREATE POLICY "Service role full access on attempts"
    ON public.puzzle_attempts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_puzzle_attempts_user_id ON public.puzzle_attempts(user_id);
CREATE INDEX idx_puzzle_attempts_puzzle_id ON public.puzzle_attempts(puzzle_id);
