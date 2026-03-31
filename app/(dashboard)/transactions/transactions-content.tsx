'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { CATEGORY_LIST, getCategoryInfo } from '@/lib/utils/categories'
import { formatCurrency, formatDateShort } from '@/lib/utils/formatters'
import { TransactionRecord } from '@/types'

export default function TransactionsContent({ transactions }: { transactions: TransactionRecord[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        const merchant = `${transaction.merchant_name || transaction.name}`.toLowerCase()
        const matchesSearch = merchant.includes(search.toLowerCase())
        const matchesCategory = category === 'all' || (transaction.category || 'Other') === category
        return matchesSearch && matchesCategory
      }),
    [transactions, search, category],
  )

  const spending = filtered.filter((transaction) => Number(transaction.amount) > 0).reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  const income = filtered.filter((transaction) => Number(transaction.amount) < 0).reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0)

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Count</div><div className="mt-3 font-num text-3xl font-bold text-primary">{filtered.length}</div></div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Total Spending</div><div className="mt-3 font-num text-3xl font-bold text-down">{formatCurrency(spending)}</div></div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Total Income</div><div className="mt-3 font-num text-3xl font-bold text-up">{formatCurrency(income)}</div></div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card md:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-panel px-4">
          <Search size={16} className="text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search merchant name" className="w-full bg-transparent py-3 text-sm text-primary outline-none placeholder:text-muted" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none">
          <option value="all">All categories</option>
          {CATEGORY_LIST.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="grid grid-cols-[110px,1.5fr,1fr,1fr,120px] gap-4 border-b border-border px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
          <div>Date</div><div>Merchant</div><div>Category</div><div>Account</div><div className="text-right">Amount</div>
        </div>
        <div>
          {filtered.map((transaction, index) => {
            const categoryInfo = getCategoryInfo(transaction.category || 'Other')
            return (
              <div key={transaction.id} className={`grid grid-cols-[110px,1.5fr,1fr,1fr,120px] gap-4 px-5 py-4 text-sm transition hover:bg-panel/50 ${index % 2 === 0 ? 'bg-transparent' : 'bg-panel/20'}`}>
                <div className="text-secondary">{formatDateShort(transaction.date)}</div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: categoryInfo.bgColor }}>{categoryInfo.icon}</span>
                  <span className="truncate text-primary">{transaction.merchant_name || transaction.name}</span>
                </div>
                <div><span className="rounded-full border border-border bg-panel px-3 py-1 text-xs text-secondary">{transaction.category || 'Other'}</span></div>
                <div className="truncate text-secondary">{transaction.account?.name || 'Unassigned'}</div>
                <div className={`text-right font-num font-semibold ${Number(transaction.amount) < 0 ? 'text-up' : 'text-primary'}`}>{Number(transaction.amount) < 0 ? '+' : '-'}{formatCurrency(Number(transaction.amount)).replace('-', '')}</div>
              </div>
            )
          })}
        </div>
        <div className="border-t border-border px-5 py-4 text-sm text-secondary">{filtered.length} transaction{filtered.length === 1 ? '' : 's'} shown</div>
      </div>
    </div>
  )
}
