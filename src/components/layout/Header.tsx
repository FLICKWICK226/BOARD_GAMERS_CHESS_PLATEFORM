import { signOut } from '@/app/actions/auth'
import { LogOut, Crown } from 'lucide-react'

interface HeaderProps {
  email: string | undefined
}

export default function Header({ email }: HeaderProps) {
  const displayName = email ? email.split('@')[0] : 'Joueur'

  return (
    <header className="sticky top-0 z-30 w-full glass border-b border-[var(--outline-variant)]/10">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left — Page context (mobile logo) */}
        <div className="flex md:hidden items-center gap-2">
          <div className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center">
            <svg className="w-4 h-4 text-[#152800]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C11 2 10 2.5 10 4V5H8C7 5 6 6 6 7V8L4 10V14H6L7 16H8V20H10V16H14V20H16V16H17L18 14H20V10L18 8V7C18 6 17 5 16 5H14V4C14 2.5 13 2 12 2Z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground">
            Board <span className="text-primary">Chess</span>
          </span>
        </div>

        {/* Right — User info */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Level badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/20 text-primary text-xs font-medium">
            <Crown className="w-3.5 h-3.5" />
            <span>Intermédiaire</span>
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
              <p className="text-[10px] text-muted-foreground leading-tight">Elo 1540</p>
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
