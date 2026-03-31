import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

const accentMap = {
  teal: 'border-teal/20 bg-teal-bg text-teal',
  green: 'border-up/20 bg-up-bg text-up',
  red: 'border-down/20 bg-down-bg text-down',
  amber: 'border-warn/20 bg-warn-bg text-warn',
  blue: 'border-blue/20 bg-blue-bg text-blue',
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  format = 'currency',
  icon: Icon,
  accent = 'teal',
  loading,
}: {
  label: string
  value: number
  delta?: number
  deltaLabel?: string
  format?: 'currency' | 'percent' | 'number'
  icon: LucideIcon
  accent?: keyof typeof accentMap
  loading?: boolean
}) {
  const formattedValue = format === 'currency' ? formatCurrency(value) : format === 'percent' ? formatPercent(value) : new Intl.NumberFormat('en-US').format(value)
  const deltaPositive = (delta || 0) >= 0

  if (loading) {
    return <div className="card-hover rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="h-1 w-full animate-pulse rounded-full bg-teal/15" /><div className="mt-5 h-4 w-24 animate-pulse rounded bg-panel" /><div className="mt-6 h-10 w-36 animate-pulse rounded bg-panel" /><div className="mt-4 h-4 w-28 animate-pulse rounded bg-panel" /></div>
  }

  return (
    <div className="card-hover rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="h-1 w-full rounded-full bg-gradient-to-r from-transparent via-teal/20 to-transparent" />
      <div className="mt-5 flex items-start justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">{label}</div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', accentMap[accent])}>
          <Icon size={17} />
        </div>
      </div>
      <div className="mt-5 font-num text-[28px] font-bold leading-none text-primary">{formattedValue}</div>
      {typeof delta === 'number' && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium', deltaPositive ? 'bg-up-bg text-up' : 'bg-down-bg text-down')}>
            {deltaPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {formatPercent(delta)}
          </span>
          <span className="text-secondary">{deltaLabel}</span>
        </div>
      )}
    </div>
  )
}
