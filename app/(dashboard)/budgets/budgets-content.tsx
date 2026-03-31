'use client'

import { useState } from 'react'
import { startOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { CATEGORY_LIST } from '@/lib/utils/categories'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/formatters'

export default function BudgetsContent({ budgets, transactions, userId }: { budgets: any[]; transactions: any[]; userId: string }) {
  const [items, setItems] = useState(budgets)
  const [category, setCategory] = useState(CATEGORY_LIST[0]?.label || 'Food & Dining')
  const [amount, setAmount] = useState('')
  const supabase = createClient()

  const monthValue = startOfMonth(new Date()).toISOString().slice(0, 10)
  const totals = items.reduce((acc, budget) => acc + Number(budget.amount), 0)
  const spentTotal = transactions.filter((tx) => Number(tx.amount) > 0).reduce((acc, tx) => acc + Number(tx.amount), 0)
  const onTrack = items.filter((budget) => {
    const spent = transactions.filter((tx) => tx.category === budget.category && Number(tx.amount) > 0).reduce((acc, tx) => acc + Number(tx.amount), 0)
    return spent <= Number(budget.amount)
  }).length

  async function handleAddBudget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = Number(amount)
    if (!parsed) return
    const { data, error } = await supabase.from('budgets').upsert({ user_id: userId, category, amount: parsed, month: monthValue }, { onConflict: 'user_id,category,month,owner' }).select().single()
    if (error) {
      toast.error(error.message)
      return
    }
    setItems((current) => {
      const remaining = current.filter((budget) => !(budget.category === data.category && budget.month === data.month))
      return [data, ...remaining]
    })
    setAmount('')
    toast.success('Budget saved')
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Total Budgeted</div><div className="mt-3 font-num text-3xl font-bold text-primary">{formatCurrency(totals)}</div></div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Total Spent</div><div className="mt-3 font-num text-3xl font-bold text-down">{formatCurrency(spentTotal)}</div></div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">On Track</div><div className="mt-3 font-num text-3xl font-bold text-up">{onTrack}</div></div>
      </div>
      <form onSubmit={handleAddBudget} className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card md:grid-cols-[1fr,180px,140px]">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none">{CATEGORY_LIST.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}</select>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" step="0.01" placeholder="Amount" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none placeholder:text-muted" />
        <button className="rounded-xl bg-teal px-4 py-3 text-sm font-medium text-canvas">Add Budget</button>
      </form>
      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((budget) => {
          const spent = transactions.filter((tx) => tx.category === budget.category && Number(tx.amount) > 0).reduce((acc, tx) => acc + Number(tx.amount), 0)
          const progress = Number(budget.amount) > 0 ? (spent / Number(budget.amount)) * 100 : 0
          const tone = progress > 100 ? 'bg-down' : progress >= 80 ? 'bg-warn' : 'bg-up'
          return (
            <div key={budget.id} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <div className="text-sm font-semibold text-primary">{budget.category}</div>
              <div className="mt-3 flex items-baseline justify-between">
                <div className="font-num text-2xl font-bold text-primary">{formatCurrency(Number(budget.amount))}</div>
                <div className="text-xs text-secondary">Spent {formatCurrency(spent)}</div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
              <div className="mt-3 text-sm text-secondary">{progress > 100 ? `Over by ${formatCurrency(spent - Number(budget.amount))}` : `${Math.max(0, Math.round(100 - progress))}% remaining`}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
