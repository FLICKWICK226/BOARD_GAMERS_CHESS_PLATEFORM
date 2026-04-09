'use client'

import { useState, useRef } from 'react'
import { Send, BotMessageSquare, User, Sparkles } from 'lucide-react'

// Mini board for context
const MINI_BOARD: string[][] = [
  ['♜','','♝','♛','♚','','','♜'],
  ['♟','♟','♟','','♟','♟','♟','♟'],
  ['','','♞','','','♞','',''],
  ['','','','♟','','','',''],
  ['','','','♙','♙','','',''],
  ['','♙','♘','','','','',''],
  ['♙','','♙','','','♙','♙','♙'],
  ['♖','♘','♗','♕','♔','♗','','♖'],
]

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: 'assistant',
    content: "Bonjour ! Je suis votre Coach IA. Posez-moi n'importe quelle question sur les échecs : tactique, ouvertures, finales, ou demandez-moi d'analyser une position spécifique. 🎯",
  },
]

const MOCK_RESPONSES: Record<string, string> = {
  default: `**Analyse tactique de votre position :**

La position actuelle présente plusieurs éléments clés à considérer :

1. **Avantage central** — Votre pion en d4 contrôle les cases clés. Considérez de consolider avec c3.

2. **Développement** — Votre cavalier en f3 est bien placé. Priorité au développement du fou en c4 ou e3.

3. **Sécurité du roi** — Le roque côté roi est recommandé dans les 3 prochains coups.

\`Coup suggéré : 1. e5 — pousse votre pion pour gagner de l'espace\`

Voulez-vous que j'analyse une ligne spécifique ?`,
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate streaming response
    await new Promise(r => setTimeout(r, 800))
    const response = MOCK_RESPONSES.default
    setIsTyping(false)
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      role: 'assistant',
      content: response,
    }])
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-surface-high text-primary text-xs font-mono">$1</code>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Coach IA</h1>
        <p className="text-muted-foreground mt-1 text-sm">Votre assistant tactique personnel, disponible 24h/24.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-14rem)]">
        {/* Left — Mini board + context */}
        <div className="hidden lg:flex flex-col gap-4">
          <div className="bg-surface-container rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-3">Position actuelle</p>
            {/* Mini chessboard */}
            <div className="grid grid-cols-8 rounded-lg overflow-hidden shadow-ambient">
              {MINI_BOARD.flatMap((row, ri) =>
                row.map((piece, ci) => {
                  const isLight = (ri + ci) % 2 === 0
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={`aspect-square flex items-center justify-center text-sm select-none
                        ${isLight ? 'bg-[#c8b88a]' : 'bg-[#6b4f2e]'}
                      `}
                    >
                      {piece}
                    </div>
                  )
                })
              )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">Blancs jouent</p>
          </div>

          {/* Suggested questions */}
          <div className="bg-surface-container rounded-xl p-4 flex-1">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-3">Questions suggérées</p>
            <div className="space-y-2">
              {[
                'Comment améliorer mon jeu tactique ?',
                'Analysez ma position actuelle',
                'Meilleure ouverture pour les Blancs ?',
                'Expliquez la Défense Sicilienne',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="w-full text-left text-xs text-muted-foreground hover:text-foreground
                    px-3 py-2.5 rounded-lg hover:bg-surface-high transition-colors duration-150"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Chat interface */}
        <div className="lg:col-span-2 flex flex-col bg-surface-container rounded-xl overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--outline-variant)]/10">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <BotMessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Coach IA</p>
              <p className="text-[10px] text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                En ligne · Prêt à analyser
              </p>
            </div>
            <div className="ml-auto">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                  ${msg.role === 'assistant' ? 'bg-primary/15' : 'bg-surface-high'}
                `}>
                  {msg.role === 'assistant'
                    ? <BotMessageSquare className="w-3.5 h-3.5 text-primary" />
                    : <User className="w-3.5 h-3.5 text-muted-foreground" />
                  }
                </div>

                {/* Bubble */}
                <div
                  className={`
                    max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed
                    ${msg.role === 'assistant'
                      ? 'bg-surface-high text-foreground'
                      : 'gradient-primary text-[#152800] font-medium'
                    }
                  `}
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                />
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                  <BotMessageSquare className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-surface-high rounded-xl px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-[var(--outline-variant)]/10">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Posez votre question tactique... (Entrée pour envoyer)"
                className="flex-1 resize-none bg-surface-high rounded-xl px-4 py-3 text-sm text-foreground
                  placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40
                  transition-all duration-200 min-h-[44px] max-h-32"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className={`
                  flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                  transition-all duration-200
                  ${input.trim()
                    ? 'gradient-primary glow-primary text-[#152800]'
                    : 'bg-surface-high text-muted-foreground cursor-not-allowed opacity-50'
                  }
                `}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Shift + Entrée pour un saut de ligne
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
