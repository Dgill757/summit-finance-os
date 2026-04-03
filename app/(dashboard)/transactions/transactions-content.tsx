'use client'

import { useMemo, useState } from 'react'
import { Calendar, CheckSquare, NotebookPen, Search } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LIST, getCategoryInfo } from '@/lib/utils/categories'
import { formatCurrency, formatDateShort } from '@/lib/utils/formatters'
import { TransactionRecord } from '@/types'

const PAGE_SIZE = 50

export default function TransactionsContent({
  transactions,
  accounts,
  userId,
}: {
  transactions: TransactionRecord[]
  accounts: { id: string; name: string }[]
  userId: string
}) {
  const supabase = createClient()
  const [items, setItems] = useState(transactions)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkCategory, setBulkCategory] = useState('Food & Dining')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [openNoteId, setOpenNoteId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () =>
      items.filter((transaction) => {
        const merchant = `${transaction.merchant_name || transaction.name}`.toLowerCase()
        const matchesSearch = merchant.includes(search.toLowerCase())
        const matchesCategory = category === 'all' || (transaction.category || 'Other') === category
        const matchesStart = !startDate || transaction.date >= startDate
        const matchesEnd = !endDate || transaction.date <= endDate
        return matchesSearch && matchesCategory && matchesStart && matchesEnd
      }),
    [items, search, category, startDate, endDate],
  )

  const visibleRows = filtered.slice(0, page * PAGE_SIZE)
  const spending = filtered.filter((transaction) => Number(transaction.amount) > 0).reduce((sum, transaction) => sum + Number(transaction.amount), 0)
  const income = filtered.filter((transaction) => Number(transaction.amount) < 0).reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0)

  async function updateTransaction(id: string, updates: Partial<TransactionRecord>) {
    const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).eq('user_id', userId).select('*, account:accounts(name)').single()
    if (error) return toast.error(error.message)
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...data } : item)))
  }

  async function saveNote(id: string) {
    await updateTransaction(id, { notes: noteDraft })
    setOpenNoteId(null)
    setNoteDraft('')
    toast.success('Note saved')
  }

  async function applyBulkCategory() {
    if (!selectedIds.length) return
    const { error } = await supabase.from('transactions').update({ category: bulkCategory }).in('id', selectedIds).eq('user_id', userId)
    if (error) return toast.error(error.message)
    setItems((current) => current.map((item) => (selectedIds.includes(item.id) ? { ...item, category: bulkCategory } : item)))
    setSelectedIds([])
    toast.success('Selected transactions updated')
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Count</div><div className="mt-3 font-num text-3xl font-bold text-primary">{filtered.length}</div></div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Total Spending</div><div className="mt-3 font-num text-3xl font-bold text-down">{formatCurrency(spending)}</div></div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card"><div className="text-xs uppercase tracking-[0.24em] text-muted">Total Income</div><div className="mt-3 font-num text-3xl font-bold text-up">{formatCurrency(income)}</div></div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-panel px-4">
            <Search size={16} className="text-muted" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search merchant name" className="w-full bg-transparent py-3 text-sm text-primary outline-none placeholder:text-muted" />
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none">
            <option value="all">All categories</option>
            {CATEGORY_LIST.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
          </select>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-panel px-3">
            <Calendar size={14} className="text-muted" />
            <input value={startDate} onChange={(event) => setStartDate(event.target.value)} type="date" className="bg-transparent py-3 text-sm text-primary outline-none" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-panel px-3">
            <Calendar size={14} className="text-muted" />
            <input value={endDate} onChange={(event) => setEndDate(event.target.value)} type="date" className="bg-transparent py-3 text-sm text-primary outline-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value)} className="rounded-xl border border-border bg-panel px-4 py-2 text-sm text-primary outline-none">
            {CATEGORY_LIST.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
          </select>
          <button onClick={() => void applyBulkCategory()} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-secondary transition hover:border-teal/30 hover:text-primary">
            <CheckSquare size={14} />
            Mark selected as {bulkCategory}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="grid grid-cols-[36px,110px,1.5fr,1fr,1fr,90px,120px] gap-4 border-b border-border px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
          <div />
          <div>Date</div>
          <div>Merchant</div>
          <div>Category</div>
          <div>Account / Notes</div>
          <div>Business</div>
          <div className="text-right">Amount</div>
        </div>
        <div>
          {visibleRows.map((transaction, index) => {
            const categoryInfo = getCategoryInfo(transaction.category || 'Other')
            const selected = selectedIds.includes(transaction.id)
            return (
              <div key={transaction.id} className={`grid grid-cols-[36px,110px,1.5fr,1fr,1fr,90px,120px] gap-4 px-5 py-4 text-sm transition hover:bg-panel/50 ${index % 2 === 0 ? 'bg-transparent' : 'bg-panel/20'}`}>
                <div className="pt-1">
                  <input type="checkbox" checked={selected} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, transaction.id] : current.filter((id) => id !== transaction.id))} />
                </div>
                <div className="text-secondary">{formatDateShort(transaction.date)}</div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: categoryInfo.bgColor }}>{categoryInfo.icon}</span>
                  <span className="truncate text-primary">{transaction.merchant_name || transaction.name}</span>
                </div>
                <div>
                  <select value={transaction.category || 'Other'} onChange={(event) => void updateTransaction(transaction.id, { category: event.target.value })} className="w-full rounded-full border border-border bg-panel px-3 py-1 text-xs text-secondary outline-none">
                    {CATEGORY_LIST.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="truncate text-secondary">{transaction.account?.name || accounts.find((account) => account.id === transaction.account_id)?.name || 'Unassigned'}</div>
                  {openNoteId === transaction.id ? (
                    <div className="space-y-2">
                      <input value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Add note" className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-xs text-primary outline-none" />
                      <div className="flex gap-2">
                        <button onClick={() => void saveNote(transaction.id)} className="rounded-lg bg-teal px-3 py-1 text-xs font-semibold text-canvas">Save</button>
                        <button onClick={() => setOpenNoteId(null)} className="rounded-lg border border-border px-3 py-1 text-xs text-secondary">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setOpenNoteId(transaction.id); setNoteDraft(transaction.notes || '') }} className="flex items-center gap-2 text-xs text-secondary transition hover:text-primary">
                      <NotebookPen size={12} />
                      {transaction.notes ? transaction.notes : 'Add note'}
                    </button>
                  )}
                </div>
                <div>
                  <label className="inline-flex items-center gap-2 text-xs text-secondary">
                    <input type="checkbox" checked={Boolean(transaction.is_business)} onChange={(event) => void updateTransaction(transaction.id, { is_business: event.target.checked })} />
                    Business
                  </label>
                </div>
                <div className={`text-right font-num font-semibold ${Number(transaction.amount) < 0 ? 'text-up' : 'text-primary'}`}>
                  {Number(transaction.amount) < 0 ? '+' : '-'}
                  {formatCurrency(Number(transaction.amount)).replace('-', '')}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm text-secondary">
          <span>Showing {visibleRows.length} of {filtered.length} transactions</span>
          {visibleRows.length < filtered.length ? (
            <button onClick={() => setPage((current) => current + 1)} className="rounded-xl border border-border px-4 py-2 text-sm text-secondary transition hover:border-teal/30 hover:text-primary">
              Load 50 more
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
