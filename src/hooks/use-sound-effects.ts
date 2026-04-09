'use client'

import { useCallback, useRef } from 'react'

type ChessSound = 'move' | 'capture' | 'check' | 'correct' | 'wrong' | 'success'

export function useSoundEffects() {
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  const playSound = useCallback((sound: ChessSound) => {
    // Lazy initialize audio objects
    if (!audioRefs.current[sound]) {
      // These paths should be populated with actual mp3 files in /public/sounds/
      const path = `/sounds/${sound}.mp3`
      audioRefs.current[sound] = new Audio(path)
    }

    const audio = audioRefs.current[sound]
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(err => console.warn(`Sound play failed for ${sound}:`, err))
    }
  }, [])

  return { playSound }
}
