import { createClient } from '@/lib/supabase/server'
import { Trophy, Target, TrendingUp, Crown, CheckCircle2, XCircle, Clock } from 'lucide-react'

const puzzleHistory = [
  { id: 1, name: 'Fourchette royale', difficulty: 'Expert', solved: true, time: '1m 12s', date: 'Aujourd\'hui', points: 45 },
  { id: 2, name: 'Mat en 2 coups', difficulty: 'Intermédiaire', solved: true, time: '0m 48s', date: 'Aujourd\'hui', points: 25 },
  { id: 3, name: 'Clouage décisif', difficulty: 'Débutant', solved: false, time: '5m 00s', date: 'Hier', points: 0 },
  { id: 4, name: 'Sacrifice positionnel', difficulty: 'Expert', solved: true, time: '2m 30s', date: 'Hier', points: 50 },
  { id: 5, name: 'Attaque de l\'aile roi', difficulty: 'Intermédiaire', solved: true, time: '1m 55s', date: '07/04', points: 30 },
  { id: 6, name: 'Défense Sicilienne', difficulty: 'Débutant', solved: true, time: '0m 35s', date: '07/04', points: 20 },
  { id: 7, name: 'Finale tour + roi', difficulty: 'Intermédiaire', solved: false, time: '5m 00s', date: '06/04', points: 0 },
  { id: 8, name: 'Combinaison thématique', difficulty: 'Expert', solved: true, time: '3m 10s', date: '06/04', points: 55 },
  { id: 9, name: 'Ouverture italienne', difficulty: 'Débutant', solved: true, time: '0m 42s', date: '05/04', points: 15 },
  { id: 10, name: 'Zugzwang classique', difficulty: 'Expert', solved: true, time: '4m 22s', date: '05/04', points: 60 },
]

const difficultyColor: Record<string, string> = {
  'Expert': 'text-red-400 bg-red-400/10',
  'Intermédiaire': 'text-yellow-400 bg-yellow-400/10',
  'Débutant': 'text-primary bg-primary/10',
}

const levelOptions = [
  { id: 'beginner', label: 'Débutant', elo: '<800' },
  { id: 'intermediate', label: 'Intermédiaire', elo: '800–1400' },
  { id: 'advanced', label: 'Avancé', elo: '1400–1800' },
  { id: 'expert', label: 'Expert', elo: '>1800' },
]

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const displayName = user?.email?.split('@')[0] ?? 'Joueur'
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : 'Avril 2026'

  const totalSolved = puzzleHistory.filter(p => p.solved).length
  const successRate = Math.round((totalSolved / puzzleHistory.length) * 100)
  const totalPoints = puzzleHistory.reduce((acc, p) => acc + p.points, 0)

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
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                ♟ Intermédiaire
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-high text-muted-foreground">
                🗓 Membre depuis {joinDate}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-high text-muted-foreground">
                🔥 7 jours de série
              </span>
            </div>
          </div>

          {/* Elo */}
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground">1 540</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Elo Tactique</p>
            <p className="text-xs text-primary flex items-center justify-end gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +45 ce mois
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Target, label: 'Puzzles résolus', value: totalSolved, unit: `/ ${puzzleHistory.length}`, color: 'text-primary' },
          { icon: TrendingUp, label: 'Taux de succès', value: `${successRate}`, unit: '%', color: 'text-primary' },
          { icon: Trophy, label: 'Points totaux', value: totalPoints, unit: ' pts', color: 'text-yellow-400' },
          { icon: Clock, label: 'Temps moyen', value: '2m 04s', unit: '', color: 'text-muted-foreground' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-surface-container rounded-xl p-4">
              <Icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <p className="text-2xl font-bold text-foreground leading-none">
                {stat.value}<span className="text-base text-muted-foreground">{stat.unit}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Puzzle history */}
        <div className="lg:col-span-2 bg-surface-container rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--outline-variant)]/10">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium">
              Historique des puzzles (10 derniers)
            </p>
          </div>
          <div className="divide-y divide-[var(--outline-variant)]/5">
            {puzzleHistory.map((puzzle) => (
              <div
                key={puzzle.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-high transition-colors duration-100"
              >
                {/* Status icon */}
                {puzzle.solved
                  ? <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  : <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                }

                {/* Name + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{puzzle.name}</p>
                  <p className="text-[10px] text-muted-foreground">{puzzle.date} · {puzzle.time}</p>
                </div>

                {/* Difficulty */}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${difficultyColor[puzzle.difficulty]}`}>
                  {puzzle.difficulty}
                </span>

                {/* Points */}
                <span className={`text-sm font-mono font-bold flex-shrink-0 w-12 text-right ${puzzle.solved ? 'text-primary' : 'text-destructive'}`}>
                  {puzzle.solved ? `+${puzzle.points}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Level selector */}
        <div className="space-y-4">
          <div className="bg-surface-container rounded-xl p-5">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-4">
              Changer de niveau
            </p>
            <div className="space-y-2">
              {levelOptions.map(level => {
                const isCurrentLevel = level.id === 'intermediate'
                return (
                  <button
                    key={level.id}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm
                      transition-colors duration-150
                      ${isCurrentLevel
                        ? 'bg-primary/15 text-primary border border-primary/20 font-medium'
                        : 'bg-surface-high text-muted-foreground hover:bg-surface-bright hover:text-foreground'
                      }
                    `}
                  >
                    <span>{level.label}</span>
                    <span className="text-[10px] font-mono opacity-70">Elo {level.elo}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-surface-container rounded-xl p-5">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-medium mb-4">
              Succès récents
            </p>
            <div className="space-y-3">
              {[
                { emoji: '🔥', label: 'Série de 7 jours', sub: 'Débloqué' },
                { emoji: '🎯', label: '100 puzzles résolus', sub: 'Débloqué' },
                { emoji: '⚡', label: 'Expert Tactique', sub: 'En cours' },
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
