import { endOfMonth, format, startOfMonth } from 'date-fns'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import { avgMonthly, expensesByCategory, isRealIncome, monthsBetween, savingsRate, sumExpenses } from '@/lib/utils/finance'
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

  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('amount, category, name, merchant_name, date')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  const txCount = allTransactions?.length || 0
  const thisMonthTx = (allTransactions || []).filter((transaction) => transaction.date >= monthStart && transaction.date <= monthEnd)
  const monthIncome = thisMonthTx.filter(isRealIncome).reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0)
  const monthExpenses = sumExpenses(thisMonthTx as any)

  const dataMonths = allTransactions?.length ? monthsBetween(allTransactions[0].date, allTransactions[allTransactions.length - 1].date) : 1
  const totalIncome = (allTransactions || []).filter(isRealIncome).reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0)
  const totalExpenses = sumExpenses((allTransactions || []) as any)
  const avgMonthlyIncome = totalIncome / dataMonths
  const avgMonthlyExpenses = totalExpenses / dataMonths
  const avgSavingsRate = savingsRate(avgMonthlyIncome, avgMonthlyExpenses)

  const topCategories = Object.entries(expensesByCategory(allTransactions as any))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, amount]) => ({ category, amount }))

  const merchantMonths: Record<string, Set<string>> = {}
  const merchantAmounts: Record<string, number> = {}
  for (const transaction of (allTransactions || []).filter((item) => Number(item.amount) > 0)) {
    const key = transaction.merchant_name || transaction.name
    const month = transaction.date.substring(0, 7)
    merchantMonths[key] ??= new Set()
    merchantMonths[key].add(month)
    merchantAmounts[key] = (merchantAmounts[key] || 0) + Number(transaction.amount)
  }

  const subscriptions = Object.entries(merchantMonths)
    .filter(([, months]) => months.size >= 2)
    .map(([name, months]) => ({
      name,
      monthly_avg: merchantAmounts[name] / months.size,
      months_seen: months.size,
    }))
    .sort((a, b) => b.monthly_avg - a.monthly_avg)
    .slice(0, 20)

  const totalSubscriptions = subscriptions.reduce((sum, subscription) => sum + subscription.monthly_avg, 0)

  const { data: accounts } = await supabase.from('accounts').select('type, current_balance, name').eq('user_id', user.id)
  const accountAssets = (accounts || [])
    .filter((account) => account.type !== 'credit' && account.type !== 'loan')
    .reduce((sum, account) => sum + Number(account.current_balance || 0), 0)
  const accountLiabilities = (accounts || [])
    .filter((account) => account.type === 'credit' || account.type === 'loan')
    .reduce((sum, account) => sum + Math.abs(Number(account.current_balance || 0)), 0)

  const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user.id).eq('is_completed', false)

  const dataFrom = allTransactions?.[0]?.date || monthStart
  const dataTo = allTransactions?.[allTransactions.length - 1]?.date || monthEnd

  const financialContext = {
    transaction_count: txCount,
    data_from: dataFrom,
    data_to: dataTo,
    month_income: monthIncome,
    month_expenses: monthExpenses,
    savings_rate: avgSavingsRate,
    avg_monthly_income: avgMonthlyIncome,
    avg_monthly_expenses: avgMonthlyExpenses,
    top_categories: topCategories,
    subscriptions,
    total_subscriptions_monthly: totalSubscriptions,
    net_worth: accountAssets - accountLiabilities,
    total_assets: accountAssets,
    total_liabilities: accountLiabilities,
    account_count: accounts?.length || 0,
    active_goals: goals?.length || 0,
    goals: goals || [],
  }

  return (
    <div className="flex min-h-full flex-col">
      <TopBar
        title="AI Financial Advisor"
        subtitle={`Analyzing ${txCount.toLocaleString()} transactions from ${format(new Date(dataFrom), 'MMM yyyy')} to ${format(new Date(dataTo), 'MMM yyyy')}`}
      />
      <AdvisorContent financialContext={financialContext} userId={user.id} />
    </div>
  )
}
