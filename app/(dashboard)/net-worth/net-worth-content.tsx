'use client'

import { useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

export default function NetWorthContent({ accounts, manualAssets, snapshots, totalAssets, totalLiabilities, netWorth, userId }: { accounts: any[]; manualAssets: any[]; snapshots: any[]; totalAssets: number; totalLiabilities: number; netWorth: number; userId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [assets, setAssets] = useState(manualAssets)
  const [form, setForm] = useState({ name: '', type: 'Real Estate', value: '', description: '' })
  const currentSnapshot = snapshots[snapshots.length - 1]
  const previousSnapshot = snapshots[snapshots.length - 2]
  const trend = previousSnapshot ? netWorth - Number(previousSnapshot.net_worth || 0) : 0

  async function addAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { data, error } = await supabase.from('manual_assets').insert({ user_id: userId, name: form.name, type: form.type, value: Number(form.value || 0), description: form.description || null }).select().single()
    if (error) return toast.error(error.message)
    setAssets((current: any[]) => [data, ...current])
    setForm({ name: '', type: 'Real Estate', value: '', description: '' })
  }

  async function removeAsset(id: string) {
    await supabase.from('manual_assets').delete().eq('id', id)
    setAssets((current: any[]) => current.filter((asset) => asset.id !== id))
  }

  return (
    <div className="p-6 space-y-5">
      <section className="rounded-2xl bg-surface border border-border p-6 card-hover">
        <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Net Worth Hero</div>
        <div className={`font-num font-bold text-[48px] ${netWorth >= 0 ? 'text-teal' : 'text-down'}`}>{formatCurrency(netWorth)}</div>
        <div className="mt-2 text-sm text-secondary">{trend >= 0 ? 'Up' : 'Down'} {formatCurrency(Math.abs(trend))} this month. Last updated {currentSnapshot?.snapshot_date ? formatDate(currentSnapshot.snapshot_date) : 'today'}.</div>
      </section>

      <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
        <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Net Worth Over Time</div>
        {snapshots.length >= 3 ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshots}>
                <XAxis dataKey="snapshot_date" tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#131c2e', border: '1px solid #1e2d42', borderRadius: 16 }} formatter={(value) => formatCurrency(Number(value || 0))} />
                <Line type="monotone" dataKey="net_worth" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-sm text-secondary">Building your history — check back next month.</div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.2fr,1fr]">
        <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
          <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Assets Breakdown</div>
          <div className="space-y-3">
            {accounts.filter((account) => account.type !== 'credit' && account.type !== 'loan').map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3">
                <span className="text-primary">{account.name}</span>
                <span className="font-num text-primary">{formatCurrency(Number(account.current_balance || 0))}</span>
              </div>
            ))}
            {assets.map((asset: any) => (
              <div key={asset.id} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3">
                <div><div className="text-primary">{asset.name}</div><div className="text-xs text-secondary">{asset.type}</div></div>
                <div className="flex items-center gap-3"><span className="font-num text-primary">{formatCurrency(Number(asset.value || 0))}</span><button onClick={() => void removeAsset(asset.id)} className="text-down"><Trash2 size={15} /></button></div>
              </div>
            ))}
          </div>
          <form onSubmit={addAsset} className="mt-4 grid gap-3 md:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Asset name" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all"><option>Real Estate</option><option>Vehicle</option><option>Business</option><option>Other</option></select>
            <input value={form.value} onChange={(e) => setForm((current) => ({ ...current, value: e.target.value }))} type="number" placeholder="Estimated value" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <input value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} placeholder="Description" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all"><Plus size={15} /> Add Asset</button>
          </form>
        </section>

        <section className="space-y-5">
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover">
            <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Liabilities Breakdown</div>
            <div className="space-y-3">
              {accounts.filter((account) => account.type === 'credit' || account.type === 'loan').map((account) => (
                <div key={account.id} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3"><span className="text-primary">{account.name}</span><span className="font-num text-down">{formatCurrency(Math.abs(Number(account.current_balance || 0)))}</span></div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-surface border border-border p-5 card-hover">
            <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Net Worth Formula</div>
            <div className="flex items-center justify-between gap-3 text-center">
              <div><div className="text-xs text-muted">Assets</div><div className="font-num font-bold text-[24px] text-teal">{formatCurrency(totalAssets)}</div></div>
              <div className="text-xl text-muted">−</div>
              <div><div className="text-xs text-muted">Liabilities</div><div className="font-num font-bold text-[24px] text-down">{formatCurrency(totalLiabilities)}</div></div>
              <div className="text-xl text-muted">=</div>
              <div><div className="text-xs text-muted">Net Worth</div><div className="font-num font-bold text-[24px] text-primary">{formatCurrency(netWorth)}</div></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
