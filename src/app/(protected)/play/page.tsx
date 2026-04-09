'use client'

import { useState } from 'react'
import { Bot, Cpu, Zap, ChevronRight, Star, Clock } from 'lucide-react'
import { EngineLevel } from '@/hooks/use-stockfish'
import { GameView } from './GameView'

const levels = [
  {
    id: 'beginner' as EngineLevel,
    label: 'Débutant',
    elo: '400–800',
    icon: Star,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    description: 'Parfait pour apprendre les bases. L\'IA fait des erreurs intentionnelles pour vous aider à progresser.',
    features: ['Pas de pièges tactiques', 'Temps de réflexion lent', 'Explications disponibles'],
  },
  {
    id: 'intermediate' as EngineLevel,
    label: 'Intermédiaire',
    elo: '1000–1400',
    icon: Cpu,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
    description: 'Un adversaire équilibré qui exploite vos erreurs tactiques tout en restant gérable.',
    features: ['Tactiques de base', 'Endgames corrects', 'Jeu positionnel solide'],
  },
  {
    id: 'expert' as EngineLevel,
    label: 'Expert',
    elo: '1800–2200',
    icon: Zap,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
    description: 'Aucune pitié. L\'IA joue au niveau Elo 2000+ et exploitera chaque faiblesse.',
    features: ['Analyse multi-coups', 'Finales précises', 'Ouvertures théoriques'],
  },
]

const timeControls = [
  { id: 'blitz', label: 'Blitz', time: '5 min' },
  { id: 'rapid', label: 'Rapide', time: '10 min' },
  { id: 'classic', label: 'Classique', time: '30 min' },
]

export default function PlayPage() {
  const [selectedLevel, setSelectedLevel] = useState<EngineLevel | null>(null)
  const [selectedTime, setSelectedTime] = useState('rapid')
  const [isPlaying, setIsPlaying] = useState(false)

  if (isPlaying && selectedLevel) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <GameView 
          level={selectedLevel} 
          onBack={() => setIsPlaying(false)} 
        />
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Jouer contre un Bot</h1>
        <p className="text-muted-foreground mt-1 text-sm">Choisissez votre adversaire et le contrôle du temps.</p>
      </div>

      {/* Level selection */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium">Niveau de difficulté</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {levels.map((level) => {
            const Icon = level.icon
            const isSelected = selectedLevel === level.id
            return (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`
                  relative text-left p-6 rounded-xl border transition-all duration-200
                  ${isSelected
                    ? `${level.bg} ${level.border} shadow-ambient`
                    : 'bg-surface-container border-transparent hover:bg-surface-high'
                  }
                `}
              >
                {isSelected && (
                  <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${level.color.replace('text-', 'bg-')}`} />
                )}

                <div className={`w-10 h-10 rounded-lg ${level.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${level.color}`} />
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-base font-semibold text-foreground">{level.label}</h3>
                  <span className={`text-sm font-mono font-bold ${level.color}`}>{level.elo}</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{level.description}</p>

                <ul className="space-y-1">
                  {level.features.map(feat => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className={`w-1 h-1 rounded-full ${isSelected ? level.color.replace('text-', 'bg-') : 'bg-muted-foreground'}`} />
                      {feat}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time control */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium">Contrôle du temps</p>
        <div className="flex gap-3">
          {timeControls.map(tc => (
            <button
              key={tc.id}
              onClick={() => setSelectedTime(tc.id)}
              className={`
                flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-150
                ${selectedTime === tc.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-surface-container text-muted-foreground hover:bg-surface-high'
                }
              `}
            >
              <Clock className="w-4 h-4" />
              {tc.label} · {tc.time}
            </button>
          ))}
        </div>
      </div>

      {/* Bot preview + CTA */}
      <div className="bg-surface-container rounded-xl p-6 border border-border/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Bot avatar */}
          <div className={`
            w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0
            ${selectedLevel ? levels.find(l => l.id === selectedLevel)?.bg : 'bg-surface-high'}
          `}>
            <Bot className={`w-10 h-10 ${selectedLevel ? levels.find(l => l.id === selectedLevel)?.color : 'text-muted-foreground'}`} />
          </div>

          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-1">Votre adversaire</p>
            <h3 className="text-xl font-semibold text-foreground">
              {selectedLevel ? `Bot ${levels.find(l => l.id === selectedLevel)?.label}` : 'Sélectionnez un niveau'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedLevel
                ? `Elo ${levels.find(l => l.id === selectedLevel)?.elo} · ${timeControls.find(t => t.id === selectedTime)?.time} par joueur`
                : 'Choisissez un niveau de difficulté ci-dessus.'
              }
            </p>
          </div>

          <button
            disabled={!selectedLevel}
            onClick={() => setIsPlaying(true)}
            className={`
              flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm
              transition-all duration-200 whitespace-nowrap
              ${selectedLevel
                ? 'gradient-primary glow-primary glow-primary-hover text-[#152800]'
                : 'bg-surface-high text-muted-foreground cursor-not-allowed opacity-50'
              }
            `}
          >
            Commencer la partie
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
