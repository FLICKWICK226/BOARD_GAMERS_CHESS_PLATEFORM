'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Eye, ChevronRight, Loader2, Trophy, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { usePuzzleEngine } from '@/hooks/use-puzzle-engine'
import { PuzzleBoard } from '@/components/puzzle/PuzzleBoard'
import { calculateLevelFromRating, PuzzleLevel } from '@/lib/utils/puzzle-utils'
import { CompletionOverlay } from '@/components/puzzle/CompletionOverlay'

interface DailyPuzzle {
  id: string
  puzzle_date: string
  level: 'beginner' | 'intermediate' | 'expert'
  lichess_id: string
  fen: string
  solution: string[]
  rating: number
  themes: string[]
  players: Record<string, unknown>
  pgn: string
}

export default function PuzzlePage() {
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null)
  const [level, setLevel] = useState<PuzzleLevel>('beginner')
  const [userRating, setUserRating] = useState<number | null>(null)
  const [ratingGain, setRatingGain] = useState<number | null>(null)
  const [earnedPoints, setEarnedPoints] = useState<number>(0)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  const supabase = createClient()

  // 1. Fetch user profile to determine default level
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('users')
          .select('rating, level')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserRating(profile.rating ?? 800)
          // Priority: rating if exists, else categorical level
          const detectedLevel = profile.rating 
            ? calculateLevelFromRating(profile.rating)
            : (profile.level as PuzzleLevel || 'beginner')
            
          setLevel(detectedLevel)
        }
      } catch (err) {
        console.error('Profile fetch error:', err)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchUserProfile()
  }, [supabase])

  // 2. Fetch puzzle on mount (after level is set) or level change
  useEffect(() => {
    if (profileLoading) return // Wait for profile detection

    async function fetchPuzzle() {
      setLoading(true)
      setError(null)
      setShowHint(false)
      setShowSolution(false)

      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('daily_content')
        .select('*')
        .eq('puzzle_date', today)
        .eq('level', level)
        .single()

      if (error) {
        console.error('Fetch error:', error.message, error.details || '')
        setError("Aucun puzzle disponible pour ce niveau aujourd'hui.")
        setPuzzle(null)
      } else {
        setPuzzle(data)
        
        // Record initial "started" attempt as 'failed' (will be updated on success)
        const { data: { user: authUser } } = await supabase.auth.getUser()
        const userId = authUser?.id || '00000000-0000-0000-0000-000000000000'
        
        await supabase
          .from('puzzle_attempts')
          .upsert({
            user_id: userId,
            puzzle_id: data.id,
            status: 'failed',
            wrong_moves: 0,
            time_spent: 0,
            points_awarded: 0
          }, { onConflict: 'user_id,puzzle_id' })
      }
      setLoading(false)
    }

    fetchPuzzle()
  }, [level, profileLoading, supabase])

  // Initialize engine only when puzzle is loaded
  const { 
    fen, 
    status, 
    lastMove, 
    makeMove, 
    reset, 
    wrongMoves,
    showHint: engineShowHint,
    playSolution: enginePlaySolution,
    customArrows,
    isAutoPlaying
  } = usePuzzleEngine({
    initialFen: puzzle?.fen || '',
    solution: puzzle?.solution || [],
    onComplete: async (stats) => {
      console.log('Puzzle completed!', stats)
      
      // Persist to Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const userId = authUser?.id || '00000000-0000-0000-0000-000000000000'
      const puzzleId = puzzle?.id

      if (puzzleId) {
        // Calculate points: base 50 - mistakes*10 - (hints ? 15 : 0)
        let points = 50 - (stats.wrongMoves * 10)
        if (showHint) points -= 5
        if (showSolution) points = 0
        points = Math.max(points, 10) // minimum 10 points for completion
        setEarnedPoints(points)

        const { error: saveError } = await supabase
          .from('puzzle_attempts')
          .upsert({
            user_id: userId,
            puzzle_id: puzzleId,
            status: 'success',
            wrong_moves: stats.wrongMoves,
            time_spent: stats.timeSpent,
            points_awarded: points
          }, { onConflict: 'user_id,puzzle_id' })

        if (saveError) console.error('Error saving attempt:', saveError)

        // Update User Rating
        if (userRating !== null && points > 0) {
          const newRating = userRating + Math.floor(points / 5) // Scale down points to Elo gain
          const { error: ratingError } = await supabase
            .from('users')
            .update({ rating: newRating })
            .eq('id', user.id)

          if (!ratingError) {
            setRatingGain(newRating - userRating)
            setUserRating(newRating)
          } else {
            console.error('Error updating rating:', ratingError)
          }
        }
      }
    }
  })

  // Determine board orientation (White moves if FEN says 'w', Black if 'b')
  // Usually Lichess puzzles FEN is set *after* the opponent move, so side to move in FEN is the PLAYER.
  const boardOrientation = puzzle?.fen.split(' ')[1] === 'w' ? 'white' : 'black'

  if (profileLoading || loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">
          {profileLoading ? 'Analyse de votre niveau...' : 'Chargement du défi tactique...'}
        </p>
      </div>
    )
  }

  if (error || !puzzle) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-6 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-surface-high flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Oups ! Rien ici.</h2>
          <p className="text-muted-foreground mt-2">
            Nous n&apos;avons pas pu charger le puzzle du jour. Essayez de changer de niveau ou revenez plus tard.
          </p>
        </div>
        <div className="flex gap-2">
          {(['beginner', 'intermediate', 'expert'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                level === l ? 'bg-primary text-background' : 'bg-surface-high text-foreground hover:bg-surface-bright'
              }`}
            >
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Challenge Tactique</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Niveau : <span className="text-primary font-medium">{level.charAt(0).toUpperCase() + level.slice(1)}</span> &bull; Elo {puzzle.rating}
          </p>
        </div>
        
        <div className="flex bg-surface-container p-1 rounded-xl ghost-border">
          {(['beginner', 'intermediate', 'expert'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                level === l 
                ? 'bg-primary text-[#152800] shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l === 'expert' ? 'Expert' : l === 'intermediate' ? 'Inter.' : 'Débutant'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left — Chessboard (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-surface-container rounded-2xl p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
          <PuzzleBoard 
            fen={fen}
            orientation={boardOrientation}
            status={status}
            lastMove={lastMove}
            customArrows={customArrows}
            onMove={makeMove}
          />
        </div>

        {/* Right — Control panel (4/5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Status Card */}
          <div className="bg-surface-container rounded-2xl p-6 overflow-hidden relative">
            {status === 'completed' && (
              <div className="absolute top-0 right-0 p-4 animate-bounce">
                <Trophy className="w-8 h-8 text-primary opacity-20" />
              </div>
            )}
            
            <h2 className="text-lg font-bold text-foreground mb-4">Informations</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Difficulté</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  level === 'expert' ? 'bg-red-500/10 text-red-400' :
                  level === 'intermediate' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-green-500/10 text-green-400'
                }`}>
                  {level}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-sm text-muted-foreground">Elo Puzzle</span>
                <span className="text-sm font-mono font-bold text-foreground">{puzzle.rating}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-muted-foreground">Statut</span>
                <span className={`text-sm font-bold flex items-center gap-2 ${
                  status === 'completed' ? 'text-primary' :
                  status === 'wrong' ? 'text-destructive' :
                  'text-foreground'
                }`}>
                  {status === 'completed' ? 'Terminé' : 
                   status === 'wrong' ? 'Réessayez !' : 
                   status === 'correct' ? 'Excellent...' : 
                   wrongMoves > 0 ? `Essai #${wrongMoves + 1}` : 'À vous de jouer'}
                </span>
              </div>
            </div>
          </div>

          {/* Themes Tags */}
          <div className="bg-surface-container rounded-2xl p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Thèmes</p>
            <div className="flex flex-wrap gap-2">
              {puzzle.themes.slice(0, 6).map(theme => (
                <span key={theme} className="px-3 py-1 bg-surface-high rounded-full text-[11px] text-foreground border border-white/5 capitalize">
                  {theme.replace(/[A-Z]/g, ' $&').trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-surface-container rounded-2xl p-6 space-y-3">
            <button
              onClick={() => {
                setShowHint(true)
                engineShowHint()
              }}
              disabled={status !== 'playing' || showHint || isAutoPlaying}
              className="group w-full flex items-center bg-surface-lowest hover:bg-surface-low p-4 rounded-xl transition-all duration-200 border border-white/5 disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-400/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Indice</p>
                <p className="text-[10px] text-muted-foreground uppercase opacity-60">-5 Points</p>
              </div>
              <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground" />
            </button>

            {showHint && (
              <div className="p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-xl animate-fade-in">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Indices thématiques : <span className="text-foreground font-medium">{puzzle.themes.slice(0, 3).join(' • ')}</span>. 
                  Analysez bien la position du roi adverse et des pièces non protégées.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setShowSolution(true)
                enginePlaySolution()
              }}
              disabled={status !== 'playing' || isAutoPlaying}
              className="group w-full flex items-center bg-surface-lowest hover:bg-surface-low p-4 rounded-xl transition-all duration-200 border border-white/5 disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Solution</p>
                <p className="text-[10px] text-muted-foreground uppercase opacity-60">-15 Points</p>
              </div>
              <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground" />
            </button>

            {showSolution && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl animate-fade-in">
                <p className="text-sm font-bold text-primary mb-2">Séquence gagnante :</p>
                <div className="flex flex-wrap gap-2">
                  {puzzle.solution.map((move, i) => (
                    <span key={i} className={`text-xs p-1.5 rounded ${i % 2 === 0 ? 'bg-primary/20 text-primary' : 'bg-surface-high text-muted-foreground'}`}>
                      {move}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full flex items-center justify-center py-4 rounded-xl gradient-primary text-[#152800] font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Réinitialiser le puzzle
            </button>
          </div>
        </div>
      </div>

      {status === 'completed' && ratingGain !== null && userRating !== null && (
        <CompletionOverlay 
          points={earnedPoints}
          ratingGain={ratingGain}
          newRating={userRating}
          onReset={() => {
            reset()
            setRatingGain(null)
          }}
        />
      )}
    </div>
  )
}
