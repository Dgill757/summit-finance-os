'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { toast } from 'sonner'
import { PlaidConnectButton } from '@/components/shared/plaid-connect-button'
import { createClient } from '@/lib/supabase/client'

export default function SettingsContent({ items, accounts, email, userId }: { items: any[]; accounts: any[]; email: string; userId: string }) {
  const [banks, setBanks] = useState(items)
  const [linkedAccounts, setLinkedAccounts] = useState(accounts)
  const supabase = createClient()

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
            <PlaidConnectButton onSuccess={() => window.location.reload()} />
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
    </div>
  )
}
