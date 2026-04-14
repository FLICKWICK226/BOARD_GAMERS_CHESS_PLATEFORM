'use client'

import { useState } from 'react'
import { Bot, Cpu, Zap, ChevronRight, Star, Clock } from 'lucide-react'
import { EngineLevel } from '@/hooks/use-stockfish'
import { GameView } from './GameView'

const LEVEL_RANGES = {
  beginner: { min: 1, max: 3, default: 2, elo: '400–800', depth: 5 },
  intermediate: { min: 8, max: 12, default: 10, elo: '1000–1400', depth: 10 },
  expert: { min: 18, max: 20, default: 20, elo: '1800–2200', depth: 15 },
}

const levels = [
  {
    id: 'beginner' as const,
    label: 'Débutant',
    icon: Star,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    description: 'Parfait pour apprendre les bases. L\'IA fait des erreurs intentionnelles.',
    features: ['Plage UCI : 1-3', 'Temps de réflexion lent', 'Idéal pour débuter'],
  },
  {
    id: 'intermediate' as const,
    label: 'Intermédiaire',
    icon: Cpu,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
    description: 'Un adversaire équilibré qui exploite vos erreurs tactiques.',
    features: ['Plage UCI : 8-12', 'Tactiques de base', 'Jeu positionnel solide'],
  },
  {
    id: 'expert' as const,
    label: 'Expert',
    icon: Zap,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
    description: 'Aucune pitié. L\'IA exploitera chaque faiblesse.',
    features: ['Plage UCI : 18-20', 'Analyse multi-coups', 'Finales précises'],
  },
]

const timeControls = [
  { id: 'blitz', label: 'Blitz', time: '5 min' },
  { id: 'rapid', label: 'Rapide', time: '10 min' },
  { id: 'classic', label: 'Classique', time: '30 min' },
]

export default function PlayPage() {
  const [selectedCategory, setSelectedCategory] = useState<EngineLevel['category'] | null>(null)
  const [currentSkill, setCurrentSkill] = useState<number>(10)
  const [selectedTime, setSelectedTime] = useState('rapid')
  const [isPlaying, setIsPlaying] = useState(false)

  const handleCategorySelect = (category: EngineLevel['category']) => {
    setSelectedCategory(category)
    setCurrentSkill(LEVEL_RANGES[category].default)
  }

  const selectedLevel: EngineLevel | null = selectedCategory ? {
    category: selectedCategory,
    skill: currentSkill,
    depth: LEVEL_RANGES[selectedCategory].depth
  } : null

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

  const activeLevelData = selectedCategory ? levels.find(l => l.id === selectedCategory) : null

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
            const isSelected = selectedCategory === level.id
            return (
              <button
                key={level.id}
                onClick={() => handleCategorySelect(level.id)}
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
                  <span className={`text-sm font-mono font-bold ${level.color}`}>
                    {LEVEL_RANGES[level.id].elo}
                  </span>
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

      {/* Granular Slider - Appears ONLY when a category is selected */}
      {selectedCategory && activeLevelData && (
        <div className="bg-surface-container rounded-xl p-8 border border-primary/10 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Ajustement Précis : {activeLevelData.label}
                <span className={`px-2 py-0.5 rounded text-[10px] bg-primary/20 ${activeLevelData.color}`}>
                  Level {currentSkill}
                </span>
              </h4>
              <p className="text-xs text-muted-foreground">
                Affinez le niveau de compétence UCI pour ce niveau de bot.
              </p>
            </div>
            
            <div className="flex-1 max-w-md w-full space-y-4">
              <input 
                type="range"
                aria-label={`Niveau UCI pour ${activeLevelData.label}`}
                min={LEVEL_RANGES[selectedCategory].min}
                max={LEVEL_RANGES[selectedCategory].max}
                step="1"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(parseInt(e.target.value))}
                className="w-full h-1.5 bg-surface-highest rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-1">
                <span>UCI Level {LEVEL_RANGES[selectedCategory].min}</span>
                <span>UCI Level {LEVEL_RANGES[selectedCategory].max}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
            ${selectedCategory ? activeLevelData?.bg : 'bg-surface-high'}
          `}>
            <Bot className={`w-10 h-10 ${selectedCategory ? activeLevelData?.color : 'text-muted-foreground'}`} />
          </div>

          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-1">Votre adversaire</p>
            <h3 className="text-xl font-semibold text-foreground">
              {selectedCategory ? `Bot ${activeLevelData?.label} (UCI ${currentSkill})` : 'Sélectionnez un niveau'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedCategory
                ? `Elo ${selectedCategory ? LEVEL_RANGES[selectedCategory].elo : ''} · ${timeControls.find(t => t.id === selectedTime)?.time} par joueur`
                : 'Choisissez un niveau de difficulté ci-dessus.'
              }
            </p>
          </div>

          <button
            disabled={!selectedCategory}
            onClick={() => setIsPlaying(true)}
            className={`
              flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm
              transition-all duration-200 whitespace-nowrap
              ${selectedCategory
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
