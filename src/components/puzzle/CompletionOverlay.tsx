'use client'

import { Trophy, ArrowUpRight, Home, RefreshCw, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface CompletionOverlayProps {
  points: number
  ratingGain: number
  newRating: number
  onReset: () => void
}

export function CompletionOverlay({ points, ratingGain, newRating, onReset }: CompletionOverlayProps) {
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
        <p className="text-muted-foreground text-sm mb-8">
          Votre précision tactique s&apos;améliore. Continuez sur cette lancée !
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface-high rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Points</p>
            <p className="text-xl font-mono font-bold text-foreground">+{points}</p>
          </div>
          <div className="bg-surface-high rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Elo Tactique</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-xl font-mono font-bold text-primary">{newRating}</p>
              <span className="text-xs text-primary flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                {ratingGain}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onReset}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-[#152800] font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            Rejouer ce puzzle
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard"
              className="h-12 flex items-center justify-center gap-2 rounded-xl bg-surface-high text-foreground font-bold text-sm transition-all hover:bg-surface-bright border border-white/5"
            >
              <Home className="w-4 h-4 text-muted-foreground" />
              Menu
            </Link>
            <button
               onClick={() => window.location.reload()}
               className="h-12 flex items-center justify-center gap-2 rounded-xl bg-surface-high text-foreground font-bold text-sm transition-all hover:bg-surface-bright border border-white/5"
            >
              Suivant
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
