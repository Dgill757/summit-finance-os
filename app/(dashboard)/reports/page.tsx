import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import ReportsContent from './reports-content'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const start = format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd')
  const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', start).order('date', { ascending: true })

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Reports" subtitle="Cash flow, category trends, and executive review analytics." />
      <ReportsContent transactions={(transactions || []) as any} />
    </div>
  )
}
