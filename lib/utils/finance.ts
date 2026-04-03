import { addDays, format, startOfMonth, subMonths } from 'date-fns'
import { SubscriptionRecord, TransactionRecord } from '@/types'

// ============================================================
// SUMMIT FINANCE OS — Core Financial Calculation Utilities
// Convention: amount < 0 = income/credit, amount > 0 = expense/debit
// ============================================================

export interface Transaction {
  amount: number
  category?: string | null
  name?: string | null
  merchant_name?: string | null
  date: string
}

const DEBT_KEYWORDS = ['zwicker', 'law', 'attorney', 'credit accept', 'auto loan', 'student loan', 'recovery', 'check']

export function isIncome(tx: Transaction): boolean {
  return Number(tx.amount) < 0
}

export function isExpense(tx: Transaction): boolean {
  return Number(tx.amount) > 0
}

export function txAmount(tx: Transaction): number {
  return Math.abs(Number(tx.amount))
}

export function sumIncome(transactions: Transaction[]): number {
  return transactions.filter(isIncome).reduce((sum, tx) => sum + txAmount(tx), 0)
}

export function sumExpenses(transactions: Transaction[]): number {
  return transactions.filter(isExpense).reduce((sum, tx) => sum + Number(tx.amount), 0)
}

export function expensesByCategory(transactions: Transaction[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const tx of transactions.filter(isExpense)) {
    const category = tx.category || 'Other'
    totals[category] = (totals[category] || 0) + Number(tx.amount)
  }
  return totals
}

export function savingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0
  return Math.round(((income - expenses) / income) * 100)
}

export function avgMonthly(transactions: Transaction[], months: number): number {
  if (months <= 0) return 0
  const total = transactions.reduce((sum, tx) => sum + txAmount(tx), 0)
  return total / months
}

export function isRealIncome(tx: Transaction): boolean {
  if (!isIncome(tx)) return false
  const name = (tx.name || tx.merchant_name || '').toLowerCase()
  const isTransfer = name.includes('transfer') && !name.includes('payroll') && !name.includes('direct dep') && !name.includes('merch dep')
  const isRefund = name.includes('refund') && Math.abs(Number(tx.amount)) < 50
  return !isTransfer && !isRefund
}

export function monthsBetween(from: string, to: string): number {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  return Math.max(1, (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth()) + 1)
}

export function detectSubscriptions(transactions: TransactionRecord[]): SubscriptionRecord[] {
  const merchantMonths: Record<string, Set<string>> = {}
  const merchantAmounts: Record<string, number[]> = {}
  const latestByMerchant: Record<string, TransactionRecord> = {}

  for (const tx of transactions) {
    const merchant = (tx.merchant_name || tx.name || '').trim()
    if (!merchant || !isExpense(tx)) continue
    const month = tx.date.substring(0, 7)
    merchantMonths[merchant] ??= new Set()
    merchantAmounts[merchant] ??= []
    merchantMonths[merchant].add(month)
    merchantAmounts[merchant].push(Number(tx.amount))
    if (!latestByMerchant[merchant] || latestByMerchant[merchant].date < tx.date) latestByMerchant[merchant] = tx
  }

  return Object.entries(merchantMonths)
    .filter(([, months]) => months.size >= 2)
    .filter(([merchant]) => !DEBT_KEYWORDS.some((keyword) => merchant.toLowerCase().includes(keyword)))
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

export function detectDebtPayments(transactions: TransactionRecord[]) {
  const merchantMonths: Record<string, Set<string>> = {}
  const merchantAmounts: Record<string, number[]> = {}
  const latestByMerchant: Record<string, TransactionRecord> = {}

  for (const tx of transactions) {
    const merchant = (tx.merchant_name || tx.name || '').trim()
    if (!merchant || !isExpense(tx)) continue
    const merchantLower = merchant.toLowerCase()
    if (!DEBT_KEYWORDS.some((keyword) => merchantLower.includes(keyword))) continue
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
        category: lastTx?.category || 'Debt Payments',
      }
    })
    .sort((a, b) => b.monthly_amount - a.monthly_amount)
}

export function getTopCategory(transactions: TransactionRecord[]) {
  const totals = expensesByCategory(transactions)
  const [category, amount] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0] || ['Other', 0]
  return { category, amount }
}

export function buildMonthlySeries(transactions: TransactionRecord[], monthsBack = 12) {
  return Array.from({ length: monthsBack }).map((_, index) => {
    const monthDate = subMonths(new Date(), monthsBack - 1 - index)
    const monthKey = format(monthDate, 'yyyy-MM')
    const monthRows = transactions.filter((tx) => tx.date.startsWith(monthKey))
    const income = sumIncome(monthRows)
    const expenses = sumExpenses(monthRows)
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
  return Object.entries(expensesByCategory(transactions))
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function getMonthlyAverageExpenses(transactions: TransactionRecord[], monthCount = 3) {
  const start = format(startOfMonth(subMonths(new Date(), monthCount - 1)), 'yyyy-MM-dd')
  const scoped = transactions.filter((tx) => tx.date >= start && isExpense(tx))
  return sumExpenses(scoped) / Math.max(monthCount, 1)
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

export function calculateGoalVelocity(goal: { current_amount: number; target_amount: number }, monthlySavings: number) {
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount))
  if (monthlySavings <= 0) return null
  return remaining / monthlySavings
}

export function getMilestone(progress: number) {
  if (progress >= 100) return 100
  if (progress >= 75) return 75
  if (progress >= 50) return 50
  if (progress >= 25) return 25
  return 0
}

export function calculateFinancialHealthScore({
  savingsRate: rate,
  goalProgress,
  budgetAdherence,
}: {
  savingsRate: number
  goalProgress: number
  budgetAdherence: number
}) {
  return Math.max(0, Math.min(100, Math.round(rate * 1.2 + goalProgress * 0.4 + budgetAdherence * 0.4)))
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
