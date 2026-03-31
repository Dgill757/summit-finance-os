import { endOfMonth, format, startOfMonth } from 'date-fns'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import GoalsContent from './goals-content'

export default async function GoalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')
  const [{ data: goals }, { data: monthTransactions }] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
    supabase.from('transactions').select('amount').eq('user_id', user?.id).gte('date', monthStart).lte('date', monthEnd),
  ])
  const income = (monthTransactions || []).filter((row) => Number(row.amount) < 0).reduce((sum, row) => sum + Math.abs(Number(row.amount)), 0)
  const expenses = (monthTransactions || []).filter((row) => Number(row.amount) > 0).reduce((sum, row) => sum + Number(row.amount), 0)
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0
  return (
    <div className="pb-10">
      <TopBar title="Goals" subtitle="Track what matters and move money toward it intentionally." />
      <GoalsContent goals={goals || []} userId={user?.id || ''} savingsRate={savingsRate} />
    </div>
  )
}
