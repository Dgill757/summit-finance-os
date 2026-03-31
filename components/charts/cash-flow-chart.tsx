'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/utils/formatters'

export function CashFlowChart({ data, loading }: { data: { month: string; income: number; expenses: number }[]; loading?: boolean }) {
  if (loading) return <div className="h-[320px] animate-pulse rounded-2xl bg-panel" />

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(30,45,66,0.6)" />
          <XAxis dataKey="month" tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(value) => formatCurrency(value, { compact: true, decimals: 0 })} tick={{ fill: '#6b82a0', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#131c2e', border: '1px solid #1e2d42', borderRadius: 16 }}
            labelStyle={{ color: '#e8edf5' }}
            formatter={(value) => formatCurrency(Number(value || 0))}
          />
          <Area type="monotone" dataKey="income" stroke="#14b8a6" strokeWidth={2} fill="url(#incomeFill)" />
          <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expenseFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
