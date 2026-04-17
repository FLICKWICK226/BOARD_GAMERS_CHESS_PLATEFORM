import { signOut } from '@/app/actions/auth'
import { LogOut, Crown } from 'lucide-react'
import Image from 'next/image'

interface HeaderProps {
  email: string | undefined
  rating?: number
  level?: string
}

const levelLabel: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  expert: 'Expert',
}

export default function Header({ email, rating = 1200, level = 'beginner' }: HeaderProps) {
  const displayName = email ? email.split('@')[0] : 'Joueur'
  const levelText = levelLabel[level] || 'Débutant'

  return (
    <header className="sticky top-0 z-30 w-full glass border-b border-[var(--outline-variant)]/10">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left — Logo (mobile only, since sidebar is hidden on mobile) */}
        <div className="flex md:hidden items-center">
          <Image
            src="/logo.png"
            alt="EPO Board Gamer"
            width={180}
            height={48}
            className="h-8 w-auto"
            priority
          />
        </div>

        {/* Right — User info */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Level badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/20 text-primary text-xs font-medium">
            <Crown className="w-3.5 h-3.5" />
            <span>{levelText}</span>
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-high flex items-center justify-center text-sm font-semibold text-primary uppercase">
              {displayName.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground leading-tight capitalize">
                {displayName}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">Elo {rating}</p>
            </div>
          </div>

          {/* Sign out */}
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                text-muted-foreground hover:text-foreground hover:bg-surface-container
                transition-all duration-200"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
