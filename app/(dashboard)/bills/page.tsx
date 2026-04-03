import { format, startOfMonth, subMonths } from 'date-fns'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import { BillsContent } from './bills-content'

export const dynamic = 'force-dynamic'

export default async function BillsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: manualBills } = await supabase.from('manual_bills').select('*').eq('user_id', user.id).order('amount', { ascending: false })

  const threeMonthsAgo = format(subMonths(new Date(), 3), 'yyyy-MM-dd')
  const { data: transactions } = await supabase
    .from('transactions')
    .select('name, merchant_name, amount, date, category')
    .eq('user_id', user.id)
    .gte('date', threeMonthsAgo)
    .gt('amount', 0)
    .order('date', { ascending: false })

  const merchantData: Record<string, { amounts: number[]; months: Set<string>; category: string; lastDate: string }> = {}
  for (const tx of transactions || []) {
    const key = tx.merchant_name || tx.name
    const month = tx.date.substring(0, 7)
    merchantData[key] ??= { amounts: [], months: new Set(), category: tx.category || 'Other', lastDate: tx.date }
    merchantData[key].amounts.push(Number(tx.amount))
    merchantData[key].months.add(month)
    if (tx.date > merchantData[key].lastDate) merchantData[key].lastDate = tx.date
  }

  const detectedBills = Object.entries(merchantData)
    .filter(([, data]) => data.months.size >= 2)
    .map(([merchant, data]) => ({
      merchant,
      avg_amount: data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length,
      category: data.category,
      last_charged: data.lastDate,
      months_seen: data.months.size,
      is_auto_detected: true,
    }))
    .sort((a, b) => b.avg_amount - a.avg_amount)

  const now = new Date()
  const { data: last3MonthsIncome } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', user.id)
    .gte('date', format(subMonths(startOfMonth(now), 3), 'yyyy-MM-dd'))
    .lt('date', format(startOfMonth(now), 'yyyy-MM-dd'))
    .lt('amount', 0)

  const monthlyIncome = last3MonthsIncome ? last3MonthsIncome.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0) / 3 : 0

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Bills & Expenses" subtitle="Your complete monthly cost of living" />
      <BillsContent manualBills={manualBills || []} detectedBills={detectedBills} monthlyIncome={monthlyIncome} userId={user.id} />
    </div>
  )
}
