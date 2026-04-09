import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Flame, Target, Trophy, ChevronRight, Clock } from 'lucide-react'

const stats = [
  { label: 'Puzzles résolus', value: '124', unit: '', change: '+8 cette semaine' },
  { label: 'Taux de succès', value: '82', unit: '%', change: '+3% ce mois' },
  { label: 'Elo Tactique', value: '1 540', unit: '', change: '+45 ce mois' },
]

const recentPuzzles = [
  { id: 1, name: 'Fourchette royale', difficulty: 'Expert', solved: true, time: '1m 12s' },
  { id: 2, name: 'Mat en 2 coups', difficulty: 'Intermédiaire', solved: true, time: '0m 48s' },
  { id: 3, name: 'Clouage décisif', difficulty: 'Débutant', solved: false, time: '—' },
]

const difficultyColor: Record<string, string> = {
  'Expert': 'text-red-400 bg-red-400/10',
  'Intermédiaire': 'text-yellow-400 bg-yellow-400/10',
  'Débutant': 'text-primary bg-primary/10',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const displayName = user?.email?.split('@')[0] ?? 'Joueur'

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Bon retour, <span className="text-primary capitalize">{displayName}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Votre session du {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Streak + Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak Card */}
        <div className="sm:col-span-2 lg:col-span-1 bg-surface-container rounded-xl p-5 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium">Série en cours</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl streak-glow select-none">🔥</span>
            <div>
              <p className="text-3xl font-bold text-primary leading-none">7</p>
              <p className="text-xs text-muted-foreground mt-0.5">jours consécutifs</p>
            </div>
          </div>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full bg-primary/80"
              />
            ))}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i + 7}
                className="flex-1 h-1 rounded-full bg-surface-high"
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Objectif : 10 jours</p>
        </div>

        {/* Stats */}
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-container rounded-xl p-5 flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium">{stat.label}</p>
            <p className="text-3xl font-bold text-foreground leading-none">
              {stat.value}
              <span className="text-lg text-primary ml-0.5">{stat.unit}</span>
            </p>
            <p className="text-xs text-primary flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Puzzle du jour — 2 cols */}
        <div className="lg:col-span-2 bg-surface-container rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[var(--outline-variant)]/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-1">Puzzle du jour</p>
                <h2 className="text-lg font-semibold text-foreground">Tactical Masterpiece #42</h2>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-red-400/10 text-red-400 uppercase tracking-wider">
                Expert
              </span>
            </div>
          </div>

          {/* Chessboard placeholder */}
          <div className="relative bg-surface-low aspect-[4/3] max-h-72 flex items-center justify-center">
            {/* Chess grid */}
            <div className="grid grid-cols-8 w-64 h-64 rounded-lg overflow-hidden shadow-ambient">
              {Array.from({ length: 64 }).map((_, i) => {
                const row = Math.floor(i / 8)
                const col = i % 8
                const isLight = (row + col) % 2 === 0
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-center text-xl select-none
                      ${isLight ? 'bg-[#c8b88a]' : 'bg-[#6b4f2e]'}
                    `}
                  >
                    {/* Sample piece positions */}
                    {i === 4 && <span>♔</span>}
                    {i === 60 && <span>♚</span>}
                    {i === 12 && <span>♛</span>}
                    {i === 35 && <span>♜</span>}
                    {i === 27 && <span>♞</span>}
                    {i === 48 && <span>♟</span>}
                    {i === 49 && <span>♟</span>}
                    {i === 54 && <span>♙</span>}
                    {i === 55 && <span>♙</span>}
                  </div>
                )
              })}
            </div>
            {/* Overlay label */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              <span>Blancs jouent et gagnent</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Temps illimité</span>
            </div>
          </div>

          <div className="p-5 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Trouvez le coup décisif dans cette position complexe.
            </p>
            <a
              href="/puzzle"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-primary glow-primary glow-primary-hover
                text-[#152800] text-sm font-semibold transition-all duration-200 whitespace-nowrap"
            >
              Jouer <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Recent Puzzles — 1 col */}
        <div className="bg-surface-container rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium">Activité récente</p>
            <a href="/profile" className="text-[11px] text-primary hover:underline">Tout voir</a>
          </div>
          <div className="space-y-2">
            {recentPuzzles.map((puzzle) => (
              <div
                key={puzzle.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-high transition-colors duration-150"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${puzzle.solved ? 'bg-primary/15' : 'bg-destructive/10'}`}>
                  {puzzle.solved
                    ? <Target className="w-3.5 h-3.5 text-primary" />
                    : <Trophy className="w-3.5 h-3.5 text-destructive" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{puzzle.name}</p>
                  <p className="text-[10px] text-muted-foreground">{puzzle.time}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${difficultyColor[puzzle.difficulty]}`}>
                  {puzzle.difficulty}
                </span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-5 space-y-2">
            <a
              href="/play"
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-surface-high hover:bg-surface-bright
                text-sm text-foreground font-medium transition-colors duration-150"
            >
              <span>Jouer vs Bot</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
            <a
              href="/coach"
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-surface-high hover:bg-surface-bright
                text-sm text-foreground font-medium transition-colors duration-150"
            >
              <span>Demander au Coach IA</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
