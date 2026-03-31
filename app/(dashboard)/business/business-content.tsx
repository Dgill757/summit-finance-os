'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/formatters'

export default function BusinessContent({ metrics, packages, goals, currentMRR, mrrDelta, userId, personalExpenses }: { metrics: any[]; packages: any[]; goals: any[]; currentMRR: number; mrrDelta: number; userId: string; personalExpenses: number }) {
  const supabase = useMemo(() => createClient(), [])
  const [metricRows, setMetricRows] = useState(metrics)
  const [packageRows, setPackageRows] = useState(packages)
  const [goalRows, setGoalRows] = useState(goals)
  const [editingMRR, setEditingMRR] = useState(false)
  const [mrrInput, setMrrInput] = useState(String(currentMRR))
  const [planner, setPlanner] = useState({ target: '50000', months: '6', churn: '5', deal: packageRows[0]?.mrr ? String(packageRows[0].mrr) : '2500' })
  const [pkgForm, setPkgForm] = useState({ name: '', mrr: '', setup_fee: '' })
  const [goalForm, setGoalForm] = useState({ name: '', target_amount: '' })
  const arr = Number(mrrInput || currentMRR) * 12
  const newClientsPerMonth = Math.ceil(Math.max(0, Number(planner.target || 0) - Number(mrrInput || 0)) / Math.max(Number(planner.deal || 1) * Number(planner.months || 1), 1))
  const projectedMRR = Number(mrrInput || 0) + newClientsPerMonth * Number(planner.deal || 0) * Number(planner.months || 0) * (1 - Number(planner.churn || 0) / 100)
  const packageStackMRR = packageRows.reduce((sum: number, row: any) => sum + Number(row.mrr || 0), 0)

  async function saveMRR() {
    const month = new Date().toISOString().slice(0, 10).replace(/-\d{2}$/, '-01')
    const { data, error } = await supabase.from('business_metrics').upsert({ user_id: userId, month, mrr: Number(mrrInput || 0) }, { onConflict: 'user_id,month' }).select().single()
    if (error) return toast.error(error.message)
    setMetricRows((current: any[]) => [data, ...current.filter((row) => row.month !== data.month)].sort((a, b) => (a.month < b.month ? 1 : -1)).slice(0, 12))
    setEditingMRR(false)
  }

  async function addPackage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { data, error } = await supabase.from('service_packages').insert({ user_id: userId, name: pkgForm.name, mrr: Number(pkgForm.mrr || 0), setup_fee: Number(pkgForm.setup_fee || 0) }).select().single()
    if (error) return toast.error(error.message)
    setPackageRows((current: any[]) => [data, ...current])
    setPkgForm({ name: '', mrr: '', setup_fee: '' })
  }

  async function deletePackage(id: string) {
    await supabase.from('service_packages').delete().eq('id', id)
    setPackageRows((current: any[]) => current.filter((row) => row.id !== id))
  }

  async function addGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { data, error } = await supabase.from('goals').insert({ user_id: userId, name: goalForm.name, target_amount: Number(goalForm.target_amount || 0), current_amount: 0, type: 'business', icon: '💼', color: '#14b8a6' }).select().single()
    if (error) return toast.error(error.message)
    setGoalRows((current: any[]) => [data, ...current])
    setGoalForm({ name: '', target_amount: '' })
  }

  return (
    <div className="p-6 space-y-5">
      <section className="rounded-2xl bg-surface border border-border p-6 card-hover">
        <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">MRR Command</div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {editingMRR ? (
              <div className="flex items-center gap-3">
                <input value={mrrInput} onChange={(e) => setMrrInput(e.target.value)} type="number" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
                <button onClick={saveMRR} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all">Save</button>
              </div>
            ) : (
              <button onClick={() => setEditingMRR(true)} className="flex items-center gap-3">
                <span className="font-num font-bold text-[52px] text-primary">{formatCurrency(Number(mrrInput || 0))}</span>
                <Pencil size={18} className="text-muted" />
              </button>
            )}
            <div className="mt-2 text-sm text-secondary">ARR: <span className="font-num text-primary">{formatCurrency(arr)}</span></div>
          </div>
          <div className={`rounded-full px-3 py-2 text-sm ${mrrDelta >= 0 ? 'bg-teal-bg text-teal' : 'bg-down-bg text-down'}`}>{mrrDelta >= 0 ? '+' : ''}{mrrDelta.toFixed(1)}% vs last month</div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr,1fr]">
        <div className="rounded-2xl bg-surface border border-border p-5 card-hover">
          <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">MRR Growth Planner</div>
          <div className="grid gap-3 md:grid-cols-2">
            <input value={planner.target} onChange={(e) => setPlanner((current) => ({ ...current, target: e.target.value }))} placeholder="Target MRR" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <input value={planner.months} onChange={(e) => setPlanner((current) => ({ ...current, months: e.target.value }))} placeholder="Months to target" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <input value={planner.churn} onChange={(e) => setPlanner((current) => ({ ...current, churn: e.target.value }))} placeholder="Average churn %" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <input value={planner.deal} onChange={(e) => setPlanner((current) => ({ ...current, deal: e.target.value }))} placeholder="Average deal size" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
          </div>
          <div className="mt-4 text-sm text-secondary">To reach {formatCurrency(Number(planner.target || 0))} in {planner.months} months, you need <span className="font-num text-primary">{newClientsPerMonth}</span> new clients per month.</div>
          <div className="mt-2 text-sm text-secondary">At current trajectory: <span className="font-num text-primary">{formatCurrency(projectedMRR)}</span></div>
        </div>
        <div className="rounded-2xl bg-surface border border-border p-5 card-hover h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...metricRows].reverse()}>
              <XAxis dataKey="month" tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#131c2e', border: '1px solid #1e2d42', borderRadius: 16 }} formatter={(value) => formatCurrency(Number(value || 0))} />
              <Bar dataKey="mrr" fill="#14b8a6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
        <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Service Packages</div>
            <div className="text-sm text-secondary">Stack MRR: <span className="font-num text-primary">{formatCurrency(packageStackMRR)}</span></div>
          </div>
          <form onSubmit={addPackage} className="grid gap-3 md:grid-cols-[1fr,120px,120px,120px]">
            <input value={pkgForm.name} onChange={(e) => setPkgForm((current) => ({ ...current, name: e.target.value }))} placeholder="Package" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <input value={pkgForm.mrr} onChange={(e) => setPkgForm((current) => ({ ...current, mrr: e.target.value }))} type="number" placeholder="MRR" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <input value={pkgForm.setup_fee} onChange={(e) => setPkgForm((current) => ({ ...current, setup_fee: e.target.value }))} type="number" placeholder="Setup fee" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all"><Plus size={15} /> Save</button>
          </form>
          <div className="mt-4 space-y-3">{packageRows.map((pkg: any) => <div key={pkg.id} className="flex items-center justify-between rounded-xl bg-panel/50 px-4 py-3"><div><div className="text-primary">{pkg.name}</div><div className="text-xs text-secondary">{formatCurrency(Number(pkg.setup_fee || 0))} setup fee</div></div><div className="flex items-center gap-3"><span className="font-num text-primary">{formatCurrency(Number(pkg.mrr || 0))}</span><button onClick={() => void deletePackage(pkg.id)} className="text-down"><Trash2 size={15} /></button></div></div>)}</div>
        </section>
        <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
          <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Business Goals</div>
          <form onSubmit={addGoal} className="grid gap-3 md:grid-cols-[1fr,160px,120px]">
            <input value={goalForm.name} onChange={(e) => setGoalForm((current) => ({ ...current, name: e.target.value }))} placeholder="Goal name" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <input value={goalForm.target_amount} onChange={(e) => setGoalForm((current) => ({ ...current, target_amount: e.target.value }))} type="number" placeholder="Target amount" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all"><Plus size={15} /> Add Goal</button>
          </form>
          <div className="mt-4 space-y-3">{goalRows.map((goal: any) => <div key={goal.id} className="rounded-xl bg-panel/50 px-4 py-3"><div className="text-primary">{goal.name}</div><div className="font-num text-secondary">{formatCurrency(Number(goal.current_amount || 0))} / {formatCurrency(Number(goal.target_amount || 0))}</div></div>)}</div>
        </section>
      </div>

      <section className="rounded-2xl bg-surface border border-border p-5 card-hover">
        <div className="text-xs font-mono font-semibold text-muted uppercase tracking-widest mb-3">Revenue vs Personal Spending</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-panel/50 p-4"><div className="text-xs text-muted uppercase tracking-widest">Business Income</div><div className="mt-2 font-num font-bold text-[28px] text-teal">{formatCurrency(Number(mrrInput || 0))}</div></div>
          <div className="rounded-xl bg-panel/50 p-4"><div className="text-xs text-muted uppercase tracking-widest">Personal Expenses</div><div className="mt-2 font-num font-bold text-[28px] text-primary">{formatCurrency(personalExpenses)}</div></div>
        </div>
      </section>
    </div>
  )
}
