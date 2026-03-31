'use client'

import { useState } from 'react'
import { CheckCircle2, Plus, Target } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/formatters'
import { EmptyState } from '@/components/shared/empty-state'

const colors = ['#14b8a6', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444']
const emojis = ['🎯', '🏡', '🚗', '💼', '✈️', '💍', '📈', '🏦']
const types = ['personal', 'family', 'business', 'retirement']

export default function GoalsContent({ goals, userId }: { goals: any[]; userId: string }) {
  const [items, setItems] = useState(goals)
  const [form, setForm] = useState({ icon: '🎯', name: '', target_amount: '', current_amount: '', type: 'personal', target_date: '', color: '#14b8a6' })
  const supabase = createClient()

  const activeGoals = items.filter((goal) => !goal.is_completed)
  const completedGoals = items.filter((goal) => goal.is_completed)
  const totalSaved = items.reduce((sum, goal) => sum + Number(goal.current_amount || 0), 0)

  async function handleCreateGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      user_id: userId,
      icon: form.icon,
      name: form.name,
      target_amount: Number(form.target_amount || 0),
      current_amount: Number(form.current_amount || 0),
      type: form.type,
      target_date: form.target_date || null,
      color: form.color,
      is_completed: Number(form.current_amount || 0) >= Number(form.target_amount || 0) && Number(form.target_amount || 0) > 0,
    }
    const { data, error } = await supabase.from('goals').insert(payload).select().single()
    if (error) {
      toast.error(error.message)
      return
    }
    setItems((current) => [data, ...current])
    setForm({ icon: '🎯', name: '', target_amount: '', current_amount: '', type: 'personal', target_date: '', color: '#14b8a6' })
    toast.success('Goal created')
  }

  async function addDeposit(goal: any) {
    const increment = 500
    const nextAmount = Number(goal.current_amount || 0) + increment
    const { data, error } = await supabase.from('goals').update({ current_amount: nextAmount, is_completed: nextAmount >= Number(goal.target_amount) }).eq('id', goal.id).select().single()
    if (error) {
      toast.error(error.message)
      return
    }
    setItems((current) => current.map((item) => (item.id === goal.id ? data : item)))
    await supabase.from('goal_deposits').insert({ goal_id: goal.id, amount: increment, note: 'Manual deposit from UI' })
    toast.success(`Added ${formatCurrency(increment)} to ${goal.name}`)
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Active</div><div className="mt-3 font-num text-3xl font-bold text-primary">{activeGoals.length}</div></div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Completed</div><div className="mt-3 font-num text-3xl font-bold text-up">{completedGoals.length}</div></div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Total Saved</div><div className="mt-3 font-num text-3xl font-bold text-teal">{formatCurrency(totalSaved)}</div></div>
      </div>
      <form onSubmit={handleCreateGoal} className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.24em] text-muted">Icon</div>
            <div className="grid grid-cols-8 gap-2">{emojis.map((emoji) => <button key={emoji} type="button" onClick={() => setForm((current) => ({ ...current, icon: emoji }))} className={`rounded-xl border px-0 py-2 text-lg ${form.icon === emoji ? 'border-teal bg-teal-bg' : 'border-border bg-panel'}`}>{emoji}</button>)}</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Goal name" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none placeholder:text-muted" />
            <select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value }))} className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none">{types.map((type) => <option key={type}>{type}</option>)}</select>
            <input value={form.target_amount} onChange={(e) => setForm((current) => ({ ...current, target_amount: e.target.value }))} type="number" placeholder="Target amount" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none placeholder:text-muted" />
            <input value={form.current_amount} onChange={(e) => setForm((current) => ({ ...current, current_amount: e.target.value }))} type="number" placeholder="Current amount" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none placeholder:text-muted" />
            <input value={form.target_date} onChange={(e) => setForm((current) => ({ ...current, target_date: e.target.value }))} type="date" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none" />
            <div className="flex gap-2">{colors.map((color) => <button key={color} type="button" onClick={() => setForm((current) => ({ ...current, color }))} className={`h-11 flex-1 rounded-xl border ${form.color === color ? 'border-primary' : 'border-border'}`} style={{ backgroundColor: color }} />)}</div>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-medium text-canvas"><Plus size={15} /> Create Goal</button>
      </form>

      {activeGoals.length ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {activeGoals.map((goal) => {
            const progress = Number(goal.target_amount) > 0 ? Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)) : 0
            return (
              <div key={goal.id} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl" style={{ backgroundColor: `${goal.color}22`, color: goal.color }}>{goal.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-primary">{goal.name}</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-muted">{goal.type}</div>
                    </div>
                  </div>
                  <div className="font-num text-sm font-semibold text-primary">{progress}%</div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel"><div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: goal.color }} /></div>
                <div className="mt-3 font-num text-sm text-secondary">{formatCurrency(Number(goal.current_amount))} / {formatCurrency(Number(goal.target_amount))}</div>
                <button onClick={() => addDeposit(goal)} className="mt-4 rounded-xl border border-teal/20 bg-teal-bg px-4 py-2 text-sm text-teal transition hover:border-teal/30">Add Deposit</button>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Target} title="Start with something meaningful" description="Start with something meaningful — like giving your dad $50,000." />
      )}

      {completedGoals.length ? (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-primary"><CheckCircle2 size={18} className="text-up" /> Completed Goals</div>
          <div className="space-y-3">{completedGoals.map((goal) => <div key={goal.id} className="flex items-center justify-between rounded-2xl bg-panel/50 px-4 py-3"><div className="text-sm text-primary">{goal.icon} {goal.name}</div><div className="font-num text-sm text-up">{formatCurrency(Number(goal.target_amount))}</div></div>)}</div>
        </section>
      ) : null}
    </div>
  )
}
