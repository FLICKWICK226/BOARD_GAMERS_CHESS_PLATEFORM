import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'

type Player = 'white' | 'black'

interface ChessClockState {
  whiteTime: number       // remaining ms
  blackTime: number       // remaining ms
  activePlayer: Player | null
  isRunning: boolean
  isExpired: Player | null // which player ran out
}

interface UseChessClockOptions {
  initialTimeMs: number
  onExpire?: (loser: Player) => void
}

export function useChessClock({ initialTimeMs, onExpire }: UseChessClockOptions) {
  const [state, setState] = useState<ChessClockState>({
    whiteTime: initialTimeMs,
    blackTime: initialTimeMs,
    activePlayer: null,
    isRunning: false,
    isExpired: null,
  })

  const lastTickRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onExpireRef = useRef(onExpire)
  // Keep onExpireRef in sync without touching it during render
  useLayoutEffect(() => {
    onExpireRef.current = onExpire
  })

  const tick = useCallback(() => {
    const now = performance.now()
    const elapsed = now - lastTickRef.current
    lastTickRef.current = now

    setState(prev => {
      if (!prev.activePlayer || !prev.isRunning || prev.isExpired) return prev

      const key = prev.activePlayer === 'white' ? 'whiteTime' : 'blackTime'
      const newTime = Math.max(0, prev[key] - elapsed)

      if (newTime <= 0) {
        onExpireRef.current?.(prev.activePlayer)
        return {
          ...prev,
          [key]: 0,
          isRunning: false,
          isExpired: prev.activePlayer,
        }
      }

      return { ...prev, [key]: newTime }
    })
  }, [])

  useEffect(() => {
    if (state.isRunning && state.activePlayer && !state.isExpired) {
      lastTickRef.current = performance.now()
      intervalRef.current = setInterval(tick, 100)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.isRunning, state.activePlayer, state.isExpired, tick])

  // Reset when initialTimeMs changes (new game)
  useEffect(() => {
    setState({
      whiteTime: initialTimeMs,
      blackTime: initialTimeMs,
      activePlayer: null,
      isRunning: false,
      isExpired: null,
    })
  }, [initialTimeMs])

  const start = useCallback((firstPlayer: Player = 'white') => {
    setState(prev => ({
      ...prev,
      activePlayer: firstPlayer,
      isRunning: true,
    }))
  }, [])

  const switchTurn = useCallback(() => {
    setState(prev => {
      if (!prev.isRunning || prev.isExpired) return prev
      return {
        ...prev,
        activePlayer: prev.activePlayer === 'white' ? 'black' : 'white',
      }
    })
    // Reset lastTick when switching so elapsed calc is accurate
    lastTickRef.current = performance.now()
  }, [])

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: false }))
  }, [])

  const resume = useCallback(() => {
    setState(prev => {
      if (!prev.activePlayer || prev.isExpired) return prev
      return { ...prev, isRunning: true }
    })
  }, [])

  const reset = useCallback(() => {
    setState({
      whiteTime: initialTimeMs,
      blackTime: initialTimeMs,
      activePlayer: null,
      isRunning: false,
      isExpired: null,
    })
  }, [initialTimeMs])

  return {
    whiteTime: state.whiteTime,
    blackTime: state.blackTime,
    activePlayer: state.activePlayer,
    isRunning: state.isRunning,
    isExpired: state.isExpired,
    start,
    switchTurn,
    pause,
    resume,
    reset,
  }
}

// Utility: format ms to MM:SS or M:SS.s
export function formatTime(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
