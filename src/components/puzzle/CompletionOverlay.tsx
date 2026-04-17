'use client'

import { Trophy, ArrowUpRight, Home, RefreshCw, ChevronRight, Flame } from 'lucide-react'
import Link from 'next/link'

interface CompletionOverlayProps {
  points: number
  ratingGain: number
  newRating: number
  streak: number
  onReset: () => void
  onNext?: () => void
}

export function CompletionOverlay({ points, ratingGain, newRating, streak, onReset, onNext }: CompletionOverlayProps) {
  const streakMessage = streak === 0
    ? 'Commence ta série !'
    : streak >= 7
      ? `🏆 Série légendaire !`
      : streak >= 3
        ? `Continue comme ça !`
        : `Bon début !`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container max-w-sm w-full rounded-3xl p-8 border border-primary/20 shadow-2xl shadow-primary/10 text-center animate-scale-in">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto ring-1 ring-primary/30">
            <Trophy className="w-10 h-10 text-primary animate-bounce" />
          </div>
          <div className="absolute -top-2 -right-2 bg-primary text-[#152800] text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
            BRAVO !
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">Puzzle Résolu</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Votre précision tactique s&apos;améliore. Continuez sur cette lancée !
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-surface-high rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Points</p>
            <p className="text-lg font-mono font-bold text-foreground">+{points}</p>
          </div>
          <div className="bg-surface-high rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Elo</p>
            <div className="flex items-center justify-center gap-1">
              <p className="text-lg font-mono font-bold text-primary">{newRating}</p>
              <span className="text-[10px] text-primary flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                {ratingGain}
              </span>
            </div>
          </div>
          <div className="bg-surface-high rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Série</p>
            <div className="flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <p className="text-lg font-mono font-bold text-foreground">{streak}</p>
            </div>
          </div>
        </div>

        {/* Streak message */}
        <p className="text-xs text-muted-foreground mb-6">
          🔥 {streak} jour{streak !== 1 ? 's' : ''} consécutif{streak !== 1 ? 's' : ''} — {streakMessage}
        </p>

        <div className="space-y-3">
          {onNext && (
            <button
              onClick={onNext}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-[#152800] font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
            >
              Puzzle suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onReset}
              className="h-12 flex items-center justify-center gap-2 rounded-xl bg-surface-high text-foreground font-bold text-sm transition-all hover:bg-surface-bright border border-white/5"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              Rejouer
            </button>
            <Link
              href="/dashboard"
              className="h-12 flex items-center justify-center gap-2 rounded-xl bg-surface-high text-foreground font-bold text-sm transition-all hover:bg-surface-bright border border-white/5"
            >
              <Home className="w-4 h-4 text-muted-foreground" />
              Menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
