import { createClient } from '@/lib/supabase/server'
import { Trophy, Target, TrendingUp, Crown, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { LevelSelector } from '@/components/profile/LevelSelector'

const difficultyColor: Record<string, string> = {
  'expert': 'text-red-400 bg-red-400/10',
  'intermediate': 'text-yellow-400 bg-yellow-400/10',
  'beginner': 'text-primary bg-primary/10',
}

const difficultyLabel: Record<string, string> = {
  'expert': 'Expert',
  'intermediate': 'Intermédiaire',
  'beginner': 'Débutant',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // 1. Fetch User Profile Data
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. Fetch ALL attempts for aggregates (no limit)
  const { data: allAttempts } = await supabase
    .from('puzzle_attempts')
    .select('solved, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalSolved = allAttempts?.filter(a => a.solved).length || 0
  const totalAttempts = allAttempts?.length || 0
  const successRate = totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 0

  // Compute streak: consecutive days with at least one solved puzzle
  const streak = (() => {
    if (!allAttempts || allAttempts.length === 0) return 0
    const solvedDates = Array.from(new Set(
      allAttempts
        .filter(a => a.solved)
        .map(a => a.created_at.slice(0, 10))
    )).sort((a, b) => (a < b ? 1 : -1))

    if (solvedDates.length === 0) return 0

    const today = new Date().toISOString().slice(0, 10)
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

  // 3. Fetch recent history for display (limited)
  const { data: rawHistory } = await supabase
    .from('puzzle_attempts')
    .select(`
      solved,
      created_at,
      time_spent_seconds,
      attempts_count,
      daily_content:puzzle_id (
        level,
        lichess_id
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  
  type PuzzleAttemptRaw = { solved: boolean; created_at: string; time_spent_seconds: number; attempts_count: number; daily_content?: { level?: string; lichess_id?: string } | null }
  const puzzleHistory = (rawHistory as PuzzleAttemptRaw[] || []).map((att, idx) => ({
    id: idx,
    name: `Puzzle #${att.daily_content?.lichess_id || 'Global'}`,
    difficulty: att.daily_content?.level || 'beginner',
    solved: att.solved,
    time: att.solved ? `${Math.floor(att.time_spent_seconds / 60)}m ${att.time_spent_seconds % 60}s` : '—',
    date: new Date(att.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    points: att.solved ? Math.max(50 - ((att.attempts_count - 1) * 10), 10) : 0
  }))

  const totalPoints = puzzleHistory.reduce((acc, p) => acc + p.points, 0)
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : 'Avril 2026'

  const displayName = (profile?.full_name || user?.email?.split('@')[0]) ?? 'Joueur'

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Mon Profil</h1>
        <p className="text-muted-foreground mt-1 text-sm">Suivez votre progression et gérez vos préférences.</p>
      </div>

      {/* Profile header card */}
      <div className="bg-surface-container rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-surface-high flex items-center justify-center text-3xl font-bold text-primary uppercase">
              {displayName.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
              <Crown className="w-3.5 h-3.5 text-[#152800]" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground capitalize">{displayName}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                ♟ {difficultyLabel[profile?.level || 'beginner']}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-high text-muted-foreground">
                🗓 Membre depuis {joinDate}
              </span>
            </div>
          </div>

          {/* Elo */}
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground">{profile?.rating || 1200}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Elo Tactique</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { icon: Target, label: 'Puzzles résolus', value: totalSolved, unit: '', color: 'text-primary' },
          { icon: Target, label: 'Puzzles tentés', value: totalAttempts, unit: '', color: 'text-muted-foreground' },
          { icon: TrendingUp, label: 'Taux de succès', value: `${successRate}`, unit: '%', color: 'text-primary' },
          { icon: Trophy, label: 'Points session', value: totalPoints, unit: ' pts', color: 'text-yellow-400' },
          { icon: Clock, label: 'Série', value: streak, unit: ' 🔥', color: 'text-orange-400' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-surface-container rounded-xl p-4">
              <Icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <p className="text-2xl font-bold text-foreground leading-none">
                {stat.value}<span className="text-base text-muted-foreground ml-1">{stat.unit}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Puzzle history */}
        <div className="lg:col-span-2 bg-surface-container rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--outline-variant)]/10 text-foreground">
            <p className="text-xs uppercase tracking-[0.1em] font-medium">
              Historique des puzzles
            </p>
          </div>
          <div className="divide-y divide-[var(--outline-variant)]/5">
            {puzzleHistory.length > 0 ? puzzleHistory.map((puzzle) => (
              <div
                key={puzzle.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-high transition-colors duration-100"
              >
                {puzzle.solved
                  ? <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  : <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                }

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{puzzle.name}</p>
                  <p className="text-[10px] text-muted-foreground">{puzzle.date} · {puzzle.time}</p>
                </div>

                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${difficultyColor[puzzle.difficulty] || difficultyColor['beginner']}`}>
                  {difficultyLabel[puzzle.difficulty] || 'Débutant'}
                </span>

                <span className={`text-sm font-mono font-bold flex-shrink-0 w-12 text-right ${puzzle.solved ? 'text-primary' : 'text-destructive'}`}>
                  {puzzle.solved ? `+${puzzle.points}` : '—'}
                </span>
              </div>
            )) : (
              <div className="py-20 text-center">
                <p className="text-sm text-muted-foreground">R&eacute;solvez votre premier puzzle pour voir l&apos;historique !</p>
              </div>
            )}
          </div>
        </div>

        {/* Level selector */}
        <div className="space-y-4">
          <LevelSelector currentLevel={profile?.level || 'beginner'} />

          {/* Next Goals / Roadmap */}
          <div className="bg-surface-container rounded-xl p-5 border border-primary/5">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-4">
              Objectifs & Progression
            </p>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-surface-high/50 border border-[var(--outline-variant)]/10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">🎯</span>
                  <p className="text-sm font-medium text-foreground">Vers le niveau suivant</p>
                </div>
                <div className="w-full bg-surface-high h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-1000" 
                    style={{ width: `${Math.min(((profile?.rating || 1200) % 200) / 2, 100)}%` }} 
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Gagnez encore {200 - ((profile?.rating || 1200) % 200)} points pour atteindre le palier supérieur.
                </p>
              </div>

              <div className="flex items-center gap-3 opacity-50">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="text-sm text-foreground font-medium">Tournois</p>
                  <p className="text-[10px] text-muted-foreground">Bientôt disponible</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
