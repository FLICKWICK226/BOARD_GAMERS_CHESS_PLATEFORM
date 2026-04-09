'use client'

import React, { useMemo, useEffect, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import { PuzzleStatus } from '@/hooks/use-puzzle-engine'
import { useSoundEffects } from '@/hooks/use-sound-effects'

interface PuzzleBoardProps {
  fen: string
  orientation?: 'white' | 'black'
  status?: PuzzleStatus
  lastMove?: { from: string; to: string } | null
  customArrows?: [string, string, string][]
  onMove?: (move: { from: string; to: string; promotion?: string }) => boolean
}

export function PuzzleBoard({
  fen,
  orientation = 'white',
  status,
  lastMove,
  customArrows,
  onMove,
}: PuzzleBoardProps) {
  const { playSound } = useSoundEffects()
  const prevLastMove = useRef(lastMove)

  // Custom styles to match "Tactical Precision" theme
  const boardStyles = useMemo(() => ({
    darkSquareStyle: { backgroundColor: '#2d333b' }, // Deep Slate-Blue
    lightSquareStyle: { backgroundColor: '#e6edf3' }, // Off-white/Slate light
    boardStyle: {
      borderRadius: '8px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      overflow: 'hidden',
    },
  }), [])

  // Sound effects based on status and moves
  useEffect(() => {
    if (status === 'correct') {
      playSound('correct')
    } else if (status === 'wrong') {
      playSound('wrong')
    } else if (status === 'completed') {
      playSound('success')
    }
  }, [status, playSound])

  // Play normal move sound when lastMove changes (and it's not a correct/wrong special case)
  useEffect(() => {
    if (lastMove && lastMove !== prevLastMove.current) {
      if (status === 'playing' || status === 'correct') {
        playSound('move')
      }
      prevLastMove.current = lastMove
    }
  }, [lastMove, status, playSound])

  // Highlight the last move and add feedback colors
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {}
    
    if (lastMove) {
      let highlightColor = 'rgba(160, 214, 96, 0.35)' // Default Tactical Green (correct/last)
      
      if (status === 'wrong') {
        highlightColor = 'rgba(239, 68, 68, 0.4)' // Red for wrong moves
      } else if (status === 'correct' || status === 'completed') {
        highlightColor = 'rgba(160, 214, 96, 0.5)' // Solid Green
      }

      styles[lastMove.from] = { backgroundColor: highlightColor }
      styles[lastMove.to] = { backgroundColor: highlightColor }
    }

    return styles
  }, [lastMove, status])

  function onPieceDrop({ piece, sourceSquare, targetSquare }: { piece: { pieceType: string }; sourceSquare: string; targetSquare: string | null }) {
    if (!targetSquare) return false

    const pType = piece.pieceType;
    const isPawn = pType.toLowerCase().endsWith('p');
    const color = pType[0];

    const promotion = isPawn && 
      ((targetSquare[1] === '8' && color === 'w') || (targetSquare[1] === '1' && color === 'b'))
      ? 'q'
      : undefined

    const success = onMove?.({
      from: sourceSquare,
      to: targetSquare,
      promotion,
    })

    return success ?? false
  }

  return (
    <div className={`
      relative w-full aspect-square max-w-[500px] mx-auto 
      transition-all duration-300
      ${status === 'wrong' ? 'animate-shake' : ''}
    `}>
      <Chessboard
        // @ts-expect-error - position prop is missing in some types but works in runtime
        position={fen}
        onPieceDrop={onPieceDrop}
        boardOrientation={orientation}
        customDarkSquareStyle={boardStyles.darkSquareStyle}
        customLightSquareStyle={boardStyles.lightSquareStyle}
        customBoardStyle={boardStyles.boardStyle}
        customSquareStyles={customSquareStyles}
        customArrows={customArrows}
        animationDuration={300}
      />
      
      {/* Overlay for status */}
      {status === 'completed' && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-lg z-10 animate-fade-in">
          <div className="bg-surface-container p-6 rounded-xl border border-primary/20 shadow-2xl text-center">
            <h3 className="text-xl font-bold text-primary mb-1">Puzzle Réussi !</h3>
            <p className="text-sm text-muted-foreground">Série maintenue : 🔥 5 jours</p>
          </div>
        </div>
      )}
    </div>
  )
}
