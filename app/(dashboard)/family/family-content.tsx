'use client'

import { useMemo, useState } from 'react'
import { CATEGORY_LIST } from '@/lib/utils/categories'
import { calculateFinancialHealthScore, groupCategoryTotals } from '@/lib/utils/finance'
import { formatCurrency } from '@/lib/utils/formatters'
import { GoalRecord, TransactionRecord } from '@/types'

export function FamilyContent({ transactions, goals, totalSpending, expenseSplitPercent, accounts }: { transactions: TransactionRecord[]; goals: GoalRecord[]; totalSpending: number; userId: string; expenseSplitPercent: number; accounts: any[] }) {
  const [split, setSplit] = useState(expenseSplitPercent)
  const categories = useMemo(() => groupCategoryTotals(transactions), [transactions])
  const danShare = totalSpending * (split / 100)
  const partnerShare = totalSpending - danShare
  const liquidAssets = accounts.filter((account) => account.type === 'depository').reduce((sum, account) => sum + Number(account.current_balance || 0), 0)
  const savingsRate = totalSpending > 0 ? Math.max(0, ((liquidAssets - totalSpending) / totalSpending) * 100) : 0
  const goalProgress = goals.length ? goals.reduce((sum, goal) => sum + (Number(goal.current_amount) / Math.max(Number(goal.target_amount), 1)) * 100, 0) / goals.length : 0
  const healthScore = calculateFinancialHealthScore({ savingsRate, goalProgress, budgetAdherence: 80 })

  return (
    <div className="p-6 space-y-5">
      <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
        <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Expense Split Calculator</div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <div>
            <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(Number(e.target.value))} className="w-full accent-teal" />
            <div className="mt-3 text-sm text-secondary">Based on a <span className="font-num text-primary">{split}%</span> / <span className="font-num text-primary">{100 - split}%</span> split, Dan owes <span className="font-num text-teal">{formatCurrency(danShare)}</span> and partner owes <span className="font-num text-primary">{formatCurrency(partnerShare)}</span>.</div>
            <div className="mt-2 text-sm text-secondary">Settlement summary: Based on {split}% split, whichever person paid more than their share should be reimbursed by the other for the difference.</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-panel/60 p-4"><div className="text-xs text-muted uppercase tracking-widest">Dan's Share</div><div className="mt-3 font-num font-bold text-[28px] text-teal">{formatCurrency(danShare)}</div></div>
            <div className="rounded-2xl bg-panel/60 p-4"><div className="text-xs text-muted uppercase tracking-widest">Partner's Share</div><div className="mt-3 font-num font-bold text-[28px] text-primary">{formatCurrency(partnerShare)}</div></div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
        <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Shared Goals</div>
        <div className="grid gap-4 xl:grid-cols-3">
          {goals.map((goal) => {
            const progress = Math.min(100, Math.round((Number(goal.current_amount) / Math.max(Number(goal.target_amount), 1)) * 100))
            return (
              <div key={goal.id} className="rounded-2xl bg-panel/50 p-4">
                <div className="text-sm font-semibold text-primary">{goal.icon} {goal.name}</div>
                <div className="mt-2 font-num text-sm text-secondary">{formatCurrency(Number(goal.current_amount))} / {formatCurrency(Number(goal.target_amount))}</div>
                <div className="mt-3 h-2 rounded-full bg-surface overflow-hidden"><div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: goal.color }} /></div>
              </div>
            )
          })}
          {!goals.length && <div className="rounded-2xl bg-panel/50 p-4 text-sm text-secondary">No family goals yet. Create one on the Goals page with type set to family.</div>}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr,1fr]">
        <div className="rounded-2xl bg-surface border border-border p-5 card-hover">
          <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Spending by Category</div>
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.category}>
                <div className="mb-1 flex items-center justify-between text-sm"><span className="text-primary">{category.category}</span><span className="font-num text-secondary">{formatCurrency(category.amount)}</span></div>
                <div className="h-2 rounded-full bg-panel overflow-hidden"><div className="h-full rounded-full bg-teal" style={{ width: `${(category.amount / Math.max(totalSpending, 1)) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-surface border border-border p-5 card-hover">
          <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Family Budget Overview</div>
          <div className="space-y-4">
            <div><div className="text-sm text-secondary">Monthly spending</div><div className="font-num font-bold text-[28px] text-primary">{formatCurrency(totalSpending)}</div></div>
            <div><div className="text-sm text-secondary">Savings this month</div><div className="font-num font-bold text-[28px] text-teal">{formatCurrency(Math.max(0, liquidAssets - totalSpending))}</div></div>
            <div><div className="text-sm text-secondary">Family Financial Health</div><div className="font-num font-bold text-[28px] text-primary">{healthScore}</div></div>
          </div>
        </div>
      </section>
    </div>
  )
}
