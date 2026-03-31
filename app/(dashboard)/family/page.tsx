import { endOfMonth, format, startOfMonth } from 'date-fns'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import { FamilyContent } from './family-content'

export const dynamic = 'force-dynamic'

export default async function FamilyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const start = format(startOfMonth(now), 'yyyy-MM-dd')
  const end = format(endOfMonth(now), 'yyyy-MM-dd')

  const [{ data: transactions }, { data: goals }, { data: accounts }, { data: profile }] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', start).lte('date', end).gt('amount', 0),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('type', 'family'),
    supabase.from('accounts').select('current_balance, type').eq('user_id', user.id),
    supabase.from('profiles').select('expense_split_percent').eq('id', user.id).maybeSingle(),
  ])

  const totalSpending = (transactions || []).reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Family Command" subtitle="Shared finances for the Gill family" />
      <FamilyContent transactions={(transactions || []) as any} goals={(goals || []) as any} totalSpending={totalSpending} userId={user.id} expenseSplitPercent={profile?.expense_split_percent || 60} accounts={accounts || []} />
    </div>
  )
}
