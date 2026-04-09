import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight, Puzzle, BotMessageSquare, Swords } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl gradient-primary glow-primary flex items-center justify-center mb-8">
          <svg className="w-9 h-9 text-[#152800]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C11 2 10 2.5 10 4V5H8C7 5 6 6 6 7V8L4 10V14H6L7 16H8V20H10V16H14V20H16V16H17L18 14H20V10L18 8V7C18 6 17 5 16 5H14V4C14 2.5 13 2 12 2Z" />
          </svg>
        </div>

        <p className="text-xs uppercase tracking-[0.2em] text-primary font-medium mb-4">
          Tactical Precision
        </p>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight max-w-2xl leading-tight mb-6">
          Maîtrisez les{' '}
          <span className="text-primary">Échecs</span>{' '}
          à votre rythme
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-10">
          Puzzles quotidiens, coach IA, et parties contre des bots de tous niveaux.
          La plateforme premium pour progresser efficacement.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl
              gradient-primary glow-primary glow-primary-hover
              text-[#152800] font-semibold text-base transition-all duration-200"
          >
            Commencer gratuitement
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl
              bg-surface-container hover:bg-surface-high
              text-foreground font-medium text-base transition-all duration-200"
          >
            Créer un compte
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="px-6 pb-24 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Puzzle,
              title: 'Puzzle du jour',
              desc: 'Un nouveau défi tactique chaque matin, adapté à votre niveau.',
            },
            {
              icon: BotMessageSquare,
              title: 'Coach IA',
              desc: 'Analysez vos positions et progressez avec votre assistant tactique.',
            },
            {
              icon: Swords,
              title: 'Jouer vs Bot',
              desc: 'Affrontez des bots de niveau Débutant à Expert, 24h/24.',
            },
          ].map(feature => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="bg-surface-container rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--outline-variant)]/10 py-6 text-center">
        <p className="text-xs text-muted-foreground">Board Chess © 2026 · Tactical Precision</p>
      </footer>
    </div>
  )
}
