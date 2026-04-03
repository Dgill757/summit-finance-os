import { endOfMonth, format, startOfMonth } from 'date-fns'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import { AdvisorContent } from './advisor-content'

export const dynamic = 'force-dynamic'

export default async function AdvisorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  const [{ data: accounts }, { data: txThisMonth }, { data: goals }, { data: budgets }] = await Promise.all([
    supabase.from('accounts').select('type, current_balance, name').eq('user_id', user.id),
    supabase.from('transactions').select('amount, category, name, date').eq('user_id', user.id).gte('date', monthStart).lte('date', monthEnd),
    supabase.from('goals').select('name, target_amount, current_amount, type').eq('user_id', user.id).eq('is_completed', false),
    supabase.from('budgets').select('category, amount').eq('user_id', user.id).gte('month', monthStart),
  ])

  const assets = (accounts || []).filter((account) => account.type !== 'credit' && account.type !== 'loan').reduce((sum, account) => sum + Number(account.current_balance || 0), 0)
  const liabilities = (accounts || []).filter((account) => account.type === 'credit' || account.type === 'loan').reduce((sum, account) => sum + Math.abs(Number(account.current_balance || 0)), 0)
  const income = (txThisMonth || []).filter((tx) => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
  const expenses = (txThisMonth || []).filter((tx) => Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0)

  const financialContext = {
    net_worth: assets - liabilities,
    total_assets: assets,
    total_liabilities: liabilities,
    month_income: income,
    month_expenses: expenses,
    savings_rate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
    active_goals: goals?.length || 0,
    goals: goals || [],
    budgets: budgets || [],
  }

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="AI Financial Advisor" subtitle="Your personal CFO — powered by real data" />
      <AdvisorContent financialContext={financialContext} userId={user.id} />
    </div>
  )
}
