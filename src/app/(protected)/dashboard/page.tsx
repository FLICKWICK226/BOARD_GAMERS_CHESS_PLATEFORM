import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Trophy, ChevronRight, Check, AlertCircle, Puzzle } from 'lucide-react'



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
    .select('status, created_at, time_spent')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalSolved = attempts?.filter(a => a.status === 'success').length || 0
  const totalAttempts = attempts?.length || 0
  const successRate = totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 0
  const currentRating = profile?.rating || 1200

  // 3. Fetch latest puzzle for the preview card
  const { data: latestPuzzle } = await supabase
    .from('daily_content')
    .select('*')
    .order('puzzle_date', { ascending: false })
    .limit(1)
    .single()

  // 4. Compute streak: consecutive days the user solved at least one puzzle
  const streak = (() => {
    if (!attempts || attempts.length === 0) return 0
    const solvedDates = Array.from(new Set(
      attempts
        .filter(a => a.status === 'success')
        .map(a => a.created_at.slice(0, 10)) // YYYY-MM-DD
    )).sort((a, b) => (a < b ? 1 : -1))  // desc

    if (solvedDates.length === 0) return 0

    const today = new Date().toISOString().slice(0, 10)
    // Allow today OR yesterday as chain start (user may not have solved today yet)
    const yesterday = new Date(new Date().getTime() - 86400_000).toISOString().slice(0, 10)
    if (solvedDates[0] !== today && solvedDates[0] !== yesterday) return 0

    let count = 1
    for (let i = 1; i < solvedDates.length; i++) {
      const prev = new Date(solvedDates[i - 1])
      const curr = new Date(solvedDates[i])
      const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400_000)
      if (diffDays === 1) count++
      else break
    }
    return count
  })()

  // 3. Fetch Recent Puzzles with details
  const { data: recentAttempts } = await supabase
    .from('puzzle_attempts')
    .select(`
      status,
      time_spent,
      daily_content:puzzle_id (
        level,
        lichess_id
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // 4. Transform attempts for UI
  type PuzzleAttempt = { status: string; time_spent: number; daily_content?: { level?: string; lichess_id?: string } | null }
  const recentPuzzles = (recentAttempts as PuzzleAttempt[] || []).map((att, idx) => ({
    id: idx,
    name: `Puzzle #${att.daily_content?.lichess_id || 'Global'}`,
    difficulty: att.daily_content?.level === 'beginner' ? 'Débutant' : att.daily_content?.level === 'intermediate' ? 'Intermédiaire' : 'Expert',
    solved: att.status === 'success',
    time: att.status === 'success' ? `${Math.floor(att.time_spent / 60)}m ${att.time_spent % 60}s` : '—'
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
        {/* Streak Card */}
        <div className="sm:col-span-2 lg:col-span-1 bg-surface-container rounded-xl p-5 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium">Série en cours</p>
          <div className="flex items-center gap-3">
            <span className="text-4xl streak-glow select-none">🔥</span>
            <div>
              <p className="text-3xl font-bold text-primary leading-none">{streak}</p>
              <p className="text-xs text-muted-foreground mt-0.5">jours consécutifs</p>
            </div>
          </div>
          <div className="flex gap-1 mt-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full ${
                  i < Math.min(streak, 10) ? 'bg-primary' : 'bg-surface-high'
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {streak === 0 ? 'Commence ton premier défi !' : streak >= 7 ? '🏆 Série de feu !' : 'Continue comme ça !'}
          </p>
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

          <div className="relative bg-surface-low aspect-[4/3] max-h-72 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center scale-150">
              <Trophy className="w-64 h-64 text-primary" />
            </div>
            
            <div className="z-10">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Puzzle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                {latestPuzzle ? `Casse-tête #${latestPuzzle.puzzle_number || latestPuzzle.lichess_id}` : 'Défi Quotidien'}
              </h3>
              <p className="text-primary font-medium text-sm mb-3">
                {latestPuzzle ? `Difficulté : ${latestPuzzle.rating} Elo` : 'Améliorez votre Elo Tactique'}
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {(latestPuzzle?.themes || ['tactical', 'precision']).slice(0, 3).map((theme: string) => (
                  <span key={theme} className="px-2 py-0.5 rounded-md bg-surface-high text-[10px] text-muted-foreground uppercase tracking-wider">
                    {theme}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Mettez vos comp&eacute;tences &agrave; l&apos;&eacute;preuve avec ce puzzle s&eacute;lectionn&eacute; pour votre niveau.
              </p>
            </div>
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
