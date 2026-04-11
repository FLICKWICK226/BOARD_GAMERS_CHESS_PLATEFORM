'use client'

import { useState } from 'react'
import { updateLevel } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'

interface LevelSelectorProps {
  currentLevel: string
}

const levelOptions = [
  { id: 'beginner', label: 'Débutant', elo: '<800' },
  { id: 'intermediate', label: 'Intermédiaire', elo: '800–1400' },
  { id: 'expert', label: 'Expert', elo: '>1800' },
]

export function LevelSelector({ currentLevel }: LevelSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleUpdate = async (levelId: string) => {
    if (levelId === currentLevel) return
    
    setLoading(levelId)
    try {
      const result = await updateLevel(levelId)
      if (result.success) {
        router.refresh()
      } else {
        alert('Erreur: ' + result.error)
      }
    } catch (e) {
      alert('Une erreur est survenue.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-surface-container rounded-xl p-5">
      <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-4">
        Changer de niveau
      </p>
      <div className="space-y-2">
        {levelOptions.map(level => {
          const isCurrentLevel = level.id === currentLevel
          const isLoading = loading === level.id

          return (
            <button
              key={level.id}
              onClick={() => handleUpdate(level.id)}
              disabled={!!loading}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm
                transition-all duration-150
                ${isCurrentLevel
                  ? 'bg-primary/15 text-primary border border-primary/20 font-medium'
                  : 'bg-surface-high text-muted-foreground hover:bg-surface-bright hover:text-foreground border border-transparent'
                }
                ${isLoading ? 'opacity-50 cursor-wait animate-pulse' : ''}
                ${!!loading && !isLoading ? 'opacity-80 cursor-not-allowed' : ''}
              `}
            >
              <span>{level.label}</span>
              <span className="text-[10px] font-mono opacity-70">Elo {level.elo}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
