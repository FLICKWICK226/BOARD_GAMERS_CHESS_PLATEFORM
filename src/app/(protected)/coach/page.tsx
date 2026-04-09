'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  BotMessageSquare,
  User,
  Sparkles,
  Trash2,
  Square,
  Star,
  Cpu,
  Zap,
  Clipboard,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useCoach, CoachMessage } from '@/hooks/use-coach'

// ── Default starting position ──
const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

// ── User level definitions ──
const USER_LEVELS = [
  { id: 'beginner' as const, label: 'Débutant', icon: Star, color: 'text-primary' },
  { id: 'intermediate' as const, label: 'Intermédiaire', icon: Cpu, color: 'text-yellow-400' },
  { id: 'expert' as const, label: 'Expert', icon: Zap, color: 'text-red-400' },
]

// ── Suggested questions ──
const SUGGESTIONS = [
  'Quel est le meilleur coup ici ?',
  'Analyse cette position pour moi',
  'Quelles sont les faiblesses de ma position ?',
  'Comment obtenir un avantage dans cette position ?',
]

export default function CoachPage() {
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate')
  const [currentFen, setCurrentFen] = useState(DEFAULT_FEN)
  const [fenInput, setFenInput] = useState('')
  const [fenError, setFenError] = useState('')
  const [input, setInput] = useState('')
  const [fenCopied, setFenCopied] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, isStreaming, creditsRemaining, outOfCredits, maxCredits, sendMessage, stopStreaming, clearMessages } = useCoach({
    userLevel,
  })

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── FEN validation & apply ──
  const applyFen = () => {
    const fen = fenInput.trim()
    if (!fen) return

    try {
      new Chess(fen) // Validates FEN
      setCurrentFen(fen)
      setFenError('')
      setFenInput('')
    } catch {
      setFenError('FEN invalide. Vérifiez le format.')
    }
  }

  const copyFen = () => {
    navigator.clipboard.writeText(currentFen)
    setFenCopied(true)
    setTimeout(() => setFenCopied(false), 2000)
  }

  // ── Send message handler ──
  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    sendMessage(input, currentFen)
    setInput('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Format markdown-like content ──
  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
      .replace(
        /`(.*?)`/g,
        '<code class="px-1.5 py-0.5 rounded bg-surface-high text-primary text-xs font-mono">$1</code>'
      )
      .replace(/\n/g, '<br/>')
  }

  // ── Determine turn from FEN ──
  const getTurnLabel = () => {
    try {
      const game = new Chess(currentFen)
      return game.turn() === 'w' ? 'Blancs jouent' : 'Noirs jouent'
    } catch {
      return 'Position'
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Coach IA</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Votre assistant tactique personnel, propulsé par Claude.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-14rem)]">
        {/* ═══════════════════════════════════
            LEFT SIDEBAR — Board + Controls
            ═══════════════════════════════════ */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Mini chessboard — REAL, powered by react-chessboard */}
          <div className="bg-surface-container rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium">
                Position actuelle
              </p>
              <button
                onClick={copyFen}
                title="Copier le FEN"
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                {fenCopied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copié
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3 h-3" />
                    FEN
                  </>
                )}
              </button>
            </div>

            <div className="rounded-lg overflow-hidden shadow-ambient">
              <Chessboard
                position={currentFen}
                arePiecesDraggable={false}
                boardWidth={280}
                customDarkSquareStyle={{ backgroundColor: '#2d333b' }}
                customLightSquareStyle={{ backgroundColor: '#e6edf3' }}
              />
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-2">{getTurnLabel()}</p>
          </div>

          {/* FEN input */}
          <div className="bg-surface-container rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-2">
              Changer la position
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={fenInput}
                onChange={(e) => {
                  setFenInput(e.target.value)
                  setFenError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && applyFen()}
                placeholder="Coller un FEN ici..."
                className="flex-1 bg-surface-high rounded-lg px-3 py-2 text-xs text-foreground
                  placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40
                  font-mono transition-all duration-200"
              />
              <button
                onClick={applyFen}
                disabled={!fenInput.trim()}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                  ${
                    fenInput.trim()
                      ? 'gradient-primary text-[#152800]'
                      : 'bg-surface-high text-muted-foreground opacity-50 cursor-not-allowed'
                  }`}
              >
                OK
              </button>
            </div>
            {fenError && <p className="text-[10px] text-red-400 mt-1.5">{fenError}</p>}
            <button
              onClick={() => {
                setCurrentFen(DEFAULT_FEN)
                setFenInput('')
                setFenError('')
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground mt-2 transition-colors"
            >
              ↩ Réinitialiser la position de départ
            </button>
          </div>

          {/* User level selector */}
          <div className="bg-surface-container rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-3">
              Votre niveau
            </p>
            <div className="flex gap-2">
              {USER_LEVELS.map((lvl) => {
                const Icon = lvl.icon
                const isActive = userLevel === lvl.id
                return (
                  <button
                    key={lvl.id}
                    onClick={() => setUserLevel(lvl.id)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-lg text-[10px] font-medium
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-primary/15 text-primary border border-primary/30'
                          : 'bg-surface-high text-muted-foreground hover:bg-surface-highest'
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? lvl.color : ''}`} />
                    {lvl.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Suggested questions */}
          <div className="bg-surface-container rounded-xl p-4 flex-1 hidden lg:block">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-3">
              Questions suggérées
            </p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  disabled={isStreaming}
                  className="w-full text-left text-xs text-muted-foreground hover:text-foreground
                    px-3 py-2.5 rounded-lg hover:bg-surface-high transition-colors duration-150
                    disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════
            RIGHT — Chat Interface
            ═══════════════════════════════════ */}
        <div className="lg:col-span-8 flex flex-col bg-surface-container rounded-xl overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--outline-variant)]/10">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <BotMessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Coach IA · Claude</p>
              <p className="text-[10px] text-primary flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full inline-block ${
                    isStreaming ? 'bg-yellow-400 animate-pulse' : 'bg-primary'
                  }`}
                />
                {isStreaming ? 'Analyse en cours...' : 'En ligne · Prêt à analyser'}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {/* Credits badge */}
              {creditsRemaining !== null && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium
                  ${outOfCredits
                    ? 'bg-red-400/10 text-red-400 border border-red-400/20'
                    : creditsRemaining <= 5
                    ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                    : 'bg-surface-high text-muted-foreground'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  {creditsRemaining}/{maxCredits} crédits
                </div>
              )}
              {isStreaming && (
                <button
                  onClick={stopStreaming}
                  className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-400/10 transition-colors"
                >
                  ■ Stop
                </button>
              )}
              <button
                onClick={clearMessages}
                disabled={isStreaming}
                title="Effacer la conversation"
                className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <Sparkles className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                    ${msg.role === 'assistant' ? 'bg-primary/15' : 'bg-surface-high'}`}
                >
                  {msg.role === 'assistant' ? (
                    <BotMessageSquare className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed
                    ${
                      msg.role === 'assistant'
                        ? 'bg-surface-high text-foreground'
                        : 'gradient-primary text-[#152800] font-medium'
                    }`}
                >
                  {msg.role === 'assistant' ? (
                    <span dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                  ) : (
                    msg.content
                  )}

                  {/* Streaming cursor */}
                  {msg.role === 'assistant' &&
                    isStreaming &&
                    msg.id === messages[messages.length - 1]?.id && (
                      <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse rounded-sm" />
                    )}
                </div>
              </div>
            ))}

            {/* Typing indicator — only shown when waiting for first chunk */}
            {isStreaming &&
              messages.length > 0 &&
              messages[messages.length - 1]?.role === 'assistant' &&
              messages[messages.length - 1]?.content === '' && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                    <BotMessageSquare className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-surface-high rounded-xl px-4 py-3 flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-[var(--outline-variant)]/10">
            {/* Out of credits banner */}
            {outOfCredits && (
              <div className="flex items-start gap-3 mb-3 px-4 py-3 rounded-xl bg-red-400/8 border border-red-400/20">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-400">Crédits IA épuisés</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Vous avez utilisé vos {maxCredits} crédits gratuits. Contactez le support pour recharger votre compte.
                  </p>
                </div>
              </div>
            )}

            {/* Credits progress bar */}
            {creditsRemaining !== null && !outOfCredits && (
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Crédits IA</span>
                  <span>{creditsRemaining}/{maxCredits}</span>
                </div>
                <div className="w-full h-1 bg-surface-highest rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500
                      ${creditsRemaining <= 5 ? 'bg-yellow-400' : 'bg-primary'}`}
                    style={{ width: `${(creditsRemaining / maxCredits) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* FEN + level context badges */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-high text-[10px] font-mono text-muted-foreground">
                <Square className="w-3 h-3" />
                {currentFen === DEFAULT_FEN ? 'Position initiale' : 'Position personnalisée'}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-high text-[10px] text-muted-foreground">
                {USER_LEVELS.find((l) => l.id === userLevel)?.label}
              </div>
            </div>

            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                disabled={isStreaming || outOfCredits}
                placeholder={outOfCredits ? 'Crédits épuisés...' : 'Posez votre question tactique... (Entrée pour envoyer)'}
                className="flex-1 resize-none bg-surface-high rounded-xl px-4 py-3 text-sm text-foreground
                  placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40
                  transition-all duration-200 min-h-[44px] max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming || outOfCredits}
                title="Envoyer le message"
                aria-label="Envoyer le message"
                className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                  transition-all duration-200
                  ${
                    input.trim() && !isStreaming && !outOfCredits
                      ? 'gradient-primary glow-primary text-[#152800]'
                      : 'bg-surface-high text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Claude analyse la position FEN affichée · Shift + Entrée pour un saut de ligne
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
