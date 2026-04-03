import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import {
  detectSubscriptions,
  estimateUpcomingBills,
  expensesByCategory,
  getTopCategory,
  monthsBetween,
  savingsRate,
  sumExpenses,
  sumIncome,
} from '@/lib/utils/finance'
import DashboardContent from './dashboard-content'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const params = await searchParams
  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')
  const sixMonthStart = format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd')
  const threeMonthsAgo = format(startOfMonth(subMonths(now, 3)), 'yyyy-MM-dd')

  const [accountsRes, monthTransactionsRes, recentTransactionsRes, goalsRes, snapshotRes, sixMonthTransactionsRes, billsRes, transactionCountRes, last3MonthsRes, lifetimeTxRes, recentAllRes] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_hidden', false),
    supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', monthStart).lte('date', monthEnd).order('date', { ascending: false }),
    supabase.from('transactions').select('*, account:accounts(name)').eq('user_id', user.id).order('date', { ascending: false }).limit(10),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('is_completed', false).order('created_at', { ascending: false }).limit(4),
    supabase.from('net_worth_snapshots').select('*').eq('user_id', user.id).order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('transactions').select('amount, date, category').eq('user_id', user.id).gte('date', sixMonthStart).order('date', { ascending: true }),
    supabase.from('manual_bills').select('*').eq('user_id', user.id).eq('is_active', true).order('amount', { ascending: false }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('transactions').select('amount, category, date, name').eq('user_id', user.id).gte('date', threeMonthsAgo).lt('date', monthStart).order('date', { ascending: true }),
    supabase.from('transactions').select('amount, date').eq('user_id', user.id).order('date', { ascending: true }),
    supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', threeMonthsAgo).order('date', { ascending: false }),
  ])

  const accounts = accountsRes.data || []
  const monthTransactions = monthTransactionsRes.data || []
  const recentTransactions = recentTransactionsRes.data || []
  const goals = goalsRes.data || []
  const sixMonthTransactions = sixMonthTransactionsRes.data || []
  const bills = billsRes.data || []
  const transactionCount = transactionCountRes.count || 0
  const last3MonthsTx = last3MonthsRes.data || []
  const lifetimeTx = lifetimeTxRes.data || []
  const allRecentTx = recentAllRes.data || []

  const assets = accounts.filter((account) => account.type !== 'credit' && account.type !== 'loan').reduce((sum, account) => sum + Number(account.current_balance || 0), 0)
  const liabilities = accounts.filter((account) => account.type === 'credit' || account.type === 'loan').reduce((sum, account) => sum + Math.abs(Number(account.current_balance || 0)), 0)
  const netWorth = assets - liabilities

  const income = sumIncome(monthTransactions as any)
  const expenses = sumExpenses(monthTransactions as any)
  const cashFlow = income - expenses
  const currentSavingsRate = savingsRate(income, expenses)

  const avgIncome = sumIncome(last3MonthsTx as any) / 3
  const avgExpenses = sumExpenses(last3MonthsTx as any) / 3
  const avgSurplus = avgIncome - avgExpenses

  const fixedBillsTotal = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0)
  const variableSpend = Math.max(0, avgExpenses - fixedBillsTotal)
  const hasData = accounts.length > 0 || transactionCount > 0

  const currentMonthCategoryData = Object.entries(expensesByCategory(monthTransactions as any))
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  const cashFlowData = Array.from({ length: 6 }).map((_, index) => {
    const monthDate = subMonths(now, 5 - index)
    const label = format(monthDate, 'MMM')
    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)
    const monthRows = sixMonthTransactions.filter((tx) => {
      const date = new Date(tx.date)
      return date >= start && date <= end
    })
    const incomeValue = sumIncome(monthRows as any)
    const expenseValue = sumExpenses(monthRows as any)
    return { month: label, monthKey: format(monthDate, 'yyyy-MM'), income: incomeValue, expenses: expenseValue }
  })

  const lastSnapshot = snapshotRes.data
  const netWorthDelta = lastSnapshot?.net_worth ? ((netWorth - Number(lastSnapshot.net_worth)) / Number(lastSnapshot.net_worth)) * 100 : 0
  const subscriptions = detectSubscriptions(allRecentTx as any)
  const upcomingBills = estimateUpcomingBills(subscriptions)
  const topCategory = getTopCategory(last3MonthsTx as any)

  const lifetimeIncome = sumIncome(lifetimeTx as any)
  const lifetimeExpenses = sumExpenses(lifetimeTx as any)
  const dataStartDate = lifetimeTx?.[0]?.date
  const dataMonths = dataStartDate ? monthsBetween(dataStartDate, format(now, 'yyyy-MM-dd')) : 1
  const lifetimeAvgMonthlyIncome = lifetimeIncome / dataMonths
  const lifetimeAvgMonthlyExpenses = lifetimeExpenses / dataMonths

  const categorySpend = expensesByCategory(allRecentTx as any)
  const totalSubscriptions = subscriptions.reduce((sum, subscription) => sum + subscription.monthly_amount, 0)
  const habitInsights: string[] = []
  const alcoholSpend = (allRecentTx || [])
    .filter((tx) => Number(tx.amount) > 0 && tx.category === 'Alcohol & Bars')
    .reduce((sum, tx) => sum + Number(tx.amount), 0)
  if (alcoholSpend > 200) habitInsights.push(`Alcohol & bars: $${alcoholSpend.toFixed(0)} in the last 3 months`)
  if (subscriptions.length > 15) habitInsights.push(`You have ${subscriptions.length} recurring charges totaling $${totalSubscriptions.toFixed(0)}/month`)
  const diningSpend = categorySpend['Food & Dining'] || 0
  const grocerySpend = categorySpend.Groceries || 0
  if (grocerySpend > 0 && diningSpend > grocerySpend * 2) habitInsights.push(`You spend ${Math.round(diningSpend / grocerySpend)}x more on restaurants than groceries`)

  return (
    <DashboardContent
      accountsCount={accounts.length}
      hasData={hasData}
      netWorth={netWorth}
      totalAssets={assets}
      monthExpenses={expenses}
      savingsRate={currentSavingsRate}
      income={income}
      cashFlow={cashFlow}
      fixedBillsTotal={fixedBillsTotal}
      variableSpend={variableSpend}
      categoryData={currentMonthCategoryData}
      cashFlowData={cashFlowData}
      recentTransactions={recentTransactions as any}
      goals={goals as any}
      netWorthDelta={Number.isFinite(netWorthDelta) ? netWorthDelta : 0}
      topCategory={topCategory}
      upcomingBills={upcomingBills}
      showImportSuccess={params.imported === 'true'}
      avgIncome={avgIncome}
      avgExpenses={avgExpenses}
      avgSurplus={avgSurplus}
      currentMonthDay={now.getDate()}
      currentMonthLength={new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}
      lifetimeAvgMonthlyIncome={lifetimeAvgMonthlyIncome}
      lifetimeAvgMonthlyExpenses={lifetimeAvgMonthlyExpenses}
      dataCoverage={dataStartDate ? `${format(new Date(dataStartDate), 'MMM yyyy')} — ${format(now, 'MMM yyyy')} (${dataMonths} months)` : 'No imported data yet'}
      habitInsights={habitInsights}
    />
  )
}
