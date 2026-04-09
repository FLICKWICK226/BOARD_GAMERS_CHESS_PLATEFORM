'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ────────────────────────────────────────────
// useCoach — Streaming chat with /api/coach
// Includes AI credits tracking and NO_CREDITS blocking
// ────────────────────────────────────────────

export interface CoachMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
}

interface UseCoachOptions {
  userLevel: 'beginner' | 'intermediate' | 'expert'
}

const MAX_CREDITS = 20

export function useCoach({ userLevel }: UseCoachOptions) {
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content:
        "Bonjour ! Je suis votre Coach IA. Collez une position FEN ou posez une question sur les échecs — j'analyse en temps réel. ♟️",
    },
  ])
  const [isStreaming, setIsStreaming] = useState(false)
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [outOfCredits, setOutOfCredits] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // ── Fetch initial credits on mount ──
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const res = await fetch('/api/coach', {
          method: 'GET',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setCreditsRemaining(data.credits_remaining ?? null)
          if (data.credits_remaining === 0) setOutOfCredits(true)
        }
      } catch {
        // Silently fail — credits display is non-critical
      }
    }
    fetchCredits()
  }, [])

  const sendMessage = useCallback(
    async (question: string, fen: string) => {
      if (!question.trim() || isStreaming) return

      // Block immediately if we know credits are 0
      if (outOfCredits) {
        const blockedId = Date.now()
        setMessages((prev) => [
          ...prev,
          { id: blockedId - 1, role: 'user', content: question.trim() },
          {
            id: blockedId,
            role: 'assistant',
            content:
              '🚫 **Crédits IA épuisés.** Vous avez utilisé vos 20 crédits gratuits. Contactez le support pour recharger.',
          },
        ])
        return
      }

      // Add user message immediately
      const userMsg: CoachMessage = {
        id: Date.now(),
        role: 'user',
        content: question.trim(),
      }
      setMessages((prev) => [...prev, userMsg])

      // Prepare assistant placeholder (streams into it)
      const assistantId = Date.now() + 1
      const assistantMsg: CoachMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
      }
      setMessages((prev) => [...prev, assistantMsg])
      setIsStreaming(true)

      try {
        // Get Supabase session token
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: '❌ Session expirée. Reconnectez-vous.' }
                : m
            )
          )
          setIsStreaming(false)
          return
        }

        const controller = new AbortController()
        abortRef.current = controller

        const res = await fetch('/api/coach', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ fen, question, userLevel }),
          signal: controller.signal,
        })

        // ── Handle non-streaming error responses ──
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Erreur inconnue' }))

          // Specific handling for NO_CREDITS error
          if (errData.code === 'NO_CREDITS' || res.status === 403) {
            setOutOfCredits(true)
            setCreditsRemaining(0)
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content:
                        '🚫 **Crédits IA épuisés.** Vous avez utilisé vos 20 crédits gratuits. Contactez le support pour recharger votre compte.',
                    }
                  : m
              )
            )
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: `❌ Erreur : ${errData.error || res.statusText}` }
                  : m
              )
            )
          }
          setIsStreaming(false)
          return
        }

        // ── Read remaining credits from response header ──
        const creditsHeader = res.headers.get('X-Credits-Remaining')
        if (creditsHeader !== null) {
          const newCredits = parseInt(creditsHeader, 10)
          setCreditsRemaining(newCredits)
          if (newCredits === 0) setOutOfCredits(true)
        }

        // ── Parse SSE stream ──
        const reader = res.body?.getReader()
        if (!reader) throw new Error('No readable stream')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue

            const payload = trimmed.slice(6)
            if (payload === '[DONE]') break

            try {
              const parsed = JSON.parse(payload)
              if (parsed.text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + parsed.text }
                      : m
                  )
                )
              }
              if (parsed.error) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + `\n\n❌ ${parsed.error}` }
                      : m
                  )
                )
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // User cancelled — keep partial content as-is
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      m.content +
                      `\n\n❌ Erreur de connexion : ${(err as Error).message}`,
                  }
                : m
            )
          )
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [isStreaming, outOfCredits, userLevel]
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content: 'Conversation effacée. Posez une nouvelle question ou changez la position FEN. ♟️',
      },
    ])
  }, [])

  return {
    messages,
    isStreaming,
    creditsRemaining,
    outOfCredits,
    maxCredits: MAX_CREDITS,
    sendMessage,
    stopStreaming,
    clearMessages,
  }
}
