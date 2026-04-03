'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Flag } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { SubscriptionRecord } from '@/types'

export function SubscriptionsContent({
  subscriptions,
  debtPayments,
  totalMonthly,
  totalAnnual,
  needsMoreData,
  transactionCount,
}: {
  subscriptions: SubscriptionRecord[]
  debtPayments: SubscriptionRecord[]
  totalMonthly: number
  totalAnnual: number
  needsMoreData: boolean
  transactionCount: number
}) {
  const [sortBy, setSortBy] = useState<'amount' | 'name' | 'last_charged'>('amount')
  const [flagged, setFlagged] = useState<string[]>([])

  const sorted = useMemo(() => {
    const items = [...subscriptions]
    if (sortBy === 'name') return items.sort((a, b) => a.merchant.localeCompare(b.merchant))
    if (sortBy === 'last_charged') return items.sort((a, b) => b.last_charged.localeCompare(a.last_charged))
    return items.sort((a, b) => b.monthly_amount - a.monthly_amount)
  }, [sortBy, subscriptions])

  if (!subscriptions.length && !debtPayments.length) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-border bg-surface p-10 text-center card-hover">
          <div className="font-display text-2xl font-bold text-primary">No recurring charges detected yet</div>
          <p className="mt-2 text-sm text-secondary">Sync a few months of transactions and Summit will surface likely subscriptions automatically.</p>
          {needsMoreData ? (
            <Link href="/import" className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-canvas transition-all hover:bg-teal/90">
              Import more data
            </Link>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 card-hover">
          <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Total Monthly Cost</div>
          <div className="font-num text-[34px] font-bold text-teal">{formatCurrency(totalMonthly)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 card-hover">
          <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Annual Drain</div>
          <div className="font-num text-[34px] font-bold text-primary">{formatCurrency(totalAnnual)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 card-hover">
          <div className="mb-3 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Subscription Count</div>
          <div className="font-num text-[34px] font-bold text-primary">{subscriptions.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 card-hover">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 text-teal" size={18} />
          <div className="w-full">
            <div className="mb-2 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Subscription Creep</div>
            <div className="text-primary">
              You're spending <span className="font-num text-teal">{formatCurrency(totalMonthly)}</span>/month on subscriptions, that's{' '}
              <span className="font-num text-primary">{formatCurrency(totalAnnual)}</span>/year.
            </div>
            {needsMoreData ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-panel/60 px-3 py-3 text-sm text-secondary">
                <span>{transactionCount} transactions analyzed so far. Import more history to improve recurring-charge detection.</span>
                <Link href="/import" className="rounded-xl border border-teal/30 bg-teal-bg px-3 py-2 text-xs font-semibold text-teal transition-all hover:border-teal/40">
                  Import more data
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(['amount', 'name', 'last_charged'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setSortBy(option)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-all ${sortBy === option ? 'border-teal/30 bg-teal-bg text-teal' : 'border-border text-secondary hover:border-teal/30 hover:text-primary'}`}
          >
            {option === 'amount' ? 'Sort by Amount' : option === 'name' ? 'Sort by Name' : 'Sort by Last Charged'}
          </button>
        ))}
      </div>

      {subscriptions.length ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {sorted.map((subscription) => {
            const status = subscription.monthly_amount < 20 ? 'Essential' : subscription.monthly_amount < 75 ? 'Review' : 'Cut'
            const isFlagged = flagged.includes(subscription.merchant)
            return (
              <div key={subscription.merchant} className={`rounded-2xl border border-border bg-surface p-5 card-hover ${isFlagged ? 'border-warn/30 ring-1 ring-warn/40' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-panel text-xl">{subscription.logo_url ? '🏷️' : '📋'}</div>
                    <div>
                      <div className="text-sm font-semibold text-primary">{subscription.merchant}</div>
                      <div className="text-xs text-secondary">{subscription.category}</div>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${status === 'Essential' ? 'bg-up-bg text-up' : status === 'Review' ? 'bg-warn-bg text-warn' : 'bg-down-bg text-down'}`}>{status}</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted">Monthly</div>
                    <div className="font-num text-[24px] font-bold text-teal">{formatCurrency(subscription.monthly_amount)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted">Annual</div>
                    <div className="font-num text-[24px] font-bold text-primary">{formatCurrency(subscription.annual_amount)}</div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-secondary">Last charged {subscription.last_charged ? formatDate(subscription.last_charged) : 'Unknown'}</div>
                <button
                  onClick={() => setFlagged((current) => (current.includes(subscription.merchant) ? current.filter((item) => item !== subscription.merchant) : [...current, subscription.merchant]))}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-secondary transition-all hover:border-teal/30 hover:text-primary"
                >
                  {isFlagged ? <CheckCircle2 size={15} /> : <Flag size={15} />}
                  {isFlagged ? 'Flagged for Review' : 'Flag for Review'}
                </button>
              </div>
            )
          })}
        </div>
      ) : null}

      {debtPayments.length ? (
        <section className="rounded-2xl border border-border bg-surface p-5 card-hover">
          <div className="mb-4 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Debt & Regular Payments</div>
          <div className="space-y-3">
            {debtPayments.map((payment) => (
              <div key={payment.merchant} className="grid grid-cols-[1.5fr,120px,1fr,140px] items-center gap-3 rounded-xl bg-panel/50 px-4 py-3 text-sm">
                <div className="text-primary">{payment.merchant}</div>
                <div className="font-num text-primary">{formatCurrency(payment.monthly_amount)}</div>
                <div className="text-secondary">Last: {payment.last_charged ? formatDate(payment.last_charged) : 'Unknown'}</div>
                <div className="text-down">Debt Payment</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
