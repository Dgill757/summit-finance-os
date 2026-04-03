'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Bot, Landmark, PiggyBank, Target, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
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
  hasData,
  netWorth,
  totalAssets,
  monthExpenses,
  savingsRate,
  income,
  cashFlow,
  fixedBillsTotal,
  variableSpend,
  categoryData,
  cashFlowData,
  recentTransactions,
  goals,
  netWorthDelta,
  topCategory,
  upcomingBills,
  showImportSuccess,
  avgIncome,
  avgExpenses,
  avgSurplus,
  currentMonthDay,
  currentMonthLength,
  lifetimeAvgMonthlyIncome,
  lifetimeAvgMonthlyExpenses,
  dataCoverage,
  habitInsights,
}: {
  accountsCount: number
  hasData: boolean
  netWorth: number
  totalAssets: number
  monthExpenses: number
  savingsRate: number
  income: number
  cashFlow: number
  fixedBillsTotal: number
  variableSpend: number
  categoryData: { category: string; amount: number }[]
  cashFlowData: { month: string; monthKey: string; income: number; expenses: number }[]
  recentTransactions: TransactionRecord[]
  goals: GoalRecord[]
  netWorthDelta: number
  topCategory: { category: string; amount: number }
  upcomingBills: Array<{ merchant: string; monthly_amount: number; next_date: string; days_until: number }>
  showImportSuccess: boolean
  avgIncome: number
  avgExpenses: number
  avgSurplus: number
  currentMonthDay: number
  currentMonthLength: number
  lifetimeAvgMonthlyIncome: number
  lifetimeAvgMonthlyExpenses: number
  dataCoverage: string
  habitInsights: string[]
}) {
  const [syncing, setSyncing] = useState(false)
  const [aiInsight, setAiInsight] = useState('')
  const [dismissImportBanner, setDismissImportBanner] = useState(false)
  const router = useRouter()

  const insightKey = useMemo(() => `dashboard-insight-${new Date().toISOString().slice(0, 10)}`, [])
  const wantsWidth = avgIncome > 0 ? Math.min(100, (variableSpend / avgIncome) * 100) : 0
  const billsWidth = avgIncome > 0 ? Math.min(100, (fixedBillsTotal / avgIncome) * 100) : 0
  const savingsWidth = avgIncome > 0 ? Math.min(100, (Math.max(avgSurplus, 0) / avgIncome) * 100) : 0

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
              content: `In one sentence, give Dan Gill the single most important financial insight from this data: Avg Monthly Income $${avgIncome}, Avg Monthly Expenses $${avgExpenses}, Savings Rate ${savingsRate}%, ${topCategory.category} is the top spending category at $${topCategory.amount}. Be specific and actionable.`,
            },
          ],
          financialContext: { avg_monthly_income: avgIncome, avg_monthly_expenses: avgExpenses, savings_rate: savingsRate, top_category: topCategory.category },
        }),
      })
      const data = await res.json()
      const message = data.message || 'Your spending concentration is the clearest lever to improve your monthly surplus.'
      setAiInsight(message)
      localStorage.setItem(insightKey, message)
    }

    void loadInsight()
  }, [avgExpenses, avgIncome, insightKey, savingsRate, topCategory.amount, topCategory.category])

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

  if (!hasData) {
    return (
      <>
        <TopBar title="Dashboard" subtitle="No financial data yet." />
        <div className="space-y-4">
          <ConnectBankPrompt onSuccess={() => router.refresh()} />
          <div className="mx-6 rounded-2xl border border-border bg-surface p-5 text-center text-sm text-secondary">
            Or import a CSV to get started immediately.
            <div className="mt-4">
              <Link href="/import" className="rounded-xl bg-teal px-4 py-2.5 font-semibold text-canvas transition-all hover:bg-teal/90">
                Import Transactions
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="pb-10">
      <TopBar title="Dashboard" subtitle="Live command center for your cash, accounts, and goals." onSync={handleSync} syncing={syncing} />
      <div className="space-y-6 px-6 py-6">
        {showImportSuccess && !dismissImportBanner ? (
          <>
            <section className="rounded-2xl border border-up/20 bg-up-bg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-up">🎉 Import complete! Your data is live. Here's your financial picture.</div>
                  <div className="mt-1 text-sm text-secondary">Your dashboard is now using imported transactions for charts, reports, goals, and AI analysis.</div>
                </div>
                <button onClick={() => setDismissImportBanner(true)} className="text-sm text-secondary hover:text-primary">Dismiss</button>
              </div>
            </section>
            <section className="grid gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card md:grid-cols-3">
              <Link href="/goals" className="rounded-xl border border-border bg-panel/50 px-4 py-4 text-sm text-primary transition hover:border-teal/30">
                <Target size={16} className="mb-2 text-teal" />
                Set Your First Goal
              </Link>
              <Link href="/budgets" className="rounded-xl border border-border bg-panel/50 px-4 py-4 text-sm text-primary transition hover:border-teal/30">
                <Wallet size={16} className="mb-2 text-teal" />
                Set Up Budgets
              </Link>
              <Link href="/advisor" className="rounded-xl border border-border bg-panel/50 px-4 py-4 text-sm text-primary transition hover:border-teal/30">
                <Bot size={16} className="mb-2 text-teal" />
                Ask the AI Advisor
              </Link>
            </section>
          </>
        ) : null}

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Monthly Command Center</div>
              <h2 className="mt-2 font-display text-xl font-semibold text-primary">{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h2>
            </div>
            <div className="text-sm text-secondary">3-month savings rate <span className="font-num text-primary">{savingsRate.toFixed(1)}%</span></div>
          </div>
          <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-panel/50 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Income</div>
              <div className="mt-3 font-num text-[28px] font-bold text-up">{formatCurrency(avgIncome)}</div>
              <div className="mt-2 text-xs text-secondary">3-month average</div>
            </div>
            <div className="rounded-2xl border border-border bg-panel/50 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Fixed Bills</div>
              <div className="mt-3 font-num text-[28px] font-bold text-down">{formatCurrency(fixedBillsTotal)}</div>
              <div className="mt-2 text-xs text-secondary">{upcomingBills.length} bills tracked</div>
            </div>
            <div className="rounded-2xl border border-border bg-panel/50 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Variable Spend</div>
              <div className="mt-3 font-num text-[28px] font-bold text-primary">{formatCurrency(variableSpend)}</div>
              <div className="mt-2 text-xs text-secondary">3-month average</div>
            </div>
            <div className="rounded-2xl border border-border bg-panel/50 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Left Over</div>
              <div className={`mt-3 font-num text-[28px] font-bold ${avgSurplus >= 0 ? 'text-teal' : 'text-down'}`}>{formatCurrency(avgSurplus)}</div>
              <div className="mt-2 text-xs text-secondary">{avgSurplus >= 0 ? `You have ${formatCurrency(avgSurplus)}/month to work with` : `You're in the hole ${formatCurrency(Math.abs(avgSurplus))}/month`}</div>
            </div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-panel">
            <div className="h-full bg-down" style={{ width: `${billsWidth}%`, float: 'left' }} />
            <div className="h-full bg-warn" style={{ width: `${wantsWidth}%`, float: 'left' }} />
            <div className="h-full bg-up" style={{ width: `${savingsWidth}%`, float: 'left' }} />
          </div>
          <div className="mt-3 text-sm text-secondary">
            You're spending {avgIncome > 0 ? Math.round((topCategory.amount / avgIncome) * 100) : 0}% of income on {topCategory.category}. Cut $200 there to save $500/month.
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          <StatCard label="Net Worth" value={netWorth} delta={netWorthDelta} deltaLabel="vs latest snapshot" icon={TrendingUp} accent="teal" />
          <StatCard label="Total Assets" value={totalAssets} icon={Landmark} accent="green" />
          <StatCard label="This Month Expenses" value={monthExpenses} icon={TrendingDown} accent="red" />
          <StatCard label="3-Month Savings Rate" value={savingsRate} format="percent" icon={PiggyBank} accent={savingsRate >= 20 ? 'green' : savingsRate >= 0 ? 'amber' : 'red'} />
        </div>

        <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">Avg Monthly Income</div>
            <div className="mt-3 font-num text-2xl font-bold text-up">{formatCurrency(avgIncome)}</div>
            <div className="mt-2 text-xs text-secondary">3-month average</div>
          </div>
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">Avg Monthly Expenses</div>
            <div className="mt-3 font-num text-2xl font-bold text-down">{formatCurrency(avgExpenses)}</div>
            <div className="mt-2 text-xs text-secondary">3-month average</div>
          </div>
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">Avg Surplus</div>
            <div className={`mt-3 font-num text-2xl font-bold ${avgSurplus >= 0 ? 'text-teal' : 'text-down'}`}>{formatCurrency(avgSurplus)}</div>
            <div className="mt-2 text-xs text-secondary">3-month average</div>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">This Month Income</div>
            <div className="mt-3 font-num text-2xl font-bold text-up">{formatCurrency(income)}</div>
            <div className="mt-2 text-xs text-secondary">Current month in progress</div>
          </div>
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">This Month Expenses</div>
            <div className="mt-3 font-num text-2xl font-bold text-down">{formatCurrency(monthExpenses)}</div>
            <div className="mt-2 text-xs text-secondary">Current month in progress</div>
          </div>
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">This Month Net</div>
            <div className={`mt-3 font-num text-2xl font-bold ${cashFlow >= 0 ? 'text-teal' : 'text-down'}`}>{formatCurrency(cashFlow)}</div>
            <div className="mt-2 text-xs text-secondary">April is {currentMonthDay} days into {currentMonthLength}</div>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">Avg Monthly Income</div>
            <div className="mt-3 font-num text-2xl font-bold text-up">{formatCurrency(lifetimeAvgMonthlyIncome)}</div>
          </div>
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">Avg Monthly Expenses</div>
            <div className="mt-3 font-num text-2xl font-bold text-down">{formatCurrency(lifetimeAvgMonthlyExpenses)}</div>
          </div>
          <div className="rounded-2xl border border-border bg-panel/60 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-muted">Data Coverage</div>
            <div className="mt-3 text-sm font-semibold text-primary">{dataCoverage}</div>
          </div>
        </section>

        {habitInsights.length ? (
          <section className="rounded-2xl border border-warn/30 bg-surface p-5 shadow-card">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-warn">
              <AlertTriangle size={14} />
              Habit Alerts
            </div>
            <div className="space-y-2">
              {habitInsights.map((insight) => (
                <div key={insight} className="rounded-xl bg-warn-bg px-4 py-3 text-sm text-primary">
                  {insight}
                </div>
              ))}
            </div>
          </section>
        ) : null}

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
          <p className="mt-4 text-sm leading-7 text-primary">{aiInsight || "Generating today's most important insight..."}</p>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Upcoming Bills</div>
              <h2 className="mt-2 font-display text-xl font-semibold text-primary">Expected this week: {formatCurrency(upcomingBills.reduce((sum, bill) => sum + bill.monthly_amount, 0))} across {upcomingBills.length} bills</h2>
            </div>
          </div>
          <div className="space-y-3">
            {upcomingBills.length ? (
              upcomingBills.map((bill) => (
                <div key={`${bill.merchant}-${bill.next_date}`} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3">
                  <div>
                    <div className="text-primary">{bill.merchant}</div>
                    <div className="text-xs text-secondary">Expected {formatDate(bill.next_date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-num text-primary">{formatCurrency(bill.monthly_amount)}</div>
                    <div className="text-xs text-secondary">{bill.days_until} days</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-secondary">No recurring charges expected in the next 7 days.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
