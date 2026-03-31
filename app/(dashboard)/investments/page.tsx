import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import InvestmentsContent from './investments-content'

export const dynamic = 'force-dynamic'

export default async function InvestmentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: accounts }, { data: manualAssets }] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', user.id).eq('type', 'investment'),
    supabase.from('manual_assets').select('*').eq('user_id', user.id).in('type', ['business', 'other', 'Other']),
  ])

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Investments" subtitle="Portfolio overview from connected and manual holdings." />
      <InvestmentsContent accounts={(accounts || []) as any} manualAssets={(manualAssets || []) as any} userId={user.id} />
    </div>
  )
}
