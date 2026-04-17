import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

interface AppShellProps {
  children: React.ReactNode
  email: string | undefined
  rating?: number
  level?: string
}

export default function AppShell({ children, email, rating = 1200, level = 'beginner' }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — desktop only (fixed) */}
      <Sidebar />

      {/* Main content area — offset for sidebar on desktop */}
      <div className="flex flex-col flex-1 md:ml-64">
        <Header email={email} rating={rating} level={level} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
