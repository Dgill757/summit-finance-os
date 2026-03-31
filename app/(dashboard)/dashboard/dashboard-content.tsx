'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, Landmark, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { TopBar } from '@/components/layout/top-bar'
import { StatCard } from '@/components/dashboard/stat-card'
import { CashFlowChart } from '@/components/charts/cash-flow-chart'
import { SpendingDonut } from '@/components/charts/spending-donut'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { GoalsStrip } from '@/components/dashboard/goals-strip'
import { ConnectBankPrompt } from '@/components/dashboard/connect-bank-prompt'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { GoalRecord, TransactionRecord } from '@/types'

export default function DashboardContent({
  accountsCount,
  netWorth,
  totalAssets,
  monthExpenses,
  savingsRate,
  income,
  cashFlow,
  categoryData,
  cashFlowData,
  recentTransactions,
  goals,
  netWorthDelta,
  topCategory,
  upcomingBills,
}: {
  accountsCount: number
  netWorth: number
  totalAssets: number
  monthExpenses: number
  savingsRate: number
  income: number
  cashFlow: number
  categoryData: { category: string; amount: number }[]
  cashFlowData: { month: string; income: number; expenses: number }[]
  recentTransactions: TransactionRecord[]
  goals: GoalRecord[]
  netWorthDelta: number
  topCategory: { category: string; amount: number }
  upcomingBills: Array<{ merchant: string; monthly_amount: number; next_date: string; days_until: number }>
}) {
  const [syncing, setSyncing] = useState(false)
  const [aiInsight, setAiInsight] = useState('')
  const router = useRouter()

  const insightKey = useMemo(() => `dashboard-insight-${new Date().toISOString().slice(0, 10)}`, [])

  useEffect(() => {
    const cached = localStorage.getItem(insightKey)
    if (cached) {
      setAiInsight(cached)
      return
    }
    async function loadInsight() {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `In one sentence, give Dan Gill the single most important financial insight from this data: Net Worth $${netWorth}, Month Expenses $${monthExpenses}, Savings Rate ${savingsRate}%, ${topCategory.category} is the top spending category at $${topCategory.amount}. Be specific and actionable.`,
            },
          ],
          financialContext: { net_worth: netWorth, month_expenses: monthExpenses, savings_rate: savingsRate, top_category: topCategory.category },
        }),
      })
      const data = await res.json()
      const message = data.message || 'Your spending concentration is the clearest lever to improve this month.'
      setAiInsight(message)
      localStorage.setItem(insightKey, message)
    }
    void loadInsight()
  }, [insightKey, monthExpenses, netWorth, savingsRate, topCategory.amount, topCategory.category])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch('/api/plaid/accounts', { method: 'POST' })
      const res = await fetch('/api/plaid/transactions', { method: 'POST' })
      const data = await res.json()
      toast.success(`Synced ${data.synced || 0} transactions`)
      router.refresh()
    } catch {
      toast.error('Sync failed — check your connection')
    } finally {
      setSyncing(false)
    }
  }

  if (!accountsCount) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="No institutions connected yet." />
        <ConnectBankPrompt onSuccess={() => router.refresh()} />
      </>
    )
  }

  return (
    <div className="pb-10">
      <TopBar title="Dashboard" subtitle="Live command center for your cash, accounts, and goals." onSync={handleSync} syncing={syncing} />
      <div className="space-y-6 px-6 py-6">
        <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          <StatCard label="Net Worth" value={netWorth} delta={netWorthDelta} deltaLabel="vs latest snapshot" icon={TrendingUp} accent="teal" />
          <StatCard label="Total Assets" value={totalAssets} icon={Landmark} accent="green" />
          <StatCard label="Month Expenses" value={monthExpenses} icon={TrendingDown} accent="red" />
          <StatCard label="Savings Rate" value={savingsRate} format="percent" icon={PiggyBank} accent={savingsRate >= 20 ? 'green' : savingsRate >= 0 ? 'amber' : 'red'} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="mb-4">
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Cash Flow</div>
              <h2 className="mt-2 font-display text-xl font-semibold text-primary">Six-month income vs expenses</h2>
            </div>
            <CashFlowChart data={cashFlowData} />
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="mb-4">
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Spending Mix</div>
              <h2 className="mt-2 font-display text-xl font-semibold text-primary">Top categories this month</h2>
            </div>
            <SpendingDonut data={categoryData} />
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="mb-4">
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Transactions</div>
              <h2 className="mt-2 font-display text-xl font-semibold text-primary">Recent activity</h2>
            </div>
            <RecentTransactions transactions={recentTransactions} />
          </section>
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="mb-4">
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Goals</div>
              <h2 className="mt-2 font-display text-xl font-semibold text-primary">Active priorities</h2>
            </div>
            <GoalsStrip goals={goals} />
          </section>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted">
            <Bot size={14} className="text-teal" />
            AI Insight
          </div>
          <div className="h-1 w-full rounded-full bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
          <p className="mt-4 text-sm leading-7 text-primary">{aiInsight || 'Generating today’s most important insight...'}</p>
        </section>

        <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">Income</div>
            <div className="mt-3 font-num text-2xl font-bold text-up">{formatCurrency(income)}</div>
          </div>
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">Expenses</div>
            <div className="mt-3 font-num text-2xl font-bold text-down">{formatCurrency(monthExpenses)}</div>
          </div>
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">Net Cash Flow</div>
            <div className={`mt-3 font-num text-2xl font-bold ${cashFlow >= 0 ? 'text-teal' : 'text-down'}`}>{formatCurrency(cashFlow)}</div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Upcoming Bills</div>
              <h2 className="mt-2 font-display text-xl font-semibold text-primary">Expected this week: {formatCurrency(upcomingBills.reduce((sum, bill) => sum + bill.monthly_amount, 0))} across {upcomingBills.length} bills</h2>
            </div>
          </div>
          <div className="space-y-3">
            {upcomingBills.length ? upcomingBills.map((bill) => (
              <div key={`${bill.merchant}-${bill.next_date}`} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3">
                <div><div className="text-primary">{bill.merchant}</div><div className="text-xs text-secondary">Expected {formatDate(bill.next_date)}</div></div>
                <div className="text-right"><div className="font-num text-primary">{formatCurrency(bill.monthly_amount)}</div><div className="text-xs text-secondary">{bill.days_until} days</div></div>
              </div>
            )) : <div className="text-sm text-secondary">No recurring charges expected in the next 7 days.</div>}
          </div>
        </section>
      </div>
    </div>
  )
}
