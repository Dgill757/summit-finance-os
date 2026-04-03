import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { detectSubscriptions, estimateUpcomingBills, getTopCategory } from '@/lib/utils/finance'
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

  const [accountsRes, monthTransactionsRes, recentTransactionsRes, goalsRes, snapshotRes, sixMonthTransactionsRes, billsRes, transactionCountRes] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_hidden', false),
    supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', monthStart).lte('date', monthEnd).order('date', { ascending: false }),
    supabase.from('transactions').select('*, account:accounts(name)').eq('user_id', user.id).order('date', { ascending: false }).limit(10),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('is_completed', false).order('created_at', { ascending: false }).limit(4),
    supabase.from('net_worth_snapshots').select('*').eq('user_id', user.id).order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('transactions').select('amount, date, category').eq('user_id', user.id).gte('date', sixMonthStart).order('date', { ascending: true }),
    supabase.from('manual_bills').select('*').eq('user_id', user.id).eq('is_active', true).order('amount', { ascending: false }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const accounts = accountsRes.data || []
  const monthTransactions = monthTransactionsRes.data || []
  const recentTransactions = recentTransactionsRes.data || []
  const goals = goalsRes.data || []
  const sixMonthTransactions = sixMonthTransactionsRes.data || []
  const bills = billsRes.data || []
  const transactionCount = transactionCountRes.count || 0

  const assets = accounts.filter((account) => account.type !== 'credit' && account.type !== 'loan').reduce((sum, account) => sum + Number(account.current_balance || 0), 0)
  const liabilities = accounts.filter((account) => account.type === 'credit' || account.type === 'loan').reduce((sum, account) => sum + Math.abs(Number(account.current_balance || 0)), 0)
  const netWorth = assets - liabilities
  const income = monthTransactions.filter((tx) => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
  const expenses = monthTransactions.filter((tx) => Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0)
  const cashFlow = income - expenses
  const savingsRate = income > 0 ? (cashFlow / income) * 100 : 0
  const fixedBillsTotal = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0)
  const variableSpend = Math.max(0, expenses - fixedBillsTotal)
  const hasData = accounts.length > 0 || transactionCount > 0

  const byCategory = Object.entries(
    monthTransactions
      .filter((tx) => Number(tx.amount) > 0)
      .reduce<Record<string, number>>((acc, tx) => {
        const category = tx.category || 'Other'
        acc[category] = (acc[category] || 0) + Number(tx.amount)
        return acc
      }, {}),
  )
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
    const incomeValue = monthRows.filter((tx) => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
    const expenseValue = monthRows.filter((tx) => Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0)
    return { month: label, monthKey: format(monthDate, 'yyyy-MM'), income: incomeValue, expenses: expenseValue }
  })

  const lastSnapshot = snapshotRes.data
  const netWorthDelta = lastSnapshot?.net_worth ? ((netWorth - Number(lastSnapshot.net_worth)) / Number(lastSnapshot.net_worth)) * 100 : 0
  const subscriptions = detectSubscriptions(monthTransactions as any)
  const upcomingBills = estimateUpcomingBills(subscriptions)
  const topCategory = getTopCategory(monthTransactions as any)

  return (
    <DashboardContent
      accountsCount={accounts.length}
      hasData={hasData}
      netWorth={netWorth}
      totalAssets={assets}
      monthExpenses={expenses}
      savingsRate={savingsRate}
      income={income}
      cashFlow={cashFlow}
      fixedBillsTotal={fixedBillsTotal}
      variableSpend={variableSpend}
      categoryData={byCategory}
      cashFlowData={cashFlowData}
      recentTransactions={recentTransactions as any}
      goals={goals as any}
      netWorthDelta={Number.isFinite(netWorthDelta) ? netWorthDelta : 0}
      topCategory={topCategory}
      upcomingBills={upcomingBills}
      showImportSuccess={params.imported === 'true'}
    />
  )
}
