import { redirect } from 'next/navigation'
import { Toaster } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle()
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar userEmail={profile?.email || user.email || ''} userName={profile?.full_name || 'Dan Gill'} />
      <main className="flex-1 overflow-y-auto bg-canvas">{children}</main>
      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: '#0e1520', border: '1px solid #1e2d42', color: '#e8edf5' } }} />
    </div>
  )
}
