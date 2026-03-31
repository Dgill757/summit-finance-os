import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import BusinessContent from './business-content'

export const dynamic = 'force-dynamic'

export default async function BusinessPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: metrics }, { data: packages }, { data: goals }, { data: monthTransactions }] = await Promise.all([
    supabase.from('business_metrics').select('*').eq('user_id', user.id).order('month', { ascending: false }).limit(12),
    supabase.from('service_packages').select('*').eq('user_id', user.id).order('mrr', { ascending: false }),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('type', 'business'),
    supabase.from('transactions').select('amount, is_business').eq('user_id', user.id),
  ])

  const currentMRR = Number(metrics?.[0]?.mrr || 0)
  const lastMRR = Number(metrics?.[1]?.mrr || 0)
  const mrrDelta = lastMRR > 0 ? ((currentMRR - lastMRR) / lastMRR) * 100 : 0
  const personalExpenses = (monthTransactions || []).filter((tx) => Number(tx.amount) > 0 && !tx.is_business).reduce((sum, tx) => sum + Number(tx.amount), 0)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Business OS" subtitle="Summit Marketing Group financial command" />
      <BusinessContent metrics={metrics || []} packages={packages || []} goals={goals || []} currentMRR={currentMRR} mrrDelta={mrrDelta} userId={user.id} personalExpenses={personalExpenses} />
    </div>
  )
}
