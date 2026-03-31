'use client'

import { useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getMonthlyAverageExpenses } from '@/lib/utils/finance'
import { formatCurrency } from '@/lib/utils/formatters'
import { TransactionRecord } from '@/types'

export default function PlanningContent({ accounts, transactions, goals, manualAssets, snapshots }: { accounts: any[]; transactions: TransactionRecord[]; goals: any[]; manualAssets: any[]; snapshots: any[] }) {
  const [extraSavings, setExtraSavings] = useState(500)
  const [monthlyPayment, setMonthlyPayment] = useState(600)
  const [paycheck, setPaycheck] = useState('3500')
  const expenses = getMonthlyAverageExpenses(transactions, 3)
  const currentNetWorth = accounts.reduce((sum, account) => sum + Number(account.current_balance || 0), 0) + manualAssets.reduce((sum: number, asset: any) => sum + Number(asset.value || 0), 0)
  const annualExpenses = expenses * 12
  const fireNumber = annualExpenses * 25
  const monthlySavings = Math.max(0, transactions.filter((tx) => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0) / 3 - expenses)
  const yearsToFire = monthlySavings > 0 ? Math.max(0, (fireNumber - currentNetWorth) / (monthlySavings * 12)) : null
  const emergencyFundTarget = expenses * 6
  const liquidAssets = accounts.filter((account) => account.type === 'depository').reduce((sum, account) => sum + Number(account.current_balance || 0), 0)
  const creditBalances = accounts.filter((account) => account.type === 'credit' || account.type === 'loan').map((account) => Math.abs(Number(account.current_balance || 0))).filter(Boolean)
  const totalDebt = creditBalances.reduce((sum, amount) => sum + amount, 0)
  const avalancheMonths = totalDebt > 0 ? totalDebt / monthlyPayment : 0
  const snowballMonths = totalDebt > 0 ? totalDebt / (monthlyPayment * 0.92) : 0
  const extraScenarioYears = monthlySavings + extraSavings > 0 ? Math.max(0, (fireNumber - currentNetWorth) / ((monthlySavings + extraSavings) * 12)) : null
  const projection = [1, 2, 3, 5, 7, 10].map((year) => {
    const current = currentNetWorth * Math.pow(1.07, year) + monthlySavings * 12 * year
    const improved = currentNetWorth * Math.pow(1.07, year) + monthlySavings * 1.2 * 12 * year
    return { year: `${year}y`, current, improved }
  })
  const billsDue = Math.min(Number(paycheck), expenses)
  const emergencyContribution = Math.min(Math.max(0, emergencyFundTarget - liquidAssets), Number(paycheck) * 0.2)
  const discretionary = Math.max(0, Number(paycheck) - billsDue - emergencyContribution - goals.length * 100)

  return (
    <div className="p-6 space-y-5">
      <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
        <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">FIRE Calculator</div>
        <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
          <div>
            <div className="font-num font-bold text-[36px] text-teal">{formatCurrency(fireNumber)}</div>
            <div className="mt-2 text-sm text-secondary">Annual expenses are running about {formatCurrency(annualExpenses)}. Your FIRE number is roughly 25x that amount.</div>
            <div className="mt-4 text-sm text-secondary">At your current savings pace, you'll reach FIRE in <span className="font-num text-primary">{yearsToFire ? yearsToFire.toFixed(1) : 'N/A'}</span> years.</div>
            <input type="range" min={0} max={3000} value={extraSavings} onChange={(e) => setExtraSavings(Number(e.target.value))} className="mt-4 w-full accent-teal" />
            <div className="mt-2 text-sm text-secondary">If you save {formatCurrency(extraSavings)} more per month, your FIRE timeline moves to <span className="font-num text-primary">{extraScenarioYears ? extraScenarioYears.toFixed(1) : 'N/A'}</span> years.</div>
          </div>
          <div className="rounded-2xl bg-panel/50 p-4 text-sm text-secondary">FIRE means Financial Independence, Retire Early. In practice, it means building enough invested assets that your yearly living costs can be supported without needing your main income.</div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
        <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
          <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Emergency Fund</div>
          <div className="space-y-3">
            <div className="text-sm text-secondary">Monthly expenses: <span className="font-num text-primary">{formatCurrency(expenses)}</span></div>
            <div className="text-sm text-secondary">Liquid assets: <span className="font-num text-primary">{formatCurrency(liquidAssets)}</span></div>
            <div className="text-sm text-secondary">Runway: <span className="font-num text-primary">{expenses > 0 ? (liquidAssets / expenses).toFixed(1) : '0'}</span> months of expenses</div>
            <div className="h-3 overflow-hidden rounded-full bg-panel"><div className="h-full rounded-full bg-teal" style={{ width: `${Math.min(100, (liquidAssets / Math.max(emergencyFundTarget, 1)) * 100)}%` }} /></div>
            <div className="text-sm text-secondary">You need {formatCurrency(Math.max(0, emergencyFundTarget - liquidAssets))} more to reach a 6-month fund.</div>
          </div>
        </section>
        <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
          <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Debt Payoff Planner</div>
          <input type="range" min={100} max={3000} step={50} value={monthlyPayment} onChange={(e) => setMonthlyPayment(Number(e.target.value))} className="w-full accent-teal" />
          <div className="mt-3 text-sm text-secondary">Monthly payment: <span className="font-num text-primary">{formatCurrency(monthlyPayment)}</span></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-panel/50 p-4"><div className="text-sm text-primary">Avalanche</div><div className="font-num font-bold text-[28px] text-teal">{avalancheMonths.toFixed(1)} mo</div><div className="text-xs text-secondary">Assumes 20% APR average. Saves the most interest.</div></div>
            <div className="rounded-2xl bg-panel/50 p-4"><div className="text-sm text-primary">Snowball</div><div className="font-num font-bold text-[28px] text-primary">{snowballMonths.toFixed(1)} mo</div><div className="text-xs text-secondary">Faster psychological wins, slightly higher interest cost.</div></div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
        <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">10-Year Projection</div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projection}>
              <XAxis dataKey="year" tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#131c2e', border: '1px solid #1e2d42', borderRadius: 16 }} formatter={(value) => formatCurrency(Number(value || 0))} />
              <Line type="monotone" dataKey="current" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="improved" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
        <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Paycheck Optimizer</div>
        <input value={paycheck} onChange={(e) => setPaycheck(e.target.value)} type="number" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-panel/50 p-4"><div className="text-xs text-muted">Bills due</div><div className="font-num text-primary">{formatCurrency(billsDue)}</div></div>
          <div className="rounded-xl bg-panel/50 p-4"><div className="text-xs text-muted">Emergency fund</div><div className="font-num text-primary">{formatCurrency(emergencyContribution)}</div></div>
          <div className="rounded-xl bg-panel/50 p-4"><div className="text-xs text-muted">Goals</div><div className="font-num text-primary">{formatCurrency(goals.length * 100)}</div></div>
          <div className="rounded-xl bg-panel/50 p-4"><div className="text-xs text-muted">Discretionary</div><div className="font-num text-primary">{formatCurrency(discretionary)}</div></div>
        </div>
      </section>
    </div>
  )
}
