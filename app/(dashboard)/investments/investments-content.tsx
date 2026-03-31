'use client'

import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/formatters'

export default function InvestmentsContent({ accounts, manualAssets, userId }: { accounts: any[]; manualAssets: any[]; userId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [assets, setAssets] = useState(manualAssets)
  const [form, setForm] = useState({ name: '', type: 'Other', value: '' })
  const totalInvestmentValue = accounts.reduce((sum, account) => sum + Number(account.current_balance || 0), 0) + assets.reduce((sum: number, asset: any) => sum + Number(asset.value || 0), 0)
  const allocationData = [
    { label: 'Retirement', value: accounts.filter((a) => ['401k', 'ira'].includes(String(a.subtype || '').toLowerCase())).reduce((sum, a) => sum + Number(a.current_balance || 0), 0), color: '#14b8a6' },
    { label: 'Taxable', value: accounts.filter((a) => String(a.subtype || '').toLowerCase().includes('brokerage')).reduce((sum, a) => sum + Number(a.current_balance || 0), 0), color: '#3b82f6' },
    { label: 'HSA', value: accounts.filter((a) => String(a.name || '').toLowerCase().includes('hsa')).reduce((sum, a) => sum + Number(a.current_balance || 0), 0), color: '#22c55e' },
    { label: 'Other', value: assets.reduce((sum: number, asset: any) => sum + Number(asset.value || 0), 0), color: '#f59e0b' },
  ]

  async function addManual(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { data, error } = await supabase.from('manual_assets').insert({ user_id: userId, name: form.name, type: form.type, value: Number(form.value || 0) }).select().single()
    if (error) return toast.error(error.message)
    setAssets((current: any[]) => [data, ...current])
    setForm({ name: '', type: 'Other', value: '' })
  }

  async function remove(id: string) {
    await supabase.from('manual_assets').delete().eq('id', id)
    setAssets((current: any[]) => current.filter((asset) => asset.id !== id))
  }

  return (
    <div className="p-6 space-y-5">
      <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
        <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Portfolio Overview</div>
        <div className="font-num font-bold text-[40px] text-teal">{formatCurrency(totalInvestmentValue)}</div>
        <div className="mt-4 space-y-3">
          {accounts.map((account) => <div key={account.id} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3"><span className="text-primary">{account.name}</span><span className="font-num text-secondary">{formatCurrency(Number(account.current_balance || 0))}</span></div>)}
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
        <section className="rounded-2xl bg-surface border border-border p-5 card-hover h-[320px]">
          <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Asset Allocation</div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={allocationData} dataKey="value" nameKey="label" outerRadius={90}>
                {allocationData.map((row) => <Cell key={row.label} fill={row.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#131c2e', border: '1px solid #1e2d42', borderRadius: 16 }} formatter={(value) => formatCurrency(Number(value || 0))} />
            </PieChart>
          </ResponsiveContainer>
        </section>
        <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
          <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Connect More Accounts</div>
          <p className="text-sm text-secondary">Investment holdings require Plaid Development mode — connect your Fidelity, Schwab, or Vanguard account to expand this view.</p>
          <div className="mt-5 text-sm text-secondary">Your retirement accounts represent <span className="font-num text-primary">{totalInvestmentValue > 0 ? Math.round((allocationData[0].value / totalInvestmentValue) * 100) : 0}%</span> of your portfolio.</div>
        </section>
      </div>
      <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
        <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Manual Tracking</div>
        <div className="space-y-3">{assets.map((asset: any) => <div key={asset.id} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3"><div><div className="text-primary">{asset.name}</div><div className="text-xs text-secondary">{asset.type}</div></div><div className="flex items-center gap-3"><span className="font-num text-secondary">{formatCurrency(Number(asset.value || 0))}</span><button onClick={() => void remove(asset.id)} className="text-down"><Trash2 size={15} /></button></div></div>)}</div>
        <form onSubmit={addManual} className="mt-4 grid gap-3 md:grid-cols-[1fr,160px,160px,140px]">
          <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Investment name" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
          <select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all"><option>Other</option><option>business</option><option>other</option></select>
          <input value={form.value} onChange={(e) => setForm((current) => ({ ...current, value: e.target.value }))} type="number" placeholder="Current value" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all"><Plus size={15} /> Add</button>
        </form>
      </section>
    </div>
  )
}
