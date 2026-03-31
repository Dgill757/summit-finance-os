'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { toast } from 'sonner'
import { PlaidConnectButton } from '@/components/shared/plaid-connect-button'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/formatters'

export default function SettingsContent({
  items,
  accounts,
  email,
  userId,
  categoryRules,
  notificationPrefs,
  transactions,
  invites,
}: {
  items: any[]
  accounts: any[]
  email: string
  userId: string
  categoryRules: any[]
  notificationPrefs: Record<string, boolean>
  transactions: any[]
  invites: any[]
}) {
  const router = useRouter()
  const [banks, setBanks] = useState(items)
  const [linkedAccounts, setLinkedAccounts] = useState(accounts)
  const [rules, setRules] = useState(categoryRules)
  const [prefs, setPrefs] = useState({
    budget_alerts: Boolean(notificationPrefs.budget_alerts),
    weekly_email: Boolean(notificationPrefs.weekly_email),
    unusual_charge: Boolean(notificationPrefs.unusual_charge),
    goal_milestones: notificationPrefs.goal_milestones !== false,
  })
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRows, setInviteRows] = useState(invites)
  const [confirmDelete, setConfirmDelete] = useState('')
  const [ruleForm, setRuleForm] = useState({ merchant_pattern: '', category: 'Other' })
  const supabase = useMemo(() => createClient(), [])

  async function syncAll() {
    await Promise.all([fetch('/api/plaid/accounts', { method: 'POST' }), fetch('/api/plaid/transactions', { method: 'POST' })])
    toast.success('Sync triggered')
  }

  async function disconnect(itemId: string) {
    const itemAccounts = linkedAccounts.filter((account) => account.plaid_item_id === itemId)
    if (itemAccounts.length) await supabase.from('accounts').delete().in('id', itemAccounts.map((account) => account.id))
    const { error } = await supabase.from('plaid_items').delete().eq('item_id', itemId).eq('user_id', userId)
    if (error) {
      toast.error(error.message)
      return
    }
    setBanks((current) => current.filter((bank) => bank.item_id !== itemId))
    setLinkedAccounts((current) => current.filter((account) => account.plaid_item_id !== itemId))
    toast.success('Institution disconnected')
  }

  async function handlePlaidSuccess() {
    await fetch('/api/plaid/transactions', { method: 'POST' })
    router.refresh()
  }

  async function addRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { data, error } = await supabase.from('category_rules').insert({ user_id: userId, merchant_pattern: ruleForm.merchant_pattern, category: ruleForm.category }).select().single()
    if (error) return toast.error(error.message)
    setRules((current) => [data, ...current])
    setRuleForm({ merchant_pattern: '', category: 'Other' })
  }

  async function removeRule(id: string) {
    await supabase.from('category_rules').delete().eq('id', id)
    setRules((current) => current.filter((rule) => rule.id !== id))
  }

  async function updatePrefs(nextPrefs: typeof prefs) {
    setPrefs(nextPrefs)
    await supabase.from('profiles').update({ notification_prefs: nextPrefs }).eq('id', userId)
  }

  async function invitePartner() {
    if (!inviteEmail) return
    const { data, error } = await supabase.from('family_invites').insert({ user_id: userId, email: inviteEmail, status: 'pending' }).select().single()
    if (error) return toast.error(error.message)
    setInviteRows((current) => [data, ...current])
    setInviteEmail('')
    toast.success('Partner invite queued')
  }

  async function exportCsv(scope: 'month' | 'all') {
    const start = scope === 'month' ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10) : '2020-01-01'
    const end = new Date().toISOString().slice(0, 10)
    const res = await fetch(`/api/export/transactions?start=${start}&end=${end}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `summit-transactions-${scope}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function deleteTransactions() {
    if (confirmDelete !== 'DELETE') return toast.error('Type DELETE to confirm')
    const { error } = await supabase.from('transactions').delete().eq('user_id', userId)
    if (error) return toast.error(error.message)
    toast.success('Transaction data cleared')
    router.refresh()
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-muted">Connected Banks</div>
            <h2 className="mt-2 font-display text-xl font-semibold text-primary">Institutions and linked accounts</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={syncAll} className="rounded-xl border border-border bg-panel px-4 py-2 text-sm text-primary transition hover:border-teal/30">Sync All</button>
            <PlaidConnectButton onSuccess={handlePlaidSuccess} />
          </div>
        </div>
        <div className="space-y-4">
          {banks.map((bank) => (
            <div key={bank.id} className="rounded-2xl border border-border bg-panel/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-primary">{bank.institution_name || 'Bank'}</div>
                  <div className="text-xs text-secondary">{bank.status} connection</div>
                </div>
                <button onClick={() => disconnect(bank.item_id)} className="rounded-xl border border-down/20 bg-down-bg px-4 py-2 text-sm text-down">Disconnect</button>
              </div>
              <div className="mt-3 space-y-2">
                {linkedAccounts.filter((account) => account.plaid_item_id === bank.item_id).map((account) => (
                  <div key={account.id} className="flex items-center justify-between rounded-xl bg-surface px-3 py-3 text-sm">
                    <div className="text-primary">{account.name}</div>
                    <div className="text-secondary">{account.type} {account.mask ? `• • ${account.mask}` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="text-xs uppercase tracking-[0.24em] text-muted">Account Info</div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-panel/50 p-4">
          <div>
            <div className="text-sm font-semibold text-primary">{email}</div>
            <div className="text-xs text-secondary">Executive workspace</div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal-bg px-3 py-2 text-xs text-teal"><Shield size={14} /> Summit Operator</div>
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="text-xs uppercase tracking-[0.24em] text-muted">Budget Categories</div>
        <form onSubmit={addRule} className="mt-4 grid gap-3 md:grid-cols-[1fr,180px,120px]">
          <input value={ruleForm.merchant_pattern} onChange={(e) => setRuleForm((current) => ({ ...current, merchant_pattern: e.target.value }))} placeholder="Merchant pattern" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
          <input value={ruleForm.category} onChange={(e) => setRuleForm((current) => ({ ...current, category: e.target.value }))} placeholder="Category" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all">Add Rule</button>
        </form>
        <div className="mt-4 space-y-3">
          {rules.map((rule) => <div key={rule.id} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3"><div className="text-primary">{rule.merchant_pattern} → <span className="text-secondary">{rule.category}</span></div><button onClick={() => void removeRule(rule.id)} className="text-down text-sm">Delete</button></div>)}
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="text-xs uppercase tracking-[0.24em] text-muted">Notification Preferences</div>
        <div className="mt-4 space-y-3">
          {[
            ['budget_alerts', "Alert me when I'm 80% through a budget category"],
            ['weekly_email', 'Weekly spending summary email'],
            ['unusual_charge', 'Alert when unusual charge detected (2x normal for merchant)'],
            ['goal_milestones', 'Goal milestone celebrations'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3 text-sm text-primary">
              <span>{label}</span>
              <input type="checkbox" checked={Boolean(prefs[key as keyof typeof prefs])} onChange={(e) => void updatePrefs({ ...prefs, [key]: e.target.checked })} />
            </label>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="text-xs uppercase tracking-[0.24em] text-muted">Family Access</div>
        <div className="mt-4 flex gap-3">
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Invite your partner by email" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
          <button onClick={invitePartner} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all">Send Invite</button>
        </div>
        <div className="mt-4 space-y-2">{inviteRows.map((invite) => <div key={invite.id} className="rounded-xl bg-panel/50 px-4 py-3 text-sm text-secondary">{invite.email} • {invite.status} • {formatDate(invite.created_at.slice(0, 10))}</div>)}</div>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="text-xs uppercase tracking-[0.24em] text-muted">Data Export</div>
        <div className="mt-4 flex gap-3">
          <button onClick={() => void exportCsv('month')} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-secondary text-sm hover:text-primary hover:border-teal/30 transition-all">Export this month</button>
          <button onClick={() => void exportCsv('all')} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-secondary text-sm hover:text-primary hover:border-teal/30 transition-all">Export all time</button>
        </div>
      </section>
      <section className="rounded-2xl border border-down/30 bg-surface p-5 shadow-card">
        <div className="text-xs uppercase tracking-[0.24em] text-down">Account Danger Zone</div>
        <div className="mt-4 text-sm text-secondary">Delete all transaction data for this user only.</div>
        <div className="mt-4 flex gap-3">
          <input value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} placeholder='Type "DELETE" to confirm' className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
          <button onClick={deleteTransactions} className="rounded-xl border border-down/20 bg-down-bg px-4 py-2 text-sm text-down">Delete all transaction data</button>
        </div>
      </section>
    </div>
  )
}
