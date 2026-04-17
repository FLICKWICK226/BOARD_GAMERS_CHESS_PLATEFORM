'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useChessGame } from '@/hooks/use-chess-game';
import { EngineLevel } from '@/hooks/use-stockfish';
import { useChessClock, formatTime } from '@/hooks/use-chess-clock';
import { Bot, RotateCcw, ArrowLeft, Trophy, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameViewProps {
  level: EngineLevel;
  timeSeconds: number;
  onBack: () => void;
}

function ClockDisplay({ time, active, label, isTop }: { time: number; active: boolean; label: string; isTop?: boolean }) {
  const low = time < 30_000 // less than 30s
  const critical = time < 10_000 // less than 10s

  return (
    <div className={`
      flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300
      ${active
        ? critical
          ? 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/10'
          : low
            ? 'bg-yellow-400/10 border-yellow-400/30'
            : 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/10'
        : 'bg-surface-container border-border/50'
      }
      ${isTop ? 'rounded-b-none' : 'rounded-t-none'}
    `}>
      <div className="flex items-center gap-2">
        <Clock className={`w-4 h-4 ${active ? (critical ? 'text-red-400' : 'text-primary') : 'text-muted-foreground'}`} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className={`
        font-mono text-2xl font-bold tabular-nums tracking-tight transition-colors
        ${active
          ? critical
            ? 'text-red-400 animate-pulse'
            : low
              ? 'text-yellow-400'
              : 'text-foreground'
          : 'text-muted-foreground'
        }
      `}>
        {formatTime(time)}
      </span>
    </div>
  )
}

export function GameView({ level, timeSeconds, onBack }: GameViewProps) {
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const moveCountRef = useRef(0);

  const {
    fen,
    moveHistory,
    makeMove,
    resetGame,
    undoMove,
    thinking,
    isReady,
    engineError,
  } = useChessGame({
    level,
    onGameOver: (result) => {
      setGameResult(result)
      clockPause()
    },
  });

  const {
    whiteTime,
    blackTime,
    activePlayer,
    isExpired,
    start: clockStart,
    switchTurn: clockSwitch,
    pause: clockPause,
    reset: clockReset,
  } = useChessClock({
    initialTimeMs: timeSeconds * 1000,
    onExpire: (loser) => {
      const winner = loser === 'white' ? 'Noirs' : 'Blancs'
      setGameResult(`${winner} gagnent au temps !`)
    },
  });

  // Start the clock on first player move
  useEffect(() => {
    if (moveHistory.length === 1 && !activePlayer) {
      clockStart('white')
    }
  }, [moveHistory.length, activePlayer, clockStart])

  // Switch clock on each move (ref avoids setState-in-effect cascade)
  useEffect(() => {
    if (moveHistory.length > moveCountRef.current && moveHistory.length > 1) {
      clockSwitch()
      moveCountRef.current = moveHistory.length
    }
  }, [moveHistory.length, clockSwitch])

  // ── Legal move highlighting ──────────────────────────────────────
  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    if (!selectedSquare) return {}

    const tempGame = new Chess(fen)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moves = tempGame.moves({ square: selectedSquare as any, verbose: true })

    const styles: Record<string, React.CSSProperties> = {
      [selectedSquare]: { backgroundColor: 'rgba(160, 214, 96, 0.45)' },
    }

    moves.forEach((m) => {
      const isCapture = !!m.captured
      styles[m.to] = isCapture
        ? { backgroundColor: 'rgba(239, 68, 68, 0.35)', borderRadius: '50%' }
        : {
            background: 'radial-gradient(circle, rgba(160,214,96,0.38) 28%, transparent 28%)',
          }
    })

    return styles
  }, [selectedSquare, fen])

  // ── Click-to-move ────────────────────────────────────────────────
  const handleSquareClick = useCallback(({ square }: { piece: { pieceType: string } | null; square: string }) => {
    if (thinking || gameResult || isExpired) return

    if (selectedSquare) {
      const moved = makeMove({ from: selectedSquare, to: square, promotion: 'q' })
      if (moved) {
        setSelectedSquare(null)
        return
      }
    }

    const tempGame = new Chess(fen)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const piece = tempGame.get(square as any)
    if (piece && piece.color === tempGame.turn()) {
      setSelectedSquare(square)
    } else {
      setSelectedSquare(null)
    }
  }, [selectedSquare, makeMove, thinking, gameResult, isExpired, fen])

  // ── Drag-and-drop ────────────────────────────────────────────────
  function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) {
    if (!targetSquare || isExpired) return false;
    setSelectedSquare(null)
    return makeMove({ from: sourceSquare, to: targetSquare, promotion: 'q' }) ?? false;
  }

  // ── Move history pairs ──────────────────────────────────────────
  const movePairs = useMemo(() => {
    const pairs: [string, string | undefined][] = []
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push([moveHistory[i], moveHistory[i + 1]])
    }
    return pairs
  }, [moveHistory])

  // ── Reset helper ─────────────────────────────────────────────────
  function handleReset() {
    resetGame()
    setGameResult(null)
    setSelectedSquare(null)
    moveCountRef.current = 0
    clockReset()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── Left Sidebar: Controls ─────────────────────────────── */}
      <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux niveaux
        </Button>

        {/* Engine status card */}
        <div className="bg-surface-container rounded-xl p-5 border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-tight">IA Stockfish</h3>
              <p className="text-xs text-muted-foreground capitalize">
                {level.category} (UCI {level.skill})
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Statut :</span>
              <span className={`font-medium ${engineError ? 'text-red-400' : isReady ? 'text-green-400' : 'text-yellow-400'}`}>
                {engineError ? 'Erreur' : isReady ? (thinking ? 'Réflexion...' : 'En attente') : 'Initialisation...'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Cadence :</span>
              <span className="font-medium text-foreground">
                {timeSeconds >= 1800 ? 'Classique' : timeSeconds >= 600 ? 'Rapide' : 'Blitz'} ({Math.floor(timeSeconds / 60)} min)
              </span>
            </div>

            {engineError ? (
              <div className="flex items-center gap-2 text-[10px] text-red-400/80 bg-red-400/5 p-2 rounded border border-red-400/10">
                <AlertCircle className="w-3 h-3" />
                {engineError}
              </div>
            ) : !isReady && (
              <div className="flex items-center gap-2 text-[10px] text-yellow-400/80 bg-yellow-400/5 p-2 rounded border border-yellow-400/10">
                <AlertCircle className="w-3 h-3" />
                Chargement du moteur WASM...
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Recommencer
          </Button>
          <Button
            onClick={() => { undoMove(); setSelectedSquare(null) }}
            variant="outline"
            disabled={thinking || moveHistory.length < 2}
            className="w-full justify-start gap-2"
          >
            Annuler le coup
          </Button>
        </div>
      </div>

      {/* ── Main Board ────────────────────────────────────────────── */}
      <div className="lg:col-span-6 order-1 lg:order-2">
        {/* Black Clock (top) */}
        <ClockDisplay time={blackTime} active={activePlayer === 'black'} label="Noirs (IA)" isTop />

        <div className="relative aspect-square max-w-[600px] mx-auto group">
          <div className="absolute -inset-2 bg-gradient-to-b from-primary/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative rounded-none overflow-hidden border-x border-white/5 shadow-2xl touch-none">
            <Chessboard
              options={{
                position: fen,
                onPieceDrop: onDrop,
                onSquareClick: handleSquareClick,
                boardOrientation: 'white',
                darkSquareStyle: { backgroundColor: '#2d333b' },
                lightSquareStyle: { backgroundColor: '#e6edf3' },
                squareStyles: squareStyles,
                animationDurationInMs: 300,
              }}
            />
          </div>

          {/* Game Over Overlay */}
          {(gameResult || isExpired) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center animate-in fade-in zoom-in duration-300">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative bg-surface-high border border-primary/20 p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Partie terminée</h2>
                <p className="text-muted-foreground mb-6 font-medium">{gameResult}</p>
                <div className="flex gap-3">
                  <Button onClick={handleReset} className="flex-1 gradient-primary text-[#152800]">
                    Rejouer
                  </Button>
                  <Button onClick={onBack} variant="outline" className="flex-1">
                    Quitter
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* White Clock (bottom) */}
        <ClockDisplay time={whiteTime} active={activePlayer === 'white'} label="Blancs (Vous)" />
      </div>

      {/* ── Right Sidebar: Move History ───────────────────────────── */}
      <div className="lg:col-span-3 space-y-6 order-3">
        <div className="bg-surface-container rounded-xl p-5 border border-border/50 h-[480px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Historique
            </h3>
            <span className="text-[10px] text-muted-foreground">
              {moveHistory.length} coup{moveHistory.length !== 1 ? 's' : ''}
            </span>
          </div>

          {movePairs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-muted-foreground text-center italic">
                Les coups s&apos;afficheront ici.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
              {movePairs.map(([white, black], idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-[28px_1fr_1fr] gap-1 px-1 py-1 rounded text-xs
                    ${idx === movePairs.length - 1 ? 'bg-primary/5' : 'hover:bg-surface-high'}`}
                >
                  <span className="text-muted-foreground/60 font-mono text-[10px] pt-0.5">
                    {idx + 1}.
                  </span>
                  <span className="font-mono font-medium text-foreground">{white}</span>
                  {black && (
                    <span className="font-mono text-muted-foreground">{black}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
