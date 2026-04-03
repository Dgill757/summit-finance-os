'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { Bot, CheckCircle2, History, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getMilestone } from '@/lib/utils/finance'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { EmptyState } from '@/components/shared/empty-state'
import { GoalRecord } from '@/types'

const COLORS = ['#14b8a6', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444']
const EMOJIS = ['🎯', '🏡', '🚗', '💼', '✈️', '💎', '📈', '🏦']
const TYPES = ['personal', 'family', 'business', 'retirement']

type GoalDepositRecord = { id: string; goal_id: string; amount: number; note?: string | null; created_at: string }
type GoalForm = { icon: string; name: string; target_amount: string; current_amount: string; type: string; target_date: string; color: string }

function buildForm(goal?: GoalRecord): GoalForm {
  return {
    icon: goal?.icon || '🎯',
    name: goal?.name || '',
    target_amount: String(goal?.target_amount || ''),
    current_amount: String(goal?.current_amount || ''),
    type: goal?.type || 'personal',
    target_date: goal?.target_date || '',
    color: goal?.color || '#14b8a6',
  }
}

export default function GoalsContent({
  goals,
  goalDeposits,
  userId,
  savingsRate,
  income,
}: {
  goals: GoalRecord[]
  goalDeposits: GoalDepositRecord[]
  userId: string
  savingsRate: number
  income: number
}) {
  const supabase = createClient()
  const [items, setItems] = useState(goals)
  const [deposits, setDeposits] = useState(goalDeposits)
  const [filter, setFilter] = useState('all')
  const [coaching, setCoaching] = useState<Record<string, string>>({})
  const [depositOpen, setDepositOpen] = useState<Record<string, boolean>>({})
  const [historyOpen, setHistoryOpen] = useState<Record<string, boolean>>({})
  const [depositForm, setDepositForm] = useState<Record<string, { amount: string; note: string }>>({})
  const [editGoalId, setEditGoalId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<GoalForm>(buildForm())
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [form, setForm] = useState<GoalForm>(buildForm())

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
    setForm(buildForm())
    toast.success('Goal created')
  }

  async function saveGoalEdits(goalId: string) {
    const updates = {
      icon: editForm.icon,
      name: editForm.name,
      target_amount: Number(editForm.target_amount || 0),
      current_amount: Number(editForm.current_amount || 0),
      type: editForm.type,
      target_date: editForm.target_date || null,
      color: editForm.color,
      is_completed: Number(editForm.current_amount || 0) >= Number(editForm.target_amount || 0) && Number(editForm.target_amount || 0) > 0,
    }
    const { data, error } = await supabase.from('goals').update(updates).eq('id', goalId).eq('user_id', userId).select().single()
    if (error) return toast.error(error.message)
    setItems((current) => current.map((item) => (item.id === goalId ? data : item)))
    setEditGoalId(null)
    toast.success('Goal updated')
  }

  async function deleteGoal() {
    if (!deleteGoalId) return
    if (deleteConfirm !== 'DELETE') return toast.error('Type DELETE to confirm')
    const { error } = await supabase.from('goals').delete().eq('id', deleteGoalId).eq('user_id', userId)
    if (error) return toast.error(error.message)
    setItems((current) => current.filter((goal) => goal.id !== deleteGoalId))
    setDeleteGoalId(null)
    setDeleteConfirm('')
    toast.success('Goal deleted')
  }

  async function submitDeposit(goal: GoalRecord) {
    const deposit = depositForm[goal.id]
    const amount = Number(deposit?.amount || 0)
    if (!amount) return
    const previousProgress = Number(goal.target_amount) > 0 ? Math.round((Number(goal.current_amount || 0) / Number(goal.target_amount)) * 100) : 0
    const nextAmount = Number(goal.current_amount || 0) + amount
    const nextProgress = Number(goal.target_amount) > 0 ? Math.round((nextAmount / Number(goal.target_amount)) * 100) : 0
    const completed = nextAmount >= Number(goal.target_amount)
    const { data, error } = await supabase
      .from('goals')
      .update({ current_amount: nextAmount, is_completed: completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', goal.id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) return toast.error(error.message)
    const { data: newDeposit } = await supabase
      .from('goal_deposits')
      .insert({ goal_id: goal.id, amount, note: deposit?.note || null })
      .select()
      .single()

    setItems((current) => current.map((item) => (item.id === goal.id ? data : item)))
    if (newDeposit) setDeposits((current) => [newDeposit, ...current])
    setDepositOpen((current) => ({ ...current, [goal.id]: false }))
    setDepositForm((current) => ({ ...current, [goal.id]: { amount: '', note: '' } }))

    const previousMilestone = getMilestone(previousProgress)
    const nextMilestone = getMilestone(nextProgress)
    if (nextMilestone > previousMilestone) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } })
    }
    toast.success('Deposit added')
  }

  async function getCoaching(goal: GoalRecord) {
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
        financialContext: { savings_rate: savingsRate, active_goals: items.length, month_income: income },
      }),
    })
    const data = await response.json()
    setCoaching((current) => ({ ...current, [goal.id]: data.message || 'No coaching available.' }))
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Active</div><div className="mt-3 font-num text-3xl font-bold text-primary">{activeGoals.length}</div></div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Completed</div><div className="mt-3 font-num text-3xl font-bold text-up">{completedGoals.length}</div></div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Total Saved</div><div className="mt-3 font-num text-3xl font-bold text-teal">{formatCurrency(totalSaved)}</div></div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', ...TYPES].map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)} className={`rounded-xl border px-4 py-2 text-sm transition ${filter === tab ? 'border-teal/30 bg-teal-bg text-teal' : 'border-border text-secondary hover:border-teal/30 hover:text-primary'}`}>
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleCreateGoal} className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="grid gap-4 lg:grid-cols-[1fr,1fr]">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.24em] text-muted">Icon</div>
            <div className="grid grid-cols-8 gap-2">
              {EMOJIS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => setForm((current) => ({ ...current, icon: emoji }))} className={`rounded-xl border px-0 py-2 text-lg ${form.icon === emoji ? 'border-teal bg-teal-bg' : 'border-border bg-panel'}`}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Goal name" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30 transition-all" />
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30 transition-all">
              {TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
            <input value={form.target_amount} onChange={(event) => setForm((current) => ({ ...current, target_amount: event.target.value }))} type="number" placeholder="Target amount" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30 transition-all" />
            <input value={form.current_amount} onChange={(event) => setForm((current) => ({ ...current, current_amount: event.target.value }))} type="number" placeholder="Current amount" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30 transition-all" />
            <input value={form.target_date} onChange={(event) => setForm((current) => ({ ...current, target_date: event.target.value }))} type="date" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30 transition-all" />
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button key={color} type="button" onClick={() => setForm((current) => ({ ...current, color }))} className={`h-11 flex-1 rounded-xl border ${form.color === color ? 'border-primary' : 'border-border'}`} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-canvas transition-all hover:bg-teal/90"><Plus size={15} /> Create Goal</button>
      </form>

      {activeGoals.length ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {activeGoals.map((goal) => {
            const progress = Number(goal.target_amount) > 0 ? Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)) : 0
            const milestone = getMilestone(progress)
            const monthlySavings = Math.max(savingsRate * 0.01 * (income || 1000), 50)
            const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount))
            const monthsToGoal = remaining > 0 && monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : null
            const goalTargetDate = goal.target_date ? new Date(goal.target_date) : null
            const currentDate = new Date()
            const plannedMonths = goalTargetDate ? Math.max(0, Math.ceil((goalTargetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30))) : null
            let velocityLabel = monthsToGoal ? `${monthsToGoal} months to completion` : 'Need more savings data'
            if (monthsToGoal && plannedMonths !== null) {
              if (monthsToGoal <= plannedMonths) velocityLabel = plannedMonths - monthsToGoal > 1 ? `${plannedMonths - monthsToGoal} months ahead 🚀` : 'On track ✓'
              else velocityLabel = `${monthsToGoal - plannedMonths} months behind ⚠️`
            }
            const goalHistory = deposits.filter((deposit) => deposit.goal_id === goal.id).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
            const isEditing = editGoalId === goal.id

            return (
              <div key={goal.id} className={`rounded-2xl border border-border bg-surface p-5 shadow-card ${milestone ? 'ring-1 ring-teal/20' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl" style={{ backgroundColor: `${goal.color}22`, color: goal.color }}>{goal.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-primary">{goal.name}</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-muted">{goal.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditGoalId(goal.id); setEditForm(buildForm(goal)) }} className="rounded-lg border border-border p-2 text-secondary transition hover:border-teal/30 hover:text-primary"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteGoalId(goal.id)} className="rounded-lg border border-border p-2 text-secondary transition hover:border-down/30 hover:text-down"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel"><div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: goal.color }} /></div>
                <div className="mt-3 font-num text-sm text-secondary">{formatCurrency(Number(goal.current_amount))} / {formatCurrency(Number(goal.target_amount))}</div>
                <div className="mt-2 text-xs text-secondary">{velocityLabel}</div>
                {milestone ? <div className="mt-3 rounded-xl bg-teal-bg px-3 py-2 text-sm text-teal">Milestone hit: {milestone}% complete.</div> : null}

                {isEditing ? (
                  <div className="mt-4 grid gap-3">
                    <input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input value={editForm.target_amount} onChange={(event) => setEditForm((current) => ({ ...current, target_amount: event.target.value }))} type="number" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
                      <input value={editForm.current_amount} onChange={(event) => setEditForm((current) => ({ ...current, current_amount: event.target.value }))} type="number" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
                      <select value={editForm.type} onChange={(event) => setEditForm((current) => ({ ...current, type: event.target.value }))} className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30">
                        {TYPES.map((type) => <option key={type}>{type}</option>)}
                      </select>
                      <input value={editForm.target_date} onChange={(event) => setEditForm((current) => ({ ...current, target_date: event.target.value }))} type="date" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
                    </div>
                    <div className="flex gap-2">
                      {EMOJIS.map((emoji) => (
                        <button key={emoji} type="button" onClick={() => setEditForm((current) => ({ ...current, icon: emoji }))} className={`rounded-xl border px-3 py-2 text-lg ${editForm.icon === emoji ? 'border-teal bg-teal-bg' : 'border-border bg-panel'}`}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {COLORS.map((color) => (
                        <button key={color} type="button" onClick={() => setEditForm((current) => ({ ...current, color }))} className={`h-10 flex-1 rounded-xl border ${editForm.color === color ? 'border-primary' : 'border-border'}`} style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => void saveGoalEdits(goal.id)} className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-teal/90">Save</button>
                      <button onClick={() => setEditGoalId(null)} className="rounded-xl border border-border px-4 py-2 text-sm text-secondary transition hover:text-primary">Cancel</button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => setDepositOpen((current) => ({ ...current, [goal.id]: !current[goal.id] }))} className="rounded-xl border border-teal/20 bg-teal-bg px-4 py-2 text-sm text-teal transition hover:border-teal/30">Add Deposit</button>
                  <button onClick={() => void getCoaching(goal)} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-secondary transition hover:border-teal/30 hover:text-primary"><Bot size={14} /> Get AI Coaching</button>
                  <Link href={`/advisor?prompt=${encodeURIComponent(`Tell me exactly how to reach my ${goal.name} goal of $${goal.target_amount} faster. What should I cut? How long will it take at my current savings rate?`)}`} className="rounded-xl border border-border px-4 py-2 text-sm text-secondary transition hover:border-teal/30 hover:text-primary">Ask AI About This Goal</Link>
                  <button onClick={() => setHistoryOpen((current) => ({ ...current, [goal.id]: !current[goal.id] }))} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-secondary transition hover:border-teal/30 hover:text-primary"><History size={14} /> View History</button>
                </div>

                {depositOpen[goal.id] ? (
                  <div className="mt-4 space-y-3 rounded-xl bg-panel/50 p-3">
                    <input value={depositForm[goal.id]?.amount || ''} onChange={(event) => setDepositForm((current) => ({ ...current, [goal.id]: { amount: event.target.value, note: current[goal.id]?.note || '' } }))} type="number" placeholder="Deposit amount" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
                    <input value={depositForm[goal.id]?.note || ''} onChange={(event) => setDepositForm((current) => ({ ...current, [goal.id]: { amount: current[goal.id]?.amount || '', note: event.target.value } }))} placeholder="Optional note" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
                    <button onClick={() => void submitDeposit(goal)} className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-canvas transition hover:bg-teal/90">Submit Deposit</button>
                  </div>
                ) : null}

                {historyOpen[goal.id] ? (
                  <div className="mt-4 space-y-2 rounded-xl bg-panel/50 p-3">
                    {goalHistory.length ? goalHistory.map((deposit) => (
                      <div key={deposit.id} className="flex items-center justify-between rounded-xl bg-panel px-3 py-3 text-sm">
                        <div>
                          <div className="text-primary">{deposit.note || 'Deposit'}</div>
                          <div className="text-xs text-secondary">{formatDate(deposit.created_at.slice(0, 10))}</div>
                        </div>
                        <div className="font-num text-teal">{formatCurrency(Number(deposit.amount))}</div>
                      </div>
                    )) : <div className="text-sm text-secondary">No deposit history yet.</div>}
                  </div>
                ) : null}

                {coaching[goal.id] ? <div className="mt-4 whitespace-pre-wrap rounded-xl bg-panel/50 p-3 text-sm text-secondary">{coaching[goal.id]}</div> : null}
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
          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between rounded-2xl bg-panel/50 px-4 py-3">
                <div className="text-sm text-primary">{goal.icon} {goal.name}</div>
                <div className="font-num text-sm text-up">{formatCurrency(Number(goal.target_amount))}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {deleteGoalId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-canvas/70 p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="font-display text-xl font-semibold text-primary">Delete Goal</div>
            <div className="mt-2 text-sm text-secondary">Type DELETE to permanently remove this goal and its progress.</div>
            <input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} className="mt-4 w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" placeholder="DELETE" />
            <div className="mt-4 flex gap-2">
              <button onClick={() => void deleteGoal()} className="rounded-xl border border-down/20 bg-down-bg px-4 py-2 text-sm text-down">Delete Goal</button>
              <button onClick={() => { setDeleteGoalId(null); setDeleteConfirm('') }} className="rounded-xl border border-border px-4 py-2 text-sm text-secondary">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
