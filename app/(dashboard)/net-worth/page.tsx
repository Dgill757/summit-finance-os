import { format } from 'date-fns'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import NetWorthContent from './net-worth-content'

export const dynamic = 'force-dynamic'

export default async function NetWorthPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: accounts }, { data: manualAssets }, { data: snapshots }] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', user.id).order('type'),
    supabase.from('manual_assets').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('net_worth_snapshots').select('*').eq('user_id', user.id).order('snapshot_date', { ascending: false }).limit(12),
  ])

  const plaidAssets = (accounts || []).filter((account) => account.type !== 'credit' && account.type !== 'loan').reduce((sum, account) => sum + Number(account.current_balance || 0), 0)
  const liabilities = (accounts || []).filter((account) => account.type === 'credit' || account.type === 'loan').reduce((sum, account) => sum + Math.abs(Number(account.current_balance || 0)), 0)
  const manualTotal = (manualAssets || []).reduce((sum, asset) => sum + Number(asset.value || 0), 0)
  const totalAssets = plaidAssets + manualTotal
  const netWorth = totalAssets - liabilities
  const currentMonth = format(new Date(), 'yyyy-MM-01')
  if (!(snapshots || []).some((snapshot) => snapshot.snapshot_date === currentMonth)) {
    await supabase.from('net_worth_snapshots').upsert({ user_id: user.id, snapshot_date: currentMonth, total_assets: totalAssets, total_liabilities: liabilities, net_worth: netWorth }, { onConflict: 'user_id,snapshot_date' })
  }

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Net Worth" subtitle="Total assets, liabilities, and long-term wealth trajectory." />
      <NetWorthContent accounts={(accounts || []) as any} manualAssets={(manualAssets || []) as any} snapshots={[...(snapshots || [])].reverse()} totalAssets={totalAssets} totalLiabilities={liabilities} netWorth={netWorth} userId={user.id} />
    </div>
  )
}
