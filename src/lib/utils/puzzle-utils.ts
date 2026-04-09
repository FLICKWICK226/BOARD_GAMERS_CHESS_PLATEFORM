export type PuzzleLevel = 'beginner' | 'intermediate' | 'expert';

/**
 * Maps a numeric Elo rating to a tactical puzzle level.
 * Beginner: < 1200
 * Intermediate: 1200 - 1800
 * Expert: > 1800
 */
export function calculateLevelFromRating(rating: number): PuzzleLevel {
  if (rating < 1200) return 'beginner';
  if (rating <= 1800) return 'intermediate';
  return 'expert';
}

/**
 * Pretty print the elo range for a given level
 */
export function getLevelEloRange(level: PuzzleLevel): string {
  switch (level) {
    case 'beginner': return '< 1200';
    case 'intermediate': return '1200 - 1800';
    case 'expert': return '> 1800';
    default: return '';
  }
}
