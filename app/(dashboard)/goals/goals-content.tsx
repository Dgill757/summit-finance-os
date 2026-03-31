'use client'

import { useState } from 'react'
import { Bot, CheckCircle2, Plus, Sparkles, Target } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { calculateGoalVelocity, getMilestone } from '@/lib/utils/finance'
import { formatCurrency } from '@/lib/utils/formatters'
import { EmptyState } from '@/components/shared/empty-state'

const colors = ['#14b8a6', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444']
const emojis = ['🎯', '🏡', '🚗', '💼', '✈️', '💍', '📈', '🏦']
const types = ['personal', 'family', 'business', 'retirement']

export default function GoalsContent({ goals, userId, savingsRate }: { goals: any[]; userId: string; savingsRate: number }) {
  const [items, setItems] = useState(goals)
  const [filter, setFilter] = useState('all')
  const [coaching, setCoaching] = useState<Record<string, string>>({})
  const [depositOpen, setDepositOpen] = useState<Record<string, boolean>>({})
  const [depositForm, setDepositForm] = useState<Record<string, { amount: string; note: string }>>({})
  const [form, setForm] = useState({ icon: '🎯', name: '', target_amount: '', current_amount: '', type: 'personal', target_date: '', color: '#14b8a6' })
  const supabase = createClient()

  const visibleGoals = items.filter((goal) => (filter === 'all' ? true : goal.type === filter))
  const activeGoals = visibleGoals.filter((goal) => !goal.is_completed)
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
    if (error) return toast.error(error.message)
    setItems((current) => [data, ...current])
    setForm({ icon: '🎯', name: '', target_amount: '', current_amount: '', type: 'personal', target_date: '', color: '#14b8a6' })
    toast.success('Goal created')
  }

  async function submitDeposit(goal: any) {
    const deposit = depositForm[goal.id]
    const amount = Number(deposit?.amount || 0)
    if (!amount) return
    const nextAmount = Number(goal.current_amount || 0) + amount
    const { data, error } = await supabase.from('goals').update({ current_amount: nextAmount, is_completed: nextAmount >= Number(goal.target_amount), completed_at: nextAmount >= Number(goal.target_amount) ? new Date().toISOString() : null }).eq('id', goal.id).select().single()
    if (error) return toast.error(error.message)
    await supabase.from('goal_deposits').insert({ goal_id: goal.id, amount, note: deposit?.note || null })
    setItems((current) => current.map((item) => (item.id === goal.id ? data : item)))
    setDepositOpen((current) => ({ ...current, [goal.id]: false }))
    toast.success('Deposit added')
  }

  async function getCoaching(goal: any) {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Dan has a goal: ${goal.name}, target $${goal.target_amount}, currently at $${goal.current_amount}, target date ${goal.target_date || 'unspecified'}. He saves ${savingsRate}% monthly. Give him 3 specific, actionable steps to reach this goal faster. Be direct and specific.`,
          },
        ],
        financialContext: { savings_rate: savingsRate, active_goals: items.length },
      }),
    })
    const data = await response.json()
    setCoaching((current) => ({ ...current, [goal.id]: data.message || 'No coaching available.' }))
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <style jsx>{`
        @keyframes confettiPop {
          0% { transform: scale(0.96); box-shadow: 0 0 0 rgba(20,184,166,0); }
          50% { transform: scale(1.01); box-shadow: 0 0 0 6px rgba(20,184,166,0.08); }
          100% { transform: scale(1); box-shadow: 0 0 0 rgba(20,184,166,0); }
        }
        .milestone-card { animation: confettiPop 900ms ease; }
      `}</style>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Active</div><div className="mt-3 font-num text-3xl font-bold text-primary">{activeGoals.length}</div></div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Completed</div><div className="mt-3 font-num text-3xl font-bold text-up">{completedGoals.length}</div></div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Total Saved</div><div className="mt-3 font-num text-3xl font-bold text-teal">{formatCurrency(totalSaved)}</div></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {['all', ...types].map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)} className={`rounded-xl border px-4 py-2 text-sm transition ${filter === tab ? 'border-teal/30 bg-teal-bg text-teal' : 'border-border text-secondary hover:border-teal/30 hover:text-primary'}`}>
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      <form onSubmit={handleCreateGoal} className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.24em] text-muted">Icon</div>
            <div className="grid grid-cols-8 gap-2">{emojis.map((emoji) => <button key={emoji} type="button" onClick={() => setForm((current) => ({ ...current, icon: emoji }))} className={`rounded-xl border px-0 py-2 text-lg ${form.icon === emoji ? 'border-teal bg-teal-bg' : 'border-border bg-panel'}`}>{emoji}</button>)}</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Goal name" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all">{types.map((type) => <option key={type}>{type}</option>)}</select>
            <input value={form.target_amount} onChange={(e) => setForm((current) => ({ ...current, target_amount: e.target.value }))} type="number" placeholder="Target amount" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <input value={form.current_amount} onChange={(e) => setForm((current) => ({ ...current, current_amount: e.target.value }))} type="number" placeholder="Current amount" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <input value={form.target_date} onChange={(e) => setForm((current) => ({ ...current, target_date: e.target.value }))} type="date" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <div className="flex gap-2">{colors.map((color) => <button key={color} type="button" onClick={() => setForm((current) => ({ ...current, color }))} className={`h-11 flex-1 rounded-xl border ${form.color === color ? 'border-primary' : 'border-border'}`} style={{ backgroundColor: color }} />)}</div>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all"><Plus size={15} /> Create Goal</button>
      </form>

      {activeGoals.length ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {activeGoals.map((goal) => {
            const progress = Number(goal.target_amount) > 0 ? Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)) : 0
            const milestone = getMilestone(progress)
            const velocity = calculateGoalVelocity({ current_amount: Number(goal.current_amount), target_amount: Number(goal.target_amount) }, Number(goal.current_amount || 0) + 1, savingsRate)
            return (
              <div key={goal.id} className={`rounded-2xl border border-border bg-surface p-5 shadow-card ${milestone ? 'milestone-card' : ''}`}>
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
                <div className="mt-2 text-xs text-secondary">At current pace: {velocity ? `${velocity.toFixed(1)} months to completion` : 'Need more savings data'}</div>
                {milestone ? <div className="mt-3 flex items-center gap-2 rounded-xl bg-teal-bg px-3 py-2 text-sm text-teal"><Sparkles size={14} /> Congratulations on hitting {milestone}% of this goal.</div> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => setDepositOpen((current) => ({ ...current, [goal.id]: !current[goal.id] }))} className="rounded-xl border border-teal/20 bg-teal-bg px-4 py-2 text-sm text-teal transition hover:border-teal/30">Add Deposit</button>
                  <button onClick={() => void getCoaching(goal)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-secondary text-sm hover:text-primary hover:border-teal/30 transition-all"><Bot size={14} /> Get AI Coaching</button>
                </div>
                {depositOpen[goal.id] ? (
                  <div className="mt-4 space-y-3 rounded-xl bg-panel/50 p-3">
                    <input value={depositForm[goal.id]?.amount || ''} onChange={(e) => setDepositForm((current) => ({ ...current, [goal.id]: { amount: e.target.value, note: current[goal.id]?.note || '' } }))} type="number" placeholder="Deposit amount" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
                    <input value={depositForm[goal.id]?.note || ''} onChange={(e) => setDepositForm((current) => ({ ...current, [goal.id]: { amount: current[goal.id]?.amount || '', note: e.target.value } }))} placeholder="Optional note" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
                    <button onClick={() => void submitDeposit(goal)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all">Submit Deposit</button>
                  </div>
                ) : null}
                {coaching[goal.id] ? <div className="mt-4 rounded-xl bg-panel/50 p-3 text-sm text-secondary whitespace-pre-wrap">{coaching[goal.id]}</div> : null}
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
