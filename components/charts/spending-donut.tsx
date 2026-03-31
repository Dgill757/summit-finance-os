'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { getCategoryInfo } from '@/lib/utils/categories'
import { formatCurrency } from '@/lib/utils/formatters'

export function SpendingDonut({ data, loading }: { data: { category: string; amount: number }[]; loading?: boolean }) {
  if (loading) return <div className="h-[320px] animate-pulse rounded-2xl bg-panel" />
  const topFive = data.slice(0, 5)

  return (
    <div className="grid h-[320px] grid-cols-[140px,1fr] gap-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={topFive} dataKey="amount" nameKey="category" innerRadius={42} outerRadius={60} paddingAngle={3}>
            {topFive.map((item) => (
              <Cell key={item.category} fill={getCategoryInfo(item.category).color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#131c2e', border: '1px solid #1e2d42', borderRadius: 16 }} formatter={(value) => formatCurrency(Number(value || 0))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-3">
        {topFive.map((item) => {
          const category = getCategoryInfo(item.category)
          const total = topFive.reduce((sum, row) => sum + row.amount, 0) || 1
          const percent = Math.round((item.amount / total) * 100)
          return (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: category.bgColor }}>{category.icon}</span>
                  <span className="truncate">{item.category}</span>
                </div>
                <span className="font-num text-xs text-secondary">{formatCurrency(item.amount, { compact: true })}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-panel">
                <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: category.color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
