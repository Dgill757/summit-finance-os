'use client'

import { useMemo, useState } from 'react'
import { Info, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getCategoryInfo } from '@/lib/utils/categories'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { ManualBillRecord } from '@/types'

const BILL_CATEGORIES = ['Housing', 'Utilities', 'Insurance', 'Subscriptions', 'Debt/Payments', 'Transportation', 'Other']

type DetectedBill = {
  merchant: string
  avg_amount: number
  category: string
  last_charged: string
  months_seen: number
  is_auto_detected: boolean
}

export function BillsContent({
  manualBills,
  detectedBills,
  monthlyIncome,
  userId,
}: {
  manualBills: ManualBillRecord[]
  detectedBills: DetectedBill[]
  monthlyIncome: number
  userId: string
}) {
  const [bills, setBills] = useState(manualBills)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', amount: '', category: 'Other', due_day: '1', is_business: false, notes: '' })
  const [editForm, setEditForm] = useState<Record<string, { name: string; amount: string; category: string; due_day: string; is_business: boolean; notes: string }>>({})

  const fixedBillsTotal = bills.filter((bill) => bill.is_active !== false).reduce((sum, bill) => sum + Number(bill.amount || 0), 0)
  const recurringTotal = detectedBills.reduce((sum, bill) => sum + Number(bill.avg_amount || 0), 0)
  const totalOutflow = fixedBillsTotal + recurringTotal
  const leftover = monthlyIncome - totalOutflow

  const groupedTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const bill of bills) totals[bill.category || 'Other'] = (totals[bill.category || 'Other'] || 0) + Number(bill.amount || 0)
    for (const bill of detectedBills) totals[bill.category || 'Other'] = (totals[bill.category || 'Other'] || 0) + Number(bill.avg_amount || 0)
    return Object.entries(totals).sort((a, b) => b[1] - a[1])
  }, [bills, detectedBills])

  const topCategory = groupedTotals[0]
  const suggestedCut = Math.max(0, 500 - Math.max(leftover, 0))

  async function createBill() {
    const response = await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        amount: Number(form.amount || 0),
        category: form.category,
        due_day: Number(form.due_day || 1),
        is_business: form.is_business,
        notes: form.notes || null,
      }),
    })
    const data = await response.json()
    if (!response.ok) return toast.error(data.error || 'Failed to save bill')
    setBills((current) => [data.bill, ...current])
    setForm({ name: '', amount: '', category: 'Other', due_day: '1', is_business: false, notes: '' })
    setShowForm(false)
    toast.success('Bill saved')
  }

  async function updateBill(id: string) {
    const payload = editForm[id]
    const response = await fetch('/api/bills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: payload.name,
        amount: Number(payload.amount || 0),
        category: payload.category,
        due_day: Number(payload.due_day || 1),
        is_business: payload.is_business,
        notes: payload.notes || null,
      }),
    })
    const data = await response.json()
    if (!response.ok) return toast.error(data.error || 'Failed to update bill')
    setBills((current) => current.map((bill) => (bill.id === id ? data.bill : bill)))
    setEditingId(null)
    toast.success('Bill updated')
  }

  async function deleteBill(id: string) {
    const response = await fetch('/api/bills', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!response.ok) return toast.error('Failed to delete bill')
    setBills((current) => current.filter((bill) => bill.id !== id))
    setDeleteConfirm(null)
    toast.success('Bill deleted')
  }

  async function addDetectedBill(bill: DetectedBill) {
    const response = await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        name: bill.merchant,
        amount: bill.avg_amount,
        category: bill.category,
        due_day: new Date(bill.last_charged).getDate(),
        is_business: bill.category === 'Business',
        notes: `Imported from recurring detection after ${bill.months_seen} months`,
      }),
    })
    const data = await response.json()
    if (!response.ok) return toast.error(data.error || 'Failed to add fixed bill')
    setBills((current) => [data.bill, ...current])
    toast.success(`${bill.merchant} added to fixed bills`)
  }

  const savingsWidth = totalOutflow > 0 ? Math.max(0, (Math.max(leftover, 0) / monthlyIncome) * 100) : 0
  const needsWidth = monthlyIncome > 0 ? Math.min(100, (fixedBillsTotal / monthlyIncome) * 100) : 0
  const wantsWidth = monthlyIncome > 0 ? Math.min(100, (recurringTotal / monthlyIncome) * 100) : 0

  return (
    <div className="space-y-5 p-6">
      <section className="rounded-2xl border border-border bg-surface p-5 card-hover">
        <div className="mb-4 grid gap-4 xl:grid-cols-5 md:grid-cols-2">
          {[
            { label: 'Monthly Income', value: monthlyIncome, tone: 'text-up', sub: 'Live this month' },
            { label: 'Total Fixed Bills', value: fixedBillsTotal, tone: 'text-down', sub: `${bills.length} bills` },
            { label: 'Detected Recurring', value: recurringTotal, tone: 'text-warn', sub: `${detectedBills.length} charges` },
            { label: 'Total Monthly Outflow', value: totalOutflow, tone: 'text-down', sub: 'Bills + recurring' },
            { label: 'Left Over', value: leftover, tone: leftover >= 0 ? 'text-teal' : 'text-down', sub: leftover >= 0 ? `You have ${formatCurrency(leftover)} per month to work with` : `You're in the hole ${formatCurrency(Math.abs(leftover))}/month` },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-panel/50 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-muted">{item.label}</div>
              <div className={`mt-3 font-num text-[28px] font-bold ${item.tone}`}>{formatCurrency(item.value)}</div>
              <div className="mt-2 text-xs text-secondary">{item.sub}</div>
            </div>
          ))}
        </div>
        <div className="mb-3 text-xs uppercase tracking-[0.24em] text-muted">Monthly Outflow Breakdown</div>
        <div className="h-3 overflow-hidden rounded-full bg-panel">
          <div className="h-full bg-down" style={{ width: `${needsWidth}%`, float: 'left' }} />
          <div className="h-full bg-warn" style={{ width: `${wantsWidth}%`, float: 'left' }} />
          <div className="h-full bg-teal" style={{ width: `${savingsWidth}%`, float: 'left' }} />
        </div>
        <div className="mt-3 text-sm text-secondary">
          {topCategory
            ? `You're spending ${monthlyIncome > 0 ? Math.round((topCategory[1] / monthlyIncome) * 100) : 0}% of income on ${topCategory[0]}. Cut ${formatCurrency(suggestedCut)} there to save $500/month.`
            : 'Add bills and transaction history to see your monthly cost structure.'}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 card-hover">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-semibold uppercase tracking-widest text-muted">Fixed Monthly Bills</div>
            <h2 className="mt-2 font-display text-xl font-semibold text-primary">Every recurring obligation you plan around</h2>
          </div>
          <button onClick={() => setShowForm((current) => !current)} className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-canvas transition-all hover:bg-teal/90">
            <Plus size={15} />
            Add Bill
          </button>
        </div>

        {showForm ? (
          <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-panel/50 p-4 md:grid-cols-[1.2fr,140px,160px,100px,140px]">
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Bill name" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
            <input value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} type="number" step="0.01" placeholder="Amount" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30">
              {BILL_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <input value={form.due_day} onChange={(event) => setForm((current) => ({ ...current, due_day: event.target.value }))} type="number" min="1" max="31" placeholder="Due" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
            <label className="flex items-center justify-between rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary">
              Business?
              <input type="checkbox" checked={form.is_business} onChange={(event) => setForm((current) => ({ ...current, is_business: event.target.checked }))} />
            </label>
            <input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" className="md:col-span-4 w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
            <button onClick={() => void createBill()} className="rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-canvas transition-all hover:bg-teal/90">Save Bill</button>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-[1.6fr,1fr,120px,90px,110px,90px] gap-3 border-b border-border bg-panel px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-muted">
            <div>Name</div>
            <div>Category</div>
            <div>Amount</div>
            <div>Due</div>
            <div>Business</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y divide-border">
            {bills.map((bill) => {
              const isEditing = editingId === bill.id
              const values = editForm[bill.id] || {
                name: bill.name,
                amount: String(bill.amount),
                category: bill.category || 'Other',
                due_day: String(bill.due_day || 1),
                is_business: Boolean(bill.is_business),
                notes: bill.notes || '',
              }

              return (
                <div key={bill.id} className="grid grid-cols-[1.6fr,1fr,120px,90px,110px,90px] items-center gap-3 px-4 py-3 text-sm">
                  <div>{isEditing ? <input value={values.name} onChange={(event) => setEditForm((current) => ({ ...current, [bill.id]: { ...values, name: event.target.value } }))} className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-primary focus:border-teal/40 focus:outline-none" /> : <span className="text-primary">{bill.name}</span>}</div>
                  <div>{isEditing ? <select value={values.category} onChange={(event) => setEditForm((current) => ({ ...current, [bill.id]: { ...values, category: event.target.value } }))} className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-primary focus:border-teal/40 focus:outline-none">{BILL_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select> : <span className="text-secondary">{bill.category || 'Other'}</span>}</div>
                  <div>{isEditing ? <input value={values.amount} onChange={(event) => setEditForm((current) => ({ ...current, [bill.id]: { ...values, amount: event.target.value } }))} type="number" step="0.01" className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-primary focus:border-teal/40 focus:outline-none" /> : <span className="font-num text-primary">{formatCurrency(Number(bill.amount || 0))}</span>}</div>
                  <div>{isEditing ? <input value={values.due_day} onChange={(event) => setEditForm((current) => ({ ...current, [bill.id]: { ...values, due_day: event.target.value } }))} type="number" min="1" max="31" className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-primary focus:border-teal/40 focus:outline-none" /> : <span className="text-secondary">{bill.due_day || '—'}</span>}</div>
                  <div>{isEditing ? <label className="flex items-center gap-2 text-primary"><input type="checkbox" checked={values.is_business} onChange={(event) => setEditForm((current) => ({ ...current, [bill.id]: { ...values, is_business: event.target.checked } }))} />Business</label> : <span className={bill.is_business ? 'text-teal' : 'text-secondary'}>{bill.is_business ? 'Yes' : 'No'}</span>}</div>
                  <div className="flex items-center justify-end gap-2">
                    {isEditing ? (
                      <button onClick={() => void updateBill(bill.id)} className="text-xs text-teal">Save</button>
                    ) : (
                      <button onClick={() => { setEditingId(bill.id); setEditForm((current) => ({ ...current, [bill.id]: values })) }} className="text-secondary hover:text-primary">
                        <Pencil size={15} />
                      </button>
                    )}
                    {deleteConfirm === bill.id ? (
                      <button onClick={() => void deleteBill(bill.id)} className="text-xs text-down">Confirm</button>
                    ) : (
                      <button onClick={() => setDeleteConfirm(bill.id)} className="text-secondary hover:text-down">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 card-hover">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-semibold uppercase tracking-widest text-muted">Detected from Your Transactions</div>
            <h2 className="mt-2 flex items-center gap-2 font-display text-xl font-semibold text-primary">
              Auto-detected recurring charges
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                <Info size={12} />
                Summit analyzed your last 3 months
              </span>
            </h2>
          </div>
        </div>
        <div className="space-y-3">
          {detectedBills.map((bill) => {
            const info = getCategoryInfo(bill.category)
            return (
              <div key={bill.merchant} className="grid grid-cols-[1.6fr,120px,120px,1fr,140px] items-center gap-3 rounded-xl bg-panel/50 px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: info.bgColor }}>{info.icon}</span>
                  <div>
                    <div className="text-primary">{bill.merchant}</div>
                    <div className="text-xs text-secondary">{bill.category}</div>
                  </div>
                </div>
                <div className="font-num text-primary">{formatCurrency(bill.avg_amount)}</div>
                <div className="text-secondary">Seen {bill.months_seen} months</div>
                <div className="text-secondary">Last charged {formatDate(bill.last_charged)}</div>
                <button onClick={() => void addDetectedBill(bill)} className="rounded-xl border border-teal/20 bg-teal-bg px-4 py-2 text-sm text-teal transition-all hover:border-teal/30">
                  Add to Fixed Bills
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 card-hover">
        <div className="mb-4 text-xs font-mono font-semibold uppercase tracking-widest text-muted">Monthly Budget Summary</div>
        <div className="grid gap-5 xl:grid-cols-[1.2fr,1fr]">
          <div className="space-y-3">
            {groupedTotals.map(([category, amount]) => (
              <div key={category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-primary">{category}</span>
                  <span className="font-num text-secondary">{formatCurrency(amount)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-panel">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${monthlyIncome > 0 ? Math.min(100, (amount / monthlyIncome) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-2xl bg-panel/50 p-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Income vs Expenses</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-secondary">Income</span>
                <span className="font-num text-up">{formatCurrency(monthlyIncome)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-secondary">Total Expenses</span>
                <span className="font-num text-down">{formatCurrency(totalOutflow)}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="text-xs uppercase tracking-[0.24em] text-muted">Surplus / Deficit</div>
              <div className={`mt-2 font-num text-[28px] font-bold ${leftover >= 0 ? 'text-teal' : 'text-down'}`}>{formatCurrency(leftover)}</div>
              <div className="mt-2 text-sm text-secondary">
                {topCategory ? `To save $500/month you need to cut ${formatCurrency(Math.max(0, 500 - Math.max(leftover, 0)))} from ${topCategory[0]}.` : 'Add more bills and imported transactions for a fuller recommendation.'}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
