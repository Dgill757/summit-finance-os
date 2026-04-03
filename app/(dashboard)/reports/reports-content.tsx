'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { buildMonthlySeries, groupCategoryTotals } from '@/lib/utils/finance'
import { getCategoryInfo } from '@/lib/utils/categories'
import { formatCurrency } from '@/lib/utils/formatters'
import { TransactionRecord } from '@/types'

const TABS = ['cash-flow', 'spending', '50-30-20', 'year-review'] as const
const NEEDS = ['Housing', 'Utilities', 'Transportation', 'Health', 'Groceries']
const WANTS = ['Food & Dining', 'Entertainment', 'Shopping', 'Travel', 'Subscriptions']
const CATEGORY_COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#22c55e', '#a855f7']

function monthKey(date: string) {
  return date.slice(0, 7)
}

export default function ReportsContent({ transactions }: { transactions: TransactionRecord[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('cash-flow')

  const monthlySeries = useMemo(() => buildMonthlySeries(transactions, 12), [transactions])
  const last30 = useMemo(() => transactions.filter((tx) => Number(tx.amount) > 0 && new Date(tx.date) >= new Date(Date.now() - 30 * 86_400_000)), [transactions])
  const categoryData = useMemo(() => groupCategoryTotals(last30), [last30])
  const topMerchants = useMemo(
    () =>
      Object.entries(
        last30.reduce<Record<string, number>>((acc, tx) => {
          const name = tx.merchant_name || tx.name
          acc[name] = (acc[name] || 0) + Number(tx.amount)
          return acc
        }, {}),
      )
        .map(([merchant, amount]) => ({ merchant, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    [last30],
  )

  const categoryTrend = useMemo(() => {
    const recentMonths = monthlySeries.slice(-6).map((row) => row.monthKey)
    const topCategories = groupCategoryTotals(transactions.filter((tx) => recentMonths.includes(monthKey(tx.date)))).slice(0, 5).map((item) => item.category)
    return recentMonths.map((month) => {
      const row: Record<string, string | number> = { month }
      topCategories.forEach((category) => {
        row[category] = transactions
          .filter((tx) => Number(tx.amount) > 0 && monthKey(tx.date) === month && (tx.category || 'Other') === category)
          .reduce((sum, tx) => sum + Number(tx.amount), 0)
      })
      return row
    })
  }, [monthlySeries, transactions])

  const currentMonth = monthlySeries[monthlySeries.length - 1]
  const currentMonthKey = currentMonth?.monthKey || ''
  const sameMonthLastYearKey = currentMonthKey
    ? `${Number(currentMonthKey.slice(0, 4)) - 1}-${currentMonthKey.slice(5, 7)}`
    : ''

  const currentMonthCategories = groupCategoryTotals(transactions.filter((tx) => Number(tx.amount) > 0 && monthKey(tx.date) === currentMonthKey))
  const lastYearSameMonthCategories = groupCategoryTotals(transactions.filter((tx) => Number(tx.amount) > 0 && monthKey(tx.date) === sameMonthLastYearKey))
  const biggestIncreases = currentMonthCategories
    .map((item) => {
      const lastYearAmount = lastYearSameMonthCategories.find((row) => row.category === item.category)?.amount || 0
      return { category: item.category, delta: item.amount - lastYearAmount }
    })
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5)

  const needs = currentMonthCategories.filter((row) => NEEDS.includes(row.category)).reduce((sum, row) => sum + row.amount, 0)
  const wants = currentMonthCategories.filter((row) => WANTS.includes(row.category)).reduce((sum, row) => sum + row.amount, 0)
  const income = currentMonth?.income || 0
  const savings = Math.max(0, income - (needs + wants))
  const totalForRule = Math.max(income, 1)
  const ratioSegments = [
    { label: 'Needs', value: needs, pct: (needs / totalForRule) * 100, color: '#ef4444' },
    { label: 'Wants', value: wants, pct: (wants / totalForRule) * 100, color: '#f59e0b' },
    { label: 'Savings', value: savings, pct: (savings / totalForRule) * 100, color: '#22c55e' },
  ]

  const yearRows = monthlySeries.filter((row) => row.monthKey.startsWith(String(new Date().getFullYear())))
  const yearIncome = yearRows.reduce((sum, row) => sum + row.income, 0)
  const yearSpent = yearRows.reduce((sum, row) => sum + row.expenses, 0)
  const biggestPurchase = transactions.filter((tx) => Number(tx.amount) > 0).sort((a, b) => Number(b.amount) - Number(a.amount))[0]
  const highestIncomeMonth = [...yearRows].sort((a, b) => b.income - a.income)[0]
  const lowestSpendingMonth = [...yearRows].sort((a, b) => a.expenses - b.expenses)[0]
  const yearScore = Math.max(0, Math.min(100, Math.round(((yearIncome - yearSpent) / Math.max(yearIncome, 1)) * 100 + 50)))

  function exportPdfSummary() {
    const summary = [
      'Summit Finance OS — Report Summary',
      '',
      `Current Month Income: ${formatCurrency(currentMonth?.income || 0)}`,
      `Current Month Expenses: ${formatCurrency(currentMonth?.expenses || 0)}`,
      `Current Month Savings: ${formatCurrency(currentMonth?.savings || 0)}`,
      `Year Income: ${formatCurrency(yearIncome)}`,
      `Year Spent: ${formatCurrency(yearSpent)}`,
      `Year Net Saved: ${formatCurrency(yearIncome - yearSpent)}`,
      `Top Spending Category: ${currentMonthCategories[0]?.category || 'N/A'} ${currentMonthCategories[0] ? formatCurrency(currentMonthCategories[0].amount) : ''}`,
    ].join('\n')
    const popup = window.open('', '_blank', 'width=900,height=700')
    if (!popup) return
    popup.document.write(`<pre style="font-family: DM Mono, monospace; white-space: pre-wrap; padding: 24px; background: #080c14; color: #e8edf5;">${summary}</pre>`)
    popup.document.close()
    popup.print()
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`rounded-xl border px-4 py-2 text-sm transition-all ${tab === item ? 'border-teal/30 bg-teal-bg text-teal' : 'border-border text-secondary hover:border-teal/30 hover:text-primary'}`}>
              {item}
            </button>
          ))}
        </div>
        <button onClick={exportPdfSummary} className="rounded-xl border border-border px-4 py-2 text-sm text-secondary transition hover:border-teal/30 hover:text-primary">
          Export PDF
        </button>
      </div>

      {tab === 'cash-flow' && (
        <div className="space-y-5">
          <div className="h-[320px] rounded-2xl border border-border bg-surface p-5 card-hover">
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
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-5 card-hover">
            <table className="w-full text-sm">
              <thead className="text-left text-muted"><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Savings</th><th>Savings Rate</th></tr></thead>
              <tbody>{monthlySeries.map((row) => <tr key={row.monthKey} className="border-t border-border"><td className="py-3 text-primary">{row.month}</td><td className="font-num text-up">{formatCurrency(row.income)}</td><td className="font-num text-primary">{formatCurrency(row.expenses)}</td><td className="font-num text-teal">{formatCurrency(row.savings)}</td><td className="font-num text-secondary">{row.savingsRate.toFixed(1)}%</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'spending' && (
        <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
          <div className="h-[320px] rounded-2xl border border-border bg-surface p-5 card-hover">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="amount" nameKey="category" outerRadius={90}>
                  {categoryData.map((row) => <Cell key={row.category} fill={getCategoryInfo(row.category).color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#131c2e', border: '1px solid #1e2d42', borderRadius: 16 }} formatter={(value) => formatCurrency(Number(value || 0))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[320px] rounded-2xl border border-border bg-surface p-5 card-hover">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={categoryTrend}>
                <XAxis dataKey="month" tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#131c2e', border: '1px solid #1e2d42', borderRadius: 16 }} formatter={(value) => formatCurrency(Number(value || 0))} />
                <Legend />
                {Object.keys(categoryTrend[0] || {})
                  .filter((key) => key !== 'month')
                  .map((category, index) => (
                    <Line key={category} type="monotone" dataKey={category} stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} strokeWidth={2.25} dot={false} />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 card-hover">
            <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Top Merchants</div>
            <div className="space-y-3">{topMerchants.map((merchant) => <div key={merchant.merchant} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3"><span className="text-primary">{merchant.merchant}</span><span className="font-num text-secondary">{formatCurrency(merchant.amount)}</span></div>)}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 card-hover">
            <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Current Month vs Same Month Last Year</div>
            <div className="space-y-3">
              {biggestIncreases.map((item) => (
                <div key={item.category} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3">
                  <span className="text-primary">{item.category}</span>
                  <span className={`font-num ${item.delta >= 0 ? 'text-down' : 'text-up'}`}>{item.delta >= 0 ? '+' : ''}{formatCurrency(item.delta)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === '50-30-20' && (
        <div className="space-y-5 rounded-2xl border border-border bg-surface p-5 card-hover">
          <div className="overflow-hidden rounded-full bg-panel">
            <div className="flex h-6 w-full">
              {ratioSegments.map((segment) => (
                <div key={segment.label} style={{ width: `${Math.max(segment.pct, 0)}%`, backgroundColor: segment.color }} />
              ))}
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {ratioSegments.map((segment) => (
              <div key={segment.label} className="rounded-2xl bg-panel/50 p-5">
                <div className="text-xs font-mono font-semibold uppercase tracking-widest text-muted">{segment.label}</div>
                <div className="mt-3 font-num text-[32px] font-bold text-primary">{segment.pct.toFixed(1)}%</div>
                <div className="mt-2 text-sm text-secondary">{formatCurrency(segment.value)}</div>
              </div>
            ))}
          </div>
          <div className="text-sm text-secondary">
            You're spending <span className="font-num text-primary">{ratioSegments[1].pct.toFixed(1)}%</span> on wants. To hit 30%, cut{' '}
            <span className="font-num text-primary">{formatCurrency(Math.max(0, wants - totalForRule * 0.3))}</span>/month.
          </div>
        </div>
      )}

      {tab === 'year-review' && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-5 card-hover"><div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Total Income</div><div className="font-num text-[32px] font-bold text-up">{formatCurrency(yearIncome)}</div></div>
          <div className="rounded-2xl border border-border bg-surface p-5 card-hover"><div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Total Spent</div><div className="font-num text-[32px] font-bold text-primary">{formatCurrency(yearSpent)}</div></div>
          <div className="rounded-2xl border border-border bg-surface p-5 card-hover"><div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Net Saved</div><div className="font-num text-[32px] font-bold text-teal">{formatCurrency(yearIncome - yearSpent)}</div></div>
          <div className="rounded-2xl border border-border bg-surface p-5 card-hover"><div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Health Score</div><div className="font-num text-[32px] font-bold text-primary">{yearScore}</div></div>
          <div className="rounded-2xl border border-border bg-surface p-5 card-hover md:col-span-2">
            <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Top Categories</div>
            <div className="space-y-3">{groupCategoryTotals(transactions.filter((tx) => tx.date.startsWith(String(new Date().getFullYear())))).slice(0, 5).map((category) => <div key={category.category} className="flex items-center justify-between"><span className="text-primary">{category.category}</span><span className="font-num text-secondary">{formatCurrency(category.amount)}</span></div>)}</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 card-hover"><div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Biggest Purchase</div><div className="text-primary">{biggestPurchase?.merchant_name || biggestPurchase?.name || 'N/A'}</div><div className="mt-2 font-num text-[28px] font-bold text-primary">{biggestPurchase ? formatCurrency(Number(biggestPurchase.amount)) : '$0.00'}</div></div>
          <div className="rounded-2xl border border-border bg-surface p-5 card-hover"><div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">High / Low Months</div><div className="text-sm text-secondary">Highest income: <span className="text-primary">{highestIncomeMonth?.month || 'N/A'}</span></div><div className="mt-2 text-sm text-secondary">Lowest spending: <span className="text-primary">{lowestSpendingMonth?.month || 'N/A'}</span></div></div>
        </div>
      )}
    </div>
  )
}
