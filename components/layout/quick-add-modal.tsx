'use client'

import { useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Calendar, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_LIST } from '@/lib/utils/categories'

export function QuickAddModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    amount: '',
    merchant: '',
    category: CATEGORY_LIST[0]?.label || 'Other',
    date: new Date().toISOString().slice(0, 10),
    account_id: '',
    notes: '',
  })

  useEffect(() => {
    if (!open) return
    async function loadAccounts() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('accounts').select('id, name').eq('user_id', user.id).order('name')
      setAccounts(data || [])
      setForm((current) => ({ ...current, account_id: current.account_id || data?.[0]?.id || '' }))
    }
    void loadAccounts()
  }, [open, supabase])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const payload = {
      user_id: user.id,
      account_id: form.account_id || null,
      amount: Number(form.amount),
      name: form.merchant,
      merchant_name: form.merchant,
      category: form.category,
      date: form.date,
      notes: form.notes || null,
      pending: false,
    }
    const { error } = await supabase.from('transactions').insert(payload)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Manual transaction added')
    setForm({
      amount: '',
      merchant: '',
      category: CATEGORY_LIST[0]?.label || 'Other',
      date: new Date().toISOString().slice(0, 10),
      account_id: accounts[0]?.id || '',
      notes: '',
    })
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-border bg-surface p-6 shadow-elevated focus:outline-none">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <Dialog.Title className="font-display text-2xl font-bold text-primary">Quick Add Transaction</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-secondary">Log a manual expense, reimbursement, or business charge.</Dialog.Description>
            </div>
            <Dialog.Close className="rounded-xl border border-border p-2 text-secondary transition hover:text-primary">
              <X size={16} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input value={form.amount} onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))} type="number" step="0.01" placeholder="Amount" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" required />
              <input value={form.merchant} onChange={(e) => setForm((current) => ({ ...current, merchant: e.target.value }))} placeholder="Merchant name" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" required />
              <select value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30">
                {CATEGORY_LIST.map((category) => (
                  <option key={category.label} value={category.label}>
                    {category.label}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Calendar size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input value={form.date} onChange={(e) => setForm((current) => ({ ...current, date: e.target.value }))} type="date" className="w-full rounded-xl border border-border bg-panel py-3 pl-11 pr-4 text-sm text-primary focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
              </div>
            </div>
            <select value={form.account_id} onChange={(e) => setForm((current) => ({ ...current, account_id: e.target.value }))} className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30">
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <textarea value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} rows={3} placeholder="Notes (optional)" className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
            <button className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-canvas transition-all hover:bg-teal/90">
              <Plus size={15} />
              Save Transaction
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
