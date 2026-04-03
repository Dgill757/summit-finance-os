import { format, subMonths } from 'date-fns'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import PlanningContent from './planning-content'

export const dynamic = 'force-dynamic'

export default async function PlanningPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const start = format(subMonths(new Date(), 3), 'yyyy-MM-dd')
  const [{ data: accounts }, { data: transactions }, { data: goals }, { data: manualAssets }, { data: snapshots }, { data: manualBills }] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', user.id),
    supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', start).order('date', { ascending: true }),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('is_completed', false),
    supabase.from('manual_assets').select('*').eq('user_id', user.id),
    supabase.from('net_worth_snapshots').select('*').eq('user_id', user.id).order('snapshot_date', { ascending: true }).limit(12),
    supabase.from('manual_bills').select('*').eq('user_id', user.id).eq('is_active', true).order('amount', { ascending: false }),
  ])

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Future Planning" subtitle="FIRE, emergency runway, debt payoff, and long-term projections." />
      <PlanningContent
        accounts={(accounts || []) as any}
        transactions={(transactions || []) as any}
        goals={(goals || []) as any}
        manualAssets={(manualAssets || []) as any}
        snapshots={(snapshots || []) as any}
        manualBills={(manualBills || []) as any}
      />
    </div>
  )
}
