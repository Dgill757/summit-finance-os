'use client'

import { useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getMonthlyAverageExpenses } from '@/lib/utils/finance'
import { formatCurrency } from '@/lib/utils/formatters'
import { GoalRecord, ManualBillRecord, TransactionRecord } from '@/types'

function futureValue({ presentValue, monthlyContribution, months, annualRate = 0.07 }: { presentValue: number; monthlyContribution: number; months: number; annualRate?: number }) {
  const monthlyRate = annualRate / 12
  if (months <= 0) return presentValue
  if (monthlyRate === 0) return presentValue + monthlyContribution * months
  return presentValue * Math.pow(1 + monthlyRate, months) + monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
}

function estimateMonthlyContribution(goal: GoalRecord, totalShortfall: number, available: number) {
  if (available <= 0 || totalShortfall <= 0) return 0
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount))
  return available * (remaining / totalShortfall)
}

export default function PlanningContent({
  accounts,
  transactions,
  goals,
  manualAssets,
  manualBills,
}: {
  accounts: any[]
  transactions: TransactionRecord[]
  goals: GoalRecord[]
  manualAssets: any[]
  snapshots: any[]
  manualBills: ManualBillRecord[]
}) {
  const [extraSavings, setExtraSavings] = useState(500)
  const [monthlyPayment, setMonthlyPayment] = useState(600)
  const [paycheck, setPaycheck] = useState('3500')

  const averageMonthlyExpenses = getMonthlyAverageExpenses(transactions, 3)
  const averageMonthlyIncome = useMemo(() => {
    const totalIncome = transactions.filter((tx) => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
    return totalIncome / 3
  }, [transactions])

  const totalAssets =
    accounts.filter((account) => account.type !== 'credit' && account.type !== 'loan').reduce((sum, account) => sum + Number(account.current_balance || 0), 0) +
    manualAssets.reduce((sum: number, asset: any) => sum + Number(asset.value || 0), 0)
  const totalLiabilities = accounts
    .filter((account) => account.type === 'credit' || account.type === 'loan')
    .reduce((sum, account) => sum + Math.abs(Number(account.current_balance || 0)), 0)
  const netWorth = totalAssets - totalLiabilities

  const annualExpenses = averageMonthlyExpenses * 4
  const fireNumber = annualExpenses * 25
  const monthlySavings = Math.max(0, averageMonthlyIncome - averageMonthlyExpenses)
  const yearsToFire = monthlySavings > 0 ? (fireNumber - netWorth) / (monthlySavings * 12) : null
  const improvedYearsToFire = monthlySavings + extraSavings > 0 ? (fireNumber - netWorth) / ((monthlySavings + extraSavings) * 12) : null

  const emergencyFundTarget = averageMonthlyExpenses * 6
  const liquidAssets = accounts.filter((account) => account.type === 'depository').reduce((sum, account) => sum + Number(account.current_balance || 0), 0)
  const emergencyFundShortfall = Math.max(0, emergencyFundTarget - liquidAssets)
  const emergencyMonthsCovered = averageMonthlyExpenses > 0 ? liquidAssets / averageMonthlyExpenses : 0
  const monthsToEmergencyFund = monthlySavings > 0 ? emergencyFundShortfall / monthlySavings : null

  const creditBalances = accounts
    .filter((account) => account.type === 'credit' || account.type === 'loan')
    .map((account) => Math.abs(Number(account.current_balance || 0)))
    .filter(Boolean)
  const totalDebt = creditBalances.reduce((sum, amount) => sum + amount, 0)
  const avalancheMonths = monthlyPayment > 0 ? Math.ceil(totalDebt / monthlyPayment) : 0
  const snowballMonths = monthlyPayment > 0 ? Math.ceil(totalDebt / Math.max(monthlyPayment * 0.92, 1)) : 0
  const avalancheInterest = totalDebt * 0.2 * Math.max(avalancheMonths / 12, 0)
  const snowballInterest = totalDebt * 0.2 * Math.max(snowballMonths / 12, 0)

  const projection = [1, 2, 3, 5, 7, 10].map((year) => ({
    year: `${year}y`,
    current: futureValue({ presentValue: netWorth, monthlyContribution: monthlySavings, months: year * 12 }),
    improved: futureValue({ presentValue: netWorth, monthlyContribution: monthlySavings * 1.2, months: year * 12 }),
  }))

  const paycheckAmount = Number(paycheck || 0)
  const billsDue = manualBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0)
  const afterBills = Math.max(0, paycheckAmount - billsDue)
  const totalGoalShortfall = goals.reduce((sum, goal) => sum + Math.max(0, Number(goal.target_amount) - Number(goal.current_amount)), 0)
  const goalPool = afterBills * 0.3
  const savingsAllocation = Math.max(0, (afterBills - goalPool) * 0.2)
  const discretionary = Math.max(0, paycheckAmount - billsDue - goalPool - savingsAllocation)
  const paycheckGoalAllocations = goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    amount: estimateMonthlyContribution(goal, totalGoalShortfall, goalPool),
  }))

  return (
    <div className="space-y-5 p-6">
      <section className="rounded-2xl border border-border bg-surface p-5 card-hover">
        <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">FIRE Calculator</div>
        <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <div>
            <div className="font-num text-[36px] font-bold text-teal">{formatCurrency(fireNumber)}</div>
            <div className="mt-2 text-sm text-secondary">
              Based on a 3-month average expense run rate of {formatCurrency(averageMonthlyExpenses)}/month, your annual expense base is {formatCurrency(annualExpenses)}.
            </div>
            <div className="mt-4 text-sm text-secondary">
              At your current savings pace, you reach FIRE in <span className="font-num text-primary">{yearsToFire && yearsToFire > 0 ? yearsToFire.toFixed(1) : 'N/A'}</span> years.
            </div>
            <input type="range" min={0} max={3000} step={50} value={extraSavings} onChange={(event) => setExtraSavings(Number(event.target.value))} className="mt-4 w-full accent-teal" />
            <div className="mt-2 text-sm text-secondary">
              Saving {formatCurrency(extraSavings)} more per month moves the timeline to <span className="font-num text-primary">{improvedYearsToFire && improvedYearsToFire > 0 ? improvedYearsToFire.toFixed(1) : 'N/A'}</span> years.
            </div>
          </div>
          <div className="rounded-2xl bg-panel/50 p-4 text-sm text-secondary">
            FIRE means building enough invested assets that your living costs can be covered without needing your main income. In this model, the target is 25 times your annual spending.
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
        <section className="rounded-2xl border border-border bg-surface p-5 card-hover">
          <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Emergency Fund</div>
          <div className="space-y-3">
            <div className="text-sm text-secondary">Current: <span className="font-num text-primary">{emergencyMonthsCovered.toFixed(1)}</span> months</div>
            <div className="text-sm text-secondary">Need: <span className="font-num text-primary">6.0</span> months</div>
            <div className="text-sm text-secondary">Shortfall: <span className="font-num text-primary">{formatCurrency(emergencyFundShortfall)}</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-panel">
              <div className="h-full rounded-full bg-teal" style={{ width: `${Math.min(100, (liquidAssets / Math.max(emergencyFundTarget, 1)) * 100)}%` }} />
            </div>
            <div className="text-sm text-secondary">
              At your current savings pace, full emergency coverage is <span className="font-num text-primary">{monthsToEmergencyFund && monthsToEmergencyFund > 0 ? `${Math.ceil(monthsToEmergencyFund)} months away` : 'already covered'}</span>.
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 card-hover">
          <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Debt Payoff Planner</div>
          <input type="range" min={100} max={3000} step={50} value={monthlyPayment} onChange={(event) => setMonthlyPayment(Number(event.target.value))} className="w-full accent-teal" />
          <div className="mt-3 text-sm text-secondary">Monthly payment: <span className="font-num text-primary">{formatCurrency(monthlyPayment)}</span></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-panel/50 p-4">
              <div className="text-sm text-primary">Avalanche</div>
              <div className="font-num text-[28px] font-bold text-teal">{avalancheMonths} mo</div>
              <div className="text-xs text-secondary">Estimated interest: {formatCurrency(avalancheInterest)}</div>
            </div>
            <div className="rounded-2xl bg-panel/50 p-4">
              <div className="text-sm text-primary">Snowball</div>
              <div className="font-num text-[28px] font-bold text-primary">{snowballMonths} mo</div>
              <div className="text-xs text-secondary">Estimated interest: {formatCurrency(snowballInterest)}</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-secondary">Avalanche saves about <span className="font-num text-teal">{formatCurrency(Math.max(0, snowballInterest - avalancheInterest))}</span> in estimated interest.</div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 card-hover">
        <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">10-Year Projection</div>
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

      <section className="rounded-2xl border border-border bg-surface p-5 card-hover">
        <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Paycheck Optimizer</div>
        <input value={paycheck} onChange={(event) => setPaycheck(event.target.value)} type="number" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30 transition-all" />
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-panel/50 p-4">
            <div className="text-xs text-muted">Bills due</div>
            <div className="font-num text-primary">{formatCurrency(billsDue)}</div>
          </div>
          <div className="rounded-xl bg-panel/50 p-4">
            <div className="text-xs text-muted">Goal contributions</div>
            <div className="font-num text-primary">{formatCurrency(goalPool)}</div>
          </div>
          <div className="rounded-xl bg-panel/50 p-4">
            <div className="text-xs text-muted">Savings</div>
            <div className="font-num text-primary">{formatCurrency(savingsAllocation)}</div>
          </div>
          <div className="rounded-xl bg-panel/50 p-4">
            <div className="text-xs text-muted">Discretionary</div>
            <div className="font-num text-primary">{formatCurrency(discretionary)}</div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {paycheckGoalAllocations.map((goal) => (
            <div key={goal.id} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3 text-sm">
              <span className="text-primary">{goal.name}</span>
              <span className="font-num text-secondary">{formatCurrency(goal.amount)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
