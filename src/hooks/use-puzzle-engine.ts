import { useState, useCallback, useEffect } from 'react'
import { Chess } from 'chess.js'

export type PuzzleStatus = 'playing' | 'correct' | 'wrong' | 'completed' | 'failed'

interface PuzzleStats {
  wrongMoves: number
  timeSpent: number // seconds
  status: PuzzleStatus
}

interface UsePuzzleEngineProps {
  initialFen: string
  solution: string[] // UCI moves like ['e2e4', 'e7e5']
  onComplete?: (stats: PuzzleStats) => void
  onCorrectMove?: (move: string, isCapture: boolean) => void
  onWrongMove?: (move: string) => void
}

// Standard starting FEN — safe fallback when puzzle hasn't loaded yet
const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export function usePuzzleEngine({
  initialFen,
  solution,
  onComplete,
  onCorrectMove,
  onWrongMove,
}: UsePuzzleEngineProps) {
  const safeFen = initialFen && initialFen.trim().length > 0 ? initialFen : DEFAULT_FEN
  const [game, setGame] = useState(() => new Chess(safeFen))
  const [moveIndex, setMoveIndex] = useState(0)
  const [status, setStatus] = useState<PuzzleStatus>('playing')
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [customArrows, setCustomArrows] = useState<[string, string, string][]>([])
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  
  // Stats
  const [wrongMoves, setWrongMoves] = useState(0)
  const [startTime, setStartTime] = useState<number>(() => Date.now())

  // Reset when initialFen changes (skip empty values)
  useEffect(() => {
    if (!initialFen || initialFen.trim().length === 0) return
    setGame(new Chess(initialFen))
    setMoveIndex(0)
    setStatus('playing')
    setLastMove(null)
    setCustomArrows([])
    setIsAutoPlaying(false)
    setWrongMoves(0)
    setStartTime(Date.now())
  }, [initialFen])

  const finishPuzzle = useCallback((finalStatus: PuzzleStatus, currentWrongMoves: number) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    setStatus(finalStatus)
    onComplete?.({
      wrongMoves: currentWrongMoves,
      timeSpent,
      status: finalStatus
    })
  }, [startTime, onComplete])

  const makeMove = useCallback(
    (move: string | { from: string, to: string, promotion?: string }) => {
      if (status === 'completed' || status === 'failed' || isAutoPlaying) return false

      // Clear any hints when user makes a move
      if (customArrows.length > 0) setCustomArrows([])

      const gameCopy = new Chess(game.fen())
      
      try {
        const result = gameCopy.move(move)
        if (!result) return false

        const isCapture = result.captured !== undefined
        const expectedMove = solution[moveIndex]
        const playedUci = result.from + result.to + (result.promotion || '')
        
        if (playedUci === expectedMove) {
          // Correct move!
          setGame(gameCopy)
          const nextIndex = moveIndex + 1
          setMoveIndex(nextIndex)
          setStatus('correct')
          setLastMove({ from: result.from, to: result.to })
          onCorrectMove?.(playedUci, isCapture)

          // Is there a computer response?
          if (nextIndex < solution.length) {
            // Play computer's turn with a small delay
            setTimeout(() => {
              const computerMoveUci = solution[nextIndex]
              const nextGameCopy = new Chess(gameCopy.fen())
              const compResult = nextGameCopy.move(computerMoveUci)
              
              if (compResult) {
                setGame(nextGameCopy)
                const afterCompIndex = nextIndex + 1
                setMoveIndex(afterCompIndex)
                setLastMove({ from: compResult.from, to: compResult.to })
                
                // If this was the last move in the solution, it's completed
                if (afterCompIndex >= solution.length) {
                  finishPuzzle('completed', wrongMoves)
                } else {
                  setStatus('playing')
                }
              }
            }, 600)
          } else {
            // No more moves, puzzle completed
            finishPuzzle('completed', wrongMoves)
          }
          return true
        } else {
          // Wrong move
          setWrongMoves(prev => prev + 1)
          setStatus('wrong')
          onWrongMove?.(playedUci)
          
          // Reset to before the wrong move after a delay
          setTimeout(() => setStatus('playing'), 1000)
          return false
        }
      } catch {
        return false
      }
    },
    [game, moveIndex, solution, status, wrongMoves, finishPuzzle, onCorrectMove, onWrongMove, customArrows.length, isAutoPlaying]
  )

  return {
    game,
    fen: game.fen(),
    status,
    moveIndex,
    lastMove,
    wrongMoves,
    makeMove,
    showHint: () => {
      const nextMove = solution[moveIndex]
      if (!nextMove) return
      const from = nextMove.substring(0, 2)
      const to = nextMove.substring(2, 4)
      setCustomArrows([[from, to, 'rgba(255, 255, 0, 0.6)']]) // Semitransparent Yellow
    },
    playSolution: () => {
      if (status === 'completed' || isAutoPlaying) return
      setIsAutoPlaying(true)
      setStatus('playing')
      setCustomArrows([])

      let currentIndex = moveIndex
      
      const playNext = () => {
        if (currentIndex >= solution.length) {
          setIsAutoPlaying(false)
          finishPuzzle('completed', wrongMoves)
          return
        }

        const moveUci = solution[currentIndex]
        // Use functional update for game to ensure we always use latest state in the timeout chain
        setGame((prevGame) => {
          const gameCopy = new Chess(prevGame.fen())
          const result = gameCopy.move(moveUci)
          
          if (result) {
            setLastMove({ from: result.from, to: result.to })
            setMoveIndex(currentIndex + 1)
            currentIndex++
            setTimeout(playNext, 800)
            return gameCopy
          } else {
            setIsAutoPlaying(false)
            return prevGame
          }
        })
      }

      playNext()
    },
    customArrows,
    isAutoPlaying,
    reset: () => {
      const resetFen = initialFen && initialFen.trim().length > 0 ? initialFen : DEFAULT_FEN
      setGame(new Chess(resetFen))
      setMoveIndex(0)
      setStatus('playing')
      setLastMove(null)
      setCustomArrows([])
      setIsAutoPlaying(false)
      setWrongMoves(0)
      setStartTime(Date.now())
    }
  }
}
