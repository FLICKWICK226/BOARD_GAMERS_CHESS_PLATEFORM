'use client'

import { useCallback, useRef } from 'react'

// ── Sound type definitions ─────────────────────────────────────────
// Universal (all boards) :  move | capture | check
// Puzzle-specific         :  correct | wrong | success
type ChessSound = 'move' | 'capture' | 'check' | 'correct' | 'wrong' | 'success'

const SOUND_MAP: Record<ChessSound, string> = {
  move:    '/sounds/move.mp3',       // moving_piece
  capture: '/sounds/capture.mp3',   // captured_piece
  check:   '/sounds/check.mp3',     // unauthorizied_move (alert)
  correct: '/sounds/correct.mp3',   // moving_piece (positive confirmation)
  wrong:   '/sounds/wrong.mp3',     // wrong_puzzlemove
  success: '/sounds/success.mp3',   // puzzle_solved_victory
}

export function useSoundEffects() {
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  const playSound = useCallback((sound: ChessSound) => {
    try {
      // Lazy-initialise audio objects only once per sound type
      if (!audioRefs.current[sound]) {
        audioRefs.current[sound] = new Audio(SOUND_MAP[sound])
        audioRefs.current[sound]!.preload = 'auto'
      }

      const audio = audioRefs.current[sound]!
      audio.currentTime = 0
      audio.play().catch(err => console.warn(`Sound play failed for ${sound}:`, err))
    } catch (err) {
      console.warn(`Sound init failed for ${sound}:`, err)
    }
  }, [])

  return { playSound }
}
