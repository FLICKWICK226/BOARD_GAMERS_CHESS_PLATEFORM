INSERT INTO public.daily_content (puzzle_date, level, lichess_id, fen, last_move, solution, rating, themes) VALUES 
(CURRENT_DATE, 'beginner', 't1', '4k3/8/4K3/8/8/8/8/8 w - - 0 1', 'e6e7', ARRAY['e6e7', 'e8f8'], 800, ARRAY['mateIn1']), 
(CURRENT_DATE, 'intermediate', 't2', '4k3/8/4K3/4Q3/8/8/8/8 w - - 0 1', 'e5e7', ARRAY['e5e7', 'e8f8'], 1500, ARRAY['tactical']), 
(CURRENT_DATE, 'expert', 't3', '4k3/8/4K3/4Q3/3R4/8/8/8 w - - 0 1', 'd4d7', ARRAY['d4d7', 'e8f8'], 2200, ARRAY['opening']) 
ON CONFLICT (puzzle_date, level) DO NOTHING;
