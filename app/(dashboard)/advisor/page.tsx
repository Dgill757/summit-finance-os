import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
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
  const threeMonthsAgo = format(subMonths(now, 3), 'yyyy-MM-dd')
  const eighteenMonthsAgo = format(subMonths(now, 18), 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('amount, category, name, merchant_name, date')
    .eq('user_id', user.id)
    .gte('date', eighteenMonthsAgo)
    .order('date', { ascending: false })

  const txCount = allTransactions?.length || 0
  const thisMonthTx = (allTransactions || []).filter((transaction) => transaction.date >= monthStart && transaction.date <= monthEnd)
  const monthIncome = thisMonthTx.filter((transaction) => Number(transaction.amount) < 0).reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0)
  const monthExpenses = thisMonthTx.filter((transaction) => Number(transaction.amount) > 0).reduce((sum, transaction) => sum + Number(transaction.amount), 0)

  const recentTx = (allTransactions || []).filter((transaction) => transaction.date >= threeMonthsAgo && Number(transaction.amount) > 0)
  const categoryTotals: Record<string, number> = {}
  for (const transaction of recentTx) {
    const category = transaction.category || 'Other'
    categoryTotals[category] = (categoryTotals[category] || 0) + Number(transaction.amount)
  }
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, amount]) => ({ category, amount }))

  const totalIncome3mo = (allTransactions || [])
    .filter((transaction) => transaction.date >= threeMonthsAgo && Number(transaction.amount) < 0)
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0)
  const totalSpend3mo = (allTransactions || [])
    .filter((transaction) => transaction.date >= threeMonthsAgo && Number(transaction.amount) > 0)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

  const avgMonthlyIncome = totalIncome3mo / 3
  const avgMonthlySpend = totalSpend3mo / 3
  const savingsRate = avgMonthlyIncome > 0 ? Math.round(((avgMonthlyIncome - avgMonthlySpend) / avgMonthlyIncome) * 100) : 0

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

  const dates = (allTransactions || []).map((transaction) => transaction.date).sort()
  const dataFrom = dates[0] || monthStart
  const dataTo = dates[dates.length - 1] || monthEnd

  const financialContext = {
    transaction_count: txCount,
    data_from: dataFrom,
    data_to: dataTo,
    month_income: monthIncome,
    month_expenses: monthExpenses,
    savings_rate: savingsRate,
    avg_monthly_income: avgMonthlyIncome,
    avg_monthly_expenses: avgMonthlySpend,
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
