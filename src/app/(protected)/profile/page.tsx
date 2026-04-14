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

  // 2. Fetch Detailed History
  const { data: rawHistory } = await supabase
    .from('puzzle_attempts')
    .select(`
      solved,
      created_at,
      time_spent_seconds,
      daily_content:puzzle_id (
        level,
        lichess_id
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // 3. Calculate Aggregates
  const totalSolved = rawHistory?.filter(p => p.solved).length || 0
  const historyCount = rawHistory?.length || 0
  const successRate = historyCount > 0 ? Math.round((totalSolved / historyCount) * 100) : 0
  
  type PuzzleAttemptRaw = { solved: boolean; created_at: string; time_spent_seconds: number; daily_content?: { level?: string; lichess_id?: string } | null }
  const puzzleHistory = (rawHistory as PuzzleAttemptRaw[] || []).map((att, idx) => ({
    id: idx,
    name: `Puzzle #${att.daily_content?.lichess_id || 'Global'}`,
    difficulty: att.daily_content?.level || 'beginner',
    solved: att.solved,
    time: att.solved ? `${Math.floor(att.time_spent_seconds / 60)}m ${att.time_spent_seconds % 60}s` : '—',
    date: new Date(att.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    points: att.solved ? (att.daily_content?.level === 'expert' ? 50 : att.daily_content?.level === 'intermediate' ? 30 : 20) : 0
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Target, label: 'Puzzles tentés', value: historyCount, unit: '', color: 'text-primary' },
          { icon: TrendingUp, label: 'Taux de succès', value: `${successRate}`, unit: '%', color: 'text-primary' },
          { icon: Trophy, label: 'Points session', value: totalPoints, unit: ' pts', color: 'text-yellow-400' },
          { icon: Clock, label: 'IA Credits', value: profile?.ai_credits_remaining || 0, unit: '', color: 'text-muted-foreground' },
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

          {/* Achievements - Placeholders for now */}
          <div className="bg-surface-container rounded-xl p-5">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-4">
              Statut du compte
            </p>
            <div className="space-y-3">
              {[
                { emoji: '🎮', label: 'Joueur Actif', sub: 'Compte validé' },
                { emoji: '🦾', label: 'Coach IA', sub: 'Disponible' },
                { emoji: '✨', label: 'Premium', sub: 'Bientôt disponible' },
              ].map(ach => (
                <div key={ach.label} className="flex items-center gap-3">
                  <span className="text-xl">{ach.emoji}</span>
                  <div>
                    <p className="text-sm text-foreground font-medium">{ach.label}</p>
                    <p className="text-[10px] text-muted-foreground">{ach.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
