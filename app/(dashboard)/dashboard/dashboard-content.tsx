'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Landmark, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { TopBar } from '@/components/layout/top-bar'
import { StatCard } from '@/components/dashboard/stat-card'
import { CashFlowChart } from '@/components/charts/cash-flow-chart'
import { SpendingDonut } from '@/components/charts/spending-donut'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { GoalsStrip } from '@/components/dashboard/goals-strip'
import { ConnectBankPrompt } from '@/components/dashboard/connect-bank-prompt'
import { formatCurrency } from '@/lib/utils/formatters'
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
}) {
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()

  async function handleSync() {
    try {
      setSyncing(true)
      const [accountsRes, txRes] = await Promise.all([fetch('/api/plaid/accounts', { method: 'POST' }), fetch('/api/plaid/transactions', { method: 'POST' })])
      if (!accountsRes.ok || !txRes.ok) throw new Error('Sync failed')
      toast.success('Accounts and transactions synced')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Unable to sync financial data')
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
      </div>
    </div>
  )
}
