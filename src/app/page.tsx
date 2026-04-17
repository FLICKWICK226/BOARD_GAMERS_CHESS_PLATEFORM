import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Puzzle, BotMessageSquare, Swords } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const { data: dailyPuzzle } = await supabase
    .from('daily_content')
    .select('puzzle_number, rating')
    .order('puzzle_date', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="EPO Board Gamer — Chess Section"
            width={450}
            height={120}
            className="w-[300px] sm:w-[420px] h-auto mx-auto"
            priority
          />
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

        {/* Dynamic Badge */}
        <div className="mt-12 flex items-center gap-3 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <p className="text-[11px] font-medium text-primary uppercase tracking-wider">
            Nouveau : Puzzle #{dailyPuzzle?.puzzle_number || '128'} disponible à {dailyPuzzle?.rating || '1400'} Elo
          </p>
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
        <p className="text-xs text-muted-foreground">EPO Board Gamer © 2026 · Chess Section</p>
      </footer>
    </div>
  )
}
