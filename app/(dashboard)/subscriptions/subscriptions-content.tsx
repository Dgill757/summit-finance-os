'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Flag } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { SubscriptionRecord } from '@/types'

export function SubscriptionsContent({ subscriptions, totalMonthly, totalAnnual }: { subscriptions: SubscriptionRecord[]; totalMonthly: number; totalAnnual: number }) {
  const [sortBy, setSortBy] = useState<'amount' | 'name' | 'last_charged'>('amount')
  const [flagged, setFlagged] = useState<string[]>([])

  const sorted = useMemo(() => {
    const items = [...subscriptions]
    if (sortBy === 'name') return items.sort((a, b) => a.merchant.localeCompare(b.merchant))
    if (sortBy === 'last_charged') return items.sort((a, b) => b.last_charged.localeCompare(a.last_charged))
    return items.sort((a, b) => b.monthly_amount - a.monthly_amount)
  }, [sortBy, subscriptions])

  if (!subscriptions.length) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-border bg-surface p-10 text-center card-hover">
          <div className="font-display text-2xl font-bold text-primary">No recurring charges detected yet</div>
          <p className="mt-2 text-sm text-secondary">Sync a few months of transactions and Summit will surface likely subscriptions automatically.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-surface border border-border p-5 card-hover"><div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Total Monthly Cost</div><div className="font-num font-bold text-[34px] text-teal">{formatCurrency(totalMonthly)}</div></div>
        <div className="rounded-2xl bg-surface border border-border p-5 card-hover"><div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Annual Drain</div><div className="font-num font-bold text-[34px] text-primary">{formatCurrency(totalAnnual)}</div></div>
        <div className="rounded-2xl bg-surface border border-border p-5 card-hover"><div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Subscription Count</div><div className="font-num font-bold text-[34px] text-primary">{subscriptions.length}</div></div>
      </div>

      <div className="rounded-2xl bg-surface border border-border p-5 card-hover">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 text-teal" size={18} />
          <div>
            <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-2">Subscription Creep</div>
            <div className="text-primary">You're spending <span className="font-num text-teal">{formatCurrency(totalMonthly)}</span>/month on subscriptions — that's <span className="font-num text-primary">{formatCurrency(totalAnnual)}</span>/year.</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(['amount', 'name', 'last_charged'] as const).map((option) => (
          <button key={option} onClick={() => setSortBy(option)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${sortBy === option ? 'border-teal/30 text-teal bg-teal-bg' : 'border-border text-secondary hover:text-primary hover:border-teal/30'}`}>
            {option === 'amount' ? 'Sort by Amount' : option === 'name' ? 'Sort by Name' : 'Sort by Last Charged'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {sorted.map((subscription) => {
          const status = subscription.monthly_amount < 20 ? 'Essential' : subscription.monthly_amount < 75 ? 'Review' : 'Cut'
          const isFlagged = flagged.includes(subscription.merchant)
          return (
            <div key={subscription.merchant} className={`rounded-2xl bg-surface border border-border p-5 card-hover ${isFlagged ? 'ring-1 ring-warn/40 border-warn/30' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-panel text-xl">{subscription.logo_url ? '🏷️' : '🔁'}</div>
                  <div>
                    <div className="text-sm font-semibold text-primary">{subscription.merchant}</div>
                    <div className="text-xs text-secondary">{subscription.category}</div>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs ${status === 'Essential' ? 'bg-up-bg text-up' : status === 'Review' ? 'bg-warn-bg text-warn' : 'bg-down-bg text-down'}`}>{status}</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div><div className="text-xs text-muted uppercase tracking-widest">Monthly</div><div className="font-num font-bold text-[24px] text-teal">{formatCurrency(subscription.monthly_amount)}</div></div>
                <div><div className="text-xs text-muted uppercase tracking-widest">Annual</div><div className="font-num font-bold text-[24px] text-primary">{formatCurrency(subscription.annual_amount)}</div></div>
              </div>
              <div className="mt-4 text-sm text-secondary">Last charged {subscription.last_charged ? formatDate(subscription.last_charged) : 'Unknown'}</div>
              <button onClick={() => setFlagged((current) => (current.includes(subscription.merchant) ? current.filter((item) => item !== subscription.merchant) : [...current, subscription.merchant]))} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-secondary text-sm hover:text-primary hover:border-teal/30 transition-all">
                {isFlagged ? <CheckCircle2 size={15} /> : <Flag size={15} />}
                {isFlagged ? 'Flagged for Review' : 'Flag for Review'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
