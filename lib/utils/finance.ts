import { addDays, differenceInCalendarMonths, format, startOfMonth, subMonths } from 'date-fns'
import { SubscriptionRecord, TransactionRecord } from '@/types'

export function detectSubscriptions(transactions: TransactionRecord[]): SubscriptionRecord[] {
  const merchantMonths: Record<string, Set<string>> = {}
  const merchantAmounts: Record<string, number[]> = {}
  const latestByMerchant: Record<string, TransactionRecord> = {}

  for (const tx of transactions) {
    const merchant = (tx.merchant_name || tx.name || '').trim()
    if (!merchant || Number(tx.amount) <= 0) continue
    const month = tx.date.substring(0, 7)
    merchantMonths[merchant] ??= new Set()
    merchantAmounts[merchant] ??= []
    merchantMonths[merchant].add(month)
    merchantAmounts[merchant].push(Number(tx.amount))
    if (!latestByMerchant[merchant] || latestByMerchant[merchant].date < tx.date) latestByMerchant[merchant] = tx
  }

  return Object.entries(merchantMonths)
    .filter(([, months]) => months.size >= 2)
    .map(([merchant, months]) => {
      const amounts = merchantAmounts[merchant] || []
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / Math.max(amounts.length, 1)
      const lastTx = latestByMerchant[merchant]
      return {
        merchant,
        monthly_amount: avgAmount,
        annual_amount: avgAmount * 12,
        months_detected: months.size,
        last_charged: lastTx?.date || '',
        logo_url: lastTx?.logo_url || null,
        category: lastTx?.category || 'Subscriptions',
      }
    })
    .sort((a, b) => b.monthly_amount - a.monthly_amount)
}

export function getTopCategory(transactions: TransactionRecord[]) {
  const totals = transactions
    .filter((tx) => Number(tx.amount) > 0)
    .reduce<Record<string, number>>((acc, tx) => {
      const category = tx.category || 'Other'
      acc[category] = (acc[category] || 0) + Number(tx.amount)
      return acc
    }, {})

  const [category, amount] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0] || ['Other', 0]
  return { category, amount }
}

export function buildMonthlySeries(transactions: TransactionRecord[], monthsBack = 12) {
  return Array.from({ length: monthsBack }).map((_, index) => {
    const monthDate = subMonths(new Date(), monthsBack - 1 - index)
    const monthKey = format(monthDate, 'yyyy-MM')
    const monthRows = transactions.filter((tx) => tx.date.startsWith(monthKey))
    const income = monthRows.filter((tx) => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
    const expenses = monthRows.filter((tx) => Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0)
    return {
      month: format(monthDate, 'MMM yy'),
      monthKey,
      income,
      expenses,
      savings: income - expenses,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
    }
  })
}

export function groupCategoryTotals(transactions: TransactionRecord[]) {
  return Object.entries(
    transactions
      .filter((tx) => Number(tx.amount) > 0)
      .reduce<Record<string, number>>((acc, tx) => {
        const category = tx.category || 'Other'
        acc[category] = (acc[category] || 0) + Number(tx.amount)
        return acc
      }, {}),
  )
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function getMonthlyAverageExpenses(transactions: TransactionRecord[], monthCount = 3) {
  const start = format(startOfMonth(subMonths(new Date(), monthCount - 1)), 'yyyy-MM-dd')
  const scoped = transactions.filter((tx) => tx.date >= start && Number(tx.amount) > 0)
  const total = scoped.reduce((sum, tx) => sum + Number(tx.amount), 0)
  return total / Math.max(monthCount, 1)
}

export function estimateUpcomingBills(subscriptions: SubscriptionRecord[]) {
  const now = new Date()
  return subscriptions
    .map((subscription) => {
      const base = subscription.last_charged ? new Date(subscription.last_charged) : now
      const nextDate = addDays(new Date(base.getFullYear(), base.getMonth() + 1, base.getDate()), 0)
      const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / 86_400_000)
      return { ...subscription, next_date: format(nextDate, 'yyyy-MM-dd'), days_until: daysUntil }
    })
    .filter((subscription) => subscription.days_until >= 0 && subscription.days_until <= 7)
    .sort((a, b) => a.days_until - b.days_until)
}

export function calculateGoalVelocity(goal: { current_amount: number; target_amount: number }, monthlySavings: number, savingsRate: number) {
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount))
  const pace = Math.max(0, monthlySavings * Math.max(0.01, savingsRate / 100))
  if (!pace) return null
  return remaining / pace
}

export function getMilestone(progress: number) {
  if (progress >= 100) return 100
  if (progress >= 75) return 75
  if (progress >= 50) return 50
  if (progress >= 25) return 25
  return 0
}

export function calculateFinancialHealthScore({
  savingsRate,
  goalProgress,
  budgetAdherence,
}: {
  savingsRate: number
  goalProgress: number
  budgetAdherence: number
}) {
  return Math.max(0, Math.min(100, Math.round(savingsRate * 1.2 + goalProgress * 0.4 + budgetAdherence * 0.4)))
}

export function averageTransactionAmountByMonth(transactions: TransactionRecord[], merchant: string) {
  const merchantRows = transactions.filter((tx) => (tx.merchant_name || tx.name) === merchant)
  const months = new Set(merchantRows.map((tx) => tx.date.substring(0, 7)))
  return {
    count: merchantRows.length,
    distinctMonths: months.size,
    average: merchantRows.reduce((sum, tx) => sum + Number(tx.amount), 0) / Math.max(merchantRows.length, 1),
  }
}
