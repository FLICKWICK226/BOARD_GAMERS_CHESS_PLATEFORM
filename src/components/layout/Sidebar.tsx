'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Puzzle,
  Swords,
  BotMessageSquare,
  UserCircle,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/puzzle', label: 'Puzzle du jour', icon: Puzzle },
  { href: '/play', label: 'Jouer vs Bot', icon: Swords },
  { href: '/coach', label: 'Coach IA', icon: BotMessageSquare },
  { href: '/profile', label: 'Mon profil', icon: UserCircle },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen glass border-r border-[var(--outline-variant)]/15 fixed left-0 top-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center glow-primary">
            <svg className="w-5 h-5 text-[#152800]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C11 2 10 2.5 10 4V5H8C7 5 6 6 6 7V8L4 10V14H6L7 16H8V20H10V16H14V20H16V16H17L18 14H20V10L18 8V7C18 6 17 5 16 5H14V4C14 2.5 13 2 12 2Z" />
            </svg>
          </div>
          <div>
            <span className="text-base font-semibold text-foreground tracking-tight">
              Board <span className="text-primary">Chess</span>
            </span>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Tactical Precision
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-surface-high text-primary sidebar-active'
                      : 'text-muted-foreground hover:bg-surface-container hover:text-foreground'
                  }
                `}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary glow-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[var(--outline-variant)]/10">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-center">
            Board Chess © 2026
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--outline-variant)]/15">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_6px_rgba(160,214,96,0.4)]' : ''}`} />
                <span className="truncate max-w-[56px]">{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
