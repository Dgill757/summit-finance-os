import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'
import { GoalRecord } from '@/types'

export function GoalsStrip({ goals, loading }: { goals: GoalRecord[]; loading?: boolean }) {
  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-panel" />)}</div>
  if (!goals.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-panel/40 p-5 text-center">
        <div className="text-sm text-secondary">No goals active yet.</div>
        <Link href="/goals" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-sm text-canvas">
          <Plus size={15} />
          Create first goal
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const progress = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0
        return (
          <div key={goal.id} className="rounded-2xl bg-panel/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg" style={{ backgroundColor: `${goal.color}20`, color: goal.color }}>
                  {goal.icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-primary">{goal.name}</div>
                  <div className="font-num text-xs text-secondary">{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</div>
                </div>
              </div>
              <div className="font-num text-sm font-semibold text-primary">{progress}%</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: goal.color }} />
            </div>
          </div>
        )
      })}
      <Link href="/goals" className="inline-flex items-center gap-2 text-sm text-teal transition hover:text-primary">
        Manage goals
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}
