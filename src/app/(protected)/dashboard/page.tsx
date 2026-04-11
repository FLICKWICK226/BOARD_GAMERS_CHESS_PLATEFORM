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

  if (!user) return null

  // 1. Fetch User Profile Data
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. Fetch Puzzle Stats
  const { data: attempts } = await supabase
    .from('puzzle_attempts')
    .select('solved, created_at, time_spent_seconds')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalSolved = attempts?.filter(a => a.solved).length || 0
  const totalAttempts = attempts?.length || 0
  const successRate = totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 0
  const currentRating = profile?.rating || 1200

  // 3. Fetch Recent Puzzles with details
  const { data: recentAttempts } = await supabase
    .from('puzzle_attempts')
    .select(`
      solved,
      time_spent_seconds,
      daily_content:puzzle_id (
        level,
        lichess_id
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // 4. Transform attempts for UI
  const recentPuzzles = (recentAttempts || []).map((att: any, idx) => ({
    id: idx,
    name: `Puzzle #${att.daily_content?.lichess_id || 'Global'}`,
    difficulty: att.daily_content?.level === 'beginner' ? 'Débutant' : att.daily_content?.level === 'intermediate' ? 'Intermédiaire' : 'Expert',
    solved: att.solved,
    time: att.solved ? `${Math.floor(att.time_spent_seconds / 60)}m ${att.time_spent_seconds % 60}s` : '—'
  }))

  const stats = [
    { label: 'Puzzles résolus', value: totalSolved.toString(), unit: '', change: 'Total' },
    { label: 'Taux de succès', value: successRate.toString(), unit: '%', change: 'Moyenne' },
    { label: 'Elo Tactique', value: currentRating.toLocaleString('fr-FR'), unit: '', change: profile?.level || 'Débutant' },
  ]

  const displayName = (profile?.full_name || user?.email?.split('@')[0]) ?? 'Joueur'

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
        {/* Streak Card - Keeping static for now as requested by "fixing others problem" */}
        <div className="sm:col-span-2 lg:col-span-1 bg-surface-container rounded-xl p-5 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium">Série en cours</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl streak-glow select-none">🔥</span>
            <div>
              <p className="text-3xl font-bold text-primary leading-none">0</p>
              <p className="text-xs text-muted-foreground mt-0.5">jours consécutifs</p>
            </div>
          </div>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full bg-surface-high"
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Apprentissage en cours</p>
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
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-1">Entraînement</p>
                <h2 className="text-lg font-semibold text-foreground">Prêt pour votre prochain défi ?</h2>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary uppercase tracking-wider">
                {profile?.level || 'Débutant'}
              </span>
            </div>
          </div>

          <div className="relative bg-surface-low aspect-[4/3] max-h-72 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <p className="text-foreground font-medium mb-2">Améliorez votre Elo Tactique</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Mettez vos compétences à l'épreuve avec des puzzles adaptés à votre niveau.
            </p>
          </div>

          <div className="p-5 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Analysez, apprenez et montez en grade.
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
            <a href="/profile" className="text-[11px] text-primary hover:underline">Profil</a>
          </div>
          <div className="space-y-2">
            {recentPuzzles.length > 0 ? recentPuzzles.map((puzzle) => (
              <div
                key={puzzle.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-high transition-colors duration-150"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${puzzle.solved ? 'bg-primary/15' : 'bg-destructive/10'}`}>
                  {puzzle.solved
                    ? <Check className="w-3.5 h-3.5 text-primary" />
                    : <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{puzzle.name}</p>
                  <p className="text-[10px] text-muted-foreground">{puzzle.time}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${difficultyColor[puzzle.difficulty] || difficultyColor['Débutant']}`}>
                  {puzzle.difficulty}
                </span>
              </div>
            )) : (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground">Aucune activité récente.</p>
              </div>
            )}
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
