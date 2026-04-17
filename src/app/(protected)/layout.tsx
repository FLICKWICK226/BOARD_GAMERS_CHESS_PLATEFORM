import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch real profile for header display
  const { data: profile } = await supabase
    .from('users')
    .select('rating, level')
    .eq('id', user.id)
    .single()

  return (
    <AppShell
      email={user.email}
      rating={profile?.rating ?? 1200}
      level={profile?.level ?? 'beginner'}
    >
      {children}
    </AppShell>
  )
}
