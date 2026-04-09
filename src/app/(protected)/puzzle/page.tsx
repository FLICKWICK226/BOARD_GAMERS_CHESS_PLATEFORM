'use client'

import { useState } from 'react'
import { Lightbulb, Eye, ChevronRight, Clock, Star } from 'lucide-react'

const puzzleData = {
  id: 42,
  title: 'Tactical Masterpiece #42',
  description: 'Blancs jouent et trouvent le coup décisif. Cette position illustre un thème de fourchette combinée avec un clouage tactique.',
  difficulty: 'Expert',
  rating: 1820,
  theme: 'Fourchette • Clouage',
  timeEstimate: '3-5 min',
}

// Simple 8x8 board representation — unicode pieces
const BOARD: string[][] = [
  ['♜','♞','♝','♛','♚','♝','','♜'],
  ['♟','♟','♟','','♟','♟','♟','♟'],
  ['','','','','','♞','',''],
  ['','','','♟','','','',''],
  ['','','','♙','♙','','',''],
  ['','','♘','','','','',''],
  ['♙','♙','♙','','','♙','♙','♙'],
  ['♖','♘','♗','♕','♔','♗','','♖'],
]

export default function PuzzlePage() {
  const [hint, setHint] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Puzzle du jour</h1>
        <p className="text-muted-foreground mt-1 text-sm">Résolvez le puzzle tactique du jour pour maintenir votre série.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Chessboard */}
        <div className="bg-surface-container rounded-xl overflow-hidden">
          {/* Board header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--outline-variant)]/10">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#e8e4e0]" />
              <span className="text-sm text-foreground font-medium">Blancs</span>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Votre tour
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">Noirs</span>
              <div className="w-2.5 h-2.5 rounded-full bg-[#2a2825]" />
            </div>
          </div>

          {/* Board */}
          <div className="p-5">
            <div className="relative">
              {/* File labels */}
              <div className="flex pl-5 mb-1">
                {['a','b','c','d','e','f','g','h'].map(f => (
                  <div key={f} className="flex-1 text-center text-[10px] text-muted-foreground uppercase">{f}</div>
                ))}
              </div>
              <div className="flex gap-1">
                {/* Rank labels */}
                <div className="flex flex-col">
                  {[8,7,6,5,4,3,2,1].map(r => (
                    <div key={r} className="flex-1 flex items-center justify-center w-4 text-[10px] text-muted-foreground" style={{height: '100%', minHeight: '36px'}}>
                      {r}
                    </div>
                  ))}
                </div>
                {/* Board squares */}
                <div className="grid grid-cols-8 flex-1 rounded-lg overflow-hidden shadow-ambient">
                  {BOARD.flatMap((row, ri) =>
                    row.map((piece, ci) => {
                      const isLight = (ri + ci) % 2 === 0
                      const squareId = `${ri}-${ci}`
                      const isSelected = selected === squareId
                      return (
                        <div
                          key={squareId}
                          onClick={() => setSelected(isSelected ? null : squareId)}
                          className={`
                            aspect-square flex items-center justify-center text-xl sm:text-2xl cursor-pointer
                            transition-colors duration-100 select-none
                            ${isLight ? 'bg-[#c8b88a]' : 'bg-[#6b4f2e]'}
                            ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}
                            hover:brightness-110
                          `}
                        >
                          {piece}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Board footer hint */}
          {hint && (
            <div className="mx-5 mb-4 px-4 py-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary font-medium">💡 Indice</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cherchez une fourchette qui attaque simultanément le roi et la dame adverse.
              </p>
            </div>
          )}
          {revealed && (
            <div className="mx-5 mb-4 px-4 py-3 bg-surface-high rounded-lg">
              <p className="text-sm text-foreground font-medium">✅ Solution</p>
              <p className="text-sm text-muted-foreground mt-1">
                <strong className="text-primary">1. Cf6+</strong> — La fourchette royale force la prise du cavalier avant de capturer la dame en e8.
              </p>
            </div>
          )}
        </div>

        {/* Right — Control panel */}
        <div className="space-y-4">
          {/* Puzzle info */}
          <div className="bg-surface-container rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{puzzleData.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{puzzleData.description}</p>
              </div>
              <span className="flex-shrink-0 ml-3 px-3 py-1 rounded-full text-[11px] font-medium bg-red-400/10 text-red-400 uppercase tracking-wider">
                {puzzleData.difficulty}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Elo puzzle', value: puzzleData.rating },
                { label: 'Thème', value: 'Fourchette' },
                { label: 'Durée est.', value: puzzleData.timeEstimate },
              ].map(item => (
                <div key={item.label} className="bg-surface-high rounded-lg p-3 text-center">
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-surface-container rounded-xl p-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-4">Actions</p>

            <button
              onClick={() => setHint(!hint)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-high hover:bg-surface-bright
                text-sm text-foreground font-medium transition-colors duration-150"
            >
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              {hint ? 'Masquer l\'indice' : 'Obtenir un indice'}
              <span className="ml-auto text-[10px] text-muted-foreground">-5 pts</span>
            </button>

            <button
              onClick={() => setRevealed(!revealed)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-high hover:bg-surface-bright
                text-sm text-foreground font-medium transition-colors duration-150"
            >
              <Eye className="w-4 h-4 text-muted-foreground" />
              {revealed ? 'Masquer la solution' : 'Voir la solution'}
              <span className="ml-auto text-[10px] text-muted-foreground">-15 pts</span>
            </button>

            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                gradient-primary glow-primary glow-primary-hover
                text-[#152800] text-sm font-semibold transition-all duration-200"
            >
              Puzzle suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Rating feedback */}
          <div className="bg-surface-container rounded-xl p-5">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-3">Évaluer ce puzzle</p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button key={star} className="text-2xl text-surface-bright hover:text-yellow-400 transition-colors duration-100">
                  <Star className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
