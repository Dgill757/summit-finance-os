'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Plus, Trash2 } from 'lucide-react'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/formatters'

export default function BusinessPage() {
  const supabase = useMemo(() => createClient(), [])
  const [packages, setPackages] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any[]>([])
  const [targetMrr, setTargetMrr] = useState('50000')
  const [months, setMonths] = useState('6')
  const [churn, setChurn] = useState('5')
  const [pkgForm, setPkgForm] = useState({ name: '', mrr: '', setup_fee: '' })
  const [metricForm, setMetricForm] = useState({ month: new Date().toISOString().slice(0, 10), mrr: '', client_count: '', churn_rate: '' })

  const currentMrr = Number(metrics[0]?.mrr || 0)
  const lastMrr = Number(metrics[1]?.mrr || 0)
  const delta = lastMrr ? ((currentMrr - lastMrr) / lastMrr) * 100 : 0
  const avgPackage = packages.length ? packages.reduce((sum, item) => sum + Number(item.mrr), 0) / packages.length : 2500
  const churnMultiplier = 1 + Number(churn || 0) / 100
  const clientsNeeded = avgPackage ? Math.ceil(Number(targetMrr || 0) / avgPackage * churnMultiplier) : 0

  async function addPackage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { data } = await supabase.from('service_packages').insert({ name: pkgForm.name, mrr: Number(pkgForm.mrr || 0), setup_fee: Number(pkgForm.setup_fee || 0) }).select().single()
    if (data) setPackages((current) => [data, ...current])
    setPkgForm({ name: '', mrr: '', setup_fee: '' })
  }

  async function removePackage(id: string) {
    await supabase.from('service_packages').delete().eq('id', id)
    setPackages((current) => current.filter((item) => item.id !== id))
  }

  async function addMetric(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { data } = await supabase.from('business_metrics').insert({ month: metricForm.month, mrr: Number(metricForm.mrr || 0), client_count: Number(metricForm.client_count || 0), churn_rate: Number(metricForm.churn_rate || 0) }).select().single()
    if (data) setMetrics((current) => [data, ...current].sort((a, b) => (a.month < b.month ? 1 : -1)).slice(0, 12))
    setMetricForm({ month: new Date().toISOString().slice(0, 10), mrr: '', client_count: '', churn_rate: '' })
  }

  return (
    <div className="pb-10">
      <TopBar title="Business OS" subtitle="Track MRR, packaging, and growth math for Summit Marketing Group." />
      <div className="space-y-6 px-6 py-6">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="text-xs uppercase tracking-[0.24em] text-muted">Current MRR</div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="font-num text-5xl font-bold text-primary">{formatCurrency(currentMrr)}</div>
            <div className={`rounded-full px-3 py-2 text-sm ${delta >= 0 ? 'bg-up-bg text-up' : 'bg-down-bg text-down'}`}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs last month</div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr,1.2fr]">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="mb-4 font-display text-xl font-semibold text-primary">MRR Planner</div>
            <div className="grid gap-3 md:grid-cols-3">
              <input value={targetMrr} onChange={(e) => setTargetMrr(e.target.value)} type="number" placeholder="Target MRR" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none" />
              <input value={months} onChange={(e) => setMonths(e.target.value)} type="number" placeholder="Months" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none" />
              <input value={churn} onChange={(e) => setChurn(e.target.value)} type="number" placeholder="Churn %" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none" />
            </div>
            <div className="mt-5 rounded-2xl bg-panel/50 p-4 text-sm text-secondary">At an average package value of {formatCurrency(avgPackage)}, you need roughly <span className="font-num text-lg font-bold text-primary">{clientsNeeded}</span> active clients to reach {formatCurrency(Number(targetMrr || 0))} within {months} months at {churn}% churn.</div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="mb-4 font-display text-xl font-semibold text-primary">MRR History</div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...metrics].reverse()}>
                  <XAxis dataKey="month" tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#131c2e', border: '1px solid #1e2d42', borderRadius: 16 }} formatter={(value) => formatCurrency(Number(value || 0))} />
                  <Bar dataKey="mrr" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="mb-4 font-display text-xl font-semibold text-primary">Service Packages</div>
            <form onSubmit={addPackage} className="grid gap-3 md:grid-cols-[1fr,120px,120px,140px]">
              <input value={pkgForm.name} onChange={(e) => setPkgForm((current) => ({ ...current, name: e.target.value }))} placeholder="Package name" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none" />
              <input value={pkgForm.mrr} onChange={(e) => setPkgForm((current) => ({ ...current, mrr: e.target.value }))} type="number" placeholder="MRR" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none" />
              <input value={pkgForm.setup_fee} onChange={(e) => setPkgForm((current) => ({ ...current, setup_fee: e.target.value }))} type="number" placeholder="Setup fee" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none" />
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-medium text-canvas"><Plus size={15} /> Add</button>
            </form>
            <div className="mt-4 space-y-3">
              {packages.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-border bg-panel/40 px-4 py-4">
                  <div><div className="text-sm font-semibold text-primary">{item.name}</div><div className="font-num text-xs text-secondary">{formatCurrency(Number(item.setup_fee || 0))} setup fee</div></div>
                  <div className="flex items-center gap-4"><div className="font-num text-sm text-primary">{formatCurrency(Number(item.mrr))} / mo</div><button onClick={() => removePackage(item.id)} className="text-down"><Trash2 size={15} /></button></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="mb-4 font-display text-xl font-semibold text-primary">Add Monthly Metric</div>
            <form onSubmit={addMetric} className="grid gap-3 md:grid-cols-2">
              <input value={metricForm.month} onChange={(e) => setMetricForm((current) => ({ ...current, month: e.target.value }))} type="date" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none" />
              <input value={metricForm.mrr} onChange={(e) => setMetricForm((current) => ({ ...current, mrr: e.target.value }))} type="number" placeholder="MRR" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none" />
              <input value={metricForm.client_count} onChange={(e) => setMetricForm((current) => ({ ...current, client_count: e.target.value }))} type="number" placeholder="Client count" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none" />
              <input value={metricForm.churn_rate} onChange={(e) => setMetricForm((current) => ({ ...current, churn_rate: e.target.value }))} type="number" placeholder="Churn rate" className="rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary outline-none" />
              <button className="rounded-xl bg-teal px-4 py-3 text-sm font-medium text-canvas">Add monthly metric</button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
