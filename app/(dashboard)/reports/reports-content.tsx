'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { buildMonthlySeries, groupCategoryTotals } from '@/lib/utils/finance'
import { formatCurrency } from '@/lib/utils/formatters'
import { getCategoryInfo } from '@/lib/utils/categories'
import { TransactionRecord } from '@/types'

const TABS = ['cash-flow', 'spending', '50-30-20', 'year-review'] as const

export default function ReportsContent({ transactions }: { transactions: TransactionRecord[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('cash-flow')
  const monthlySeries = useMemo(() => buildMonthlySeries(transactions, 12), [transactions])
  const last30 = useMemo(() => transactions.filter((tx) => Number(tx.amount) > 0 && new Date(tx.date) >= new Date(Date.now() - 30 * 86_400_000)), [transactions])
  const categoryData = useMemo(() => groupCategoryTotals(last30), [last30])
  const topMerchants = useMemo(
    () =>
      Object.entries(last30.reduce<Record<string, number>>((acc, tx) => {
        const name = tx.merchant_name || tx.name
        acc[name] = (acc[name] || 0) + Number(tx.amount)
        return acc
      }, {}))
        .map(([merchant, amount]) => ({ merchant, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    [last30],
  )
  const currentMonth = monthlySeries[monthlySeries.length - 1]
  const previousMonth = monthlySeries[monthlySeries.length - 2]
  const categoryTrend = useMemo(
    () =>
      Array.from(new Set(transactions.map((tx) => tx.category || 'Other')))
        .slice(0, 6)
        .map((category) => ({
          category,
          amount: transactions.filter((tx) => (tx.category || 'Other') === category && Number(tx.amount) > 0 && new Date(tx.date) >= new Date(Date.now() - 180 * 86_400_000)).reduce((sum, tx) => sum + Number(tx.amount), 0),
        }))
        .sort((a, b) => b.amount - a.amount),
    [transactions],
  )
  const needsCategories = ['Housing', 'Utilities', 'Groceries', 'Transportation']
  const wantsCategories = ['Food & Dining', 'Entertainment', 'Shopping', 'Travel', 'Subscriptions']
  const currentSpending = Math.max(currentMonth?.expenses || 0, 1)
  const needs = categoryData.filter((row) => needsCategories.includes(row.category)).reduce((sum, row) => sum + row.amount, 0)
  const wants = categoryData.filter((row) => wantsCategories.includes(row.category)).reduce((sum, row) => sum + row.amount, 0)
  const savingsDebt = Math.max(0, (currentMonth?.income || 0) - (currentMonth?.expenses || 0))
  const yearRows = monthlySeries.filter((row) => row.monthKey.startsWith(String(new Date().getFullYear())))
  const yearIncome = yearRows.reduce((sum, row) => sum + row.income, 0)
  const yearSpent = yearRows.reduce((sum, row) => sum + row.expenses, 0)
  const biggestPurchase = transactions.filter((tx) => Number(tx.amount) > 0).sort((a, b) => Number(b.amount) - Number(a.amount))[0]
  const highestIncomeMonth = [...yearRows].sort((a, b) => b.income - a.income)[0]
  const lowestSpendingMonth = [...yearRows].sort((a, b) => a.expenses - b.expenses)[0]
  const yearScore = Math.max(0, Math.min(100, Math.round(((yearIncome - yearSpent) / Math.max(yearIncome, 1)) * 100 + 50)))

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm ${tab === item ? 'border-teal/30 bg-teal-bg text-teal' : 'border-border text-secondary hover:text-primary hover:border-teal/30'}`}>
            {item}
          </button>
        ))}
      </div>

      {tab === 'cash-flow' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySeries}>
                <XAxis dataKey="month" tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#131c2e', border: '1px solid #1e2d42', borderRadius: 16 }} formatter={(value) => formatCurrency(Number(value || 0))} />
                <Area type="monotone" dataKey="income" stroke="#14b8a6" fill="rgba(20,184,166,0.15)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="rgba(239,68,68,0.12)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted"><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Savings</th><th>Savings Rate</th></tr></thead>
              <tbody>{monthlySeries.map((row) => <tr key={row.monthKey} className="border-t border-border"><td className="py-3 text-primary">{row.month}</td><td className="font-num text-up">{formatCurrency(row.income)}</td><td className="font-num text-primary">{formatCurrency(row.expenses)}</td><td className="font-num text-teal">{formatCurrency(row.savings)}</td><td className="font-num text-secondary">{row.savingsRate.toFixed(1)}%</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'spending' && (
        <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="amount" nameKey="category" outerRadius={90}>
                  {categoryData.map((row) => <Cell key={row.category} fill={getCategoryInfo(row.category).color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#131c2e', border: '1px solid #1e2d42', borderRadius: 16 }} formatter={(value) => formatCurrency(Number(value || 0))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryTrend}>
                <XAxis dataKey="category" tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#131c2e', border: '1px solid #1e2d42', borderRadius: 16 }} formatter={(value) => formatCurrency(Number(value || 0))} />
                <Bar dataKey="amount" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover">
            <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Top Merchants</div>
            <div className="space-y-3">{topMerchants.map((merchant) => <div key={merchant.merchant} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3"><span className="text-primary">{merchant.merchant}</span><span className="font-num text-secondary">{formatCurrency(merchant.amount)}</span></div>)}</div>
          </div>
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover">
            <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Biggest Increases vs Last Month</div>
            <div className="space-y-3">{categoryData.slice(0, 5).map((category) => {
              const prev = previousMonth?.monthKey
              const prevAmount = transactions.filter((tx) => tx.date.startsWith(prev || '') && (tx.category || 'Other') === category.category && Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0)
              const delta = category.amount - prevAmount
              return <div key={category.category} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3"><span className="text-primary">{category.category}</span><span className={`font-num ${delta >= 0 ? 'text-down' : 'text-up'}`}>{delta >= 0 ? '+' : ''}{formatCurrency(delta)}</span></div>
            })}</div>
          </div>
        </div>
      )}

      {tab === '50-30-20' && (
        <div className="grid gap-5 md:grid-cols-3">
          {[{ label: 'Needs', value: needs, target: 50 }, { label: 'Wants', value: wants, target: 30 }, { label: 'Savings/Debt', value: savingsDebt, target: 20 }].map((item) => {
            const pct = (item.value / currentSpending) * 100
            return (
              <div key={item.label} className="rounded-2xl bg-surface border border-border p-5 card-hover">
                <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">{item.label}</div>
                <div className={`font-num font-bold text-[36px] ${pct <= item.target ? 'text-up' : 'text-down'}`}>{pct.toFixed(1)}%</div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-panel"><div className={`h-full rounded-full ${pct <= item.target ? 'bg-up' : 'bg-down'}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>
                <div className="mt-3 text-sm text-secondary">{item.label === 'Wants' ? `You're spending ${pct.toFixed(1)}% on wants. To hit 30%, cut ${formatCurrency(Math.max(0, item.value - currentSpending * 0.3))}/month.` : `Target ${item.target}%`}</div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'year-review' && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover"><div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Total Income</div><div className="font-num font-bold text-[32px] text-up">{formatCurrency(yearIncome)}</div></div>
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover"><div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Total Spent</div><div className="font-num font-bold text-[32px] text-primary">{formatCurrency(yearSpent)}</div></div>
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover"><div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Net Saved</div><div className="font-num font-bold text-[32px] text-teal">{formatCurrency(yearIncome - yearSpent)}</div></div>
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover"><div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Health Score</div><div className="font-num font-bold text-[32px] text-primary">{yearScore}</div></div>
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover md:col-span-2"><div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Top Categories</div><div className="space-y-3">{groupCategoryTotals(transactions.filter((tx) => tx.date.startsWith(String(new Date().getFullYear())))).slice(0, 5).map((category) => <div key={category.category} className="flex items-center justify-between"><span className="text-primary">{category.category}</span><span className="font-num text-secondary">{formatCurrency(category.amount)}</span></div>)}</div></div>
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover"><div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Biggest Purchase</div><div className="text-primary">{biggestPurchase?.merchant_name || biggestPurchase?.name || 'N/A'}</div><div className="font-num font-bold text-[28px] text-primary mt-2">{biggestPurchase ? formatCurrency(Number(biggestPurchase.amount)) : '$0.00'}</div></div>
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover"><div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">High / Low Months</div><div className="text-sm text-secondary">Highest income: <span className="text-primary">{highestIncomeMonth?.month || 'N/A'}</span></div><div className="text-sm text-secondary mt-2">Lowest spending: <span className="text-primary">{lowestSpendingMonth?.month || 'N/A'}</span></div></div>
        </div>
      )}
    </div>
  )
}
