-- Add rating column to users table with default 800
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 800;

-- Optional: Update existing users level helper based on rating logic if needed
-- But let's keep it simple and just add the numeric source of truth
COMMENT ON COLUMN public.users.rating IS 'Tactical Elo rating for puzzle segmentation (Lichess scale)';
