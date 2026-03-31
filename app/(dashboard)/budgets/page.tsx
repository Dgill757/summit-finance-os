import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import BudgetsContent from './budgets-content'

export default async function BudgetsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [{ data: budgets }, { data: transactions }] = await Promise.all([
    supabase.from('budgets').select('*').eq('user_id', user?.id).order('month', { ascending: false }),
    supabase.from('transactions').select('amount, category, date').eq('user_id', user?.id).order('date', { ascending: false }),
  ])
  return (
    <div className="pb-10">
      <TopBar title="Budgets" subtitle="Monthly guardrails for each spending category." />
      <BudgetsContent budgets={budgets || []} transactions={transactions || []} userId={user?.id || ''} />
    </div>
  )
}
