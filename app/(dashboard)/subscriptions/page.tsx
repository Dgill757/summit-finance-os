import { format, subMonths } from 'date-fns'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import { detectSubscriptions } from '@/lib/utils/finance'
import { SubscriptionsContent } from './subscriptions-content'

export const dynamic = 'force-dynamic'

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const threeMonthsAgo = format(subMonths(new Date(), 3), 'yyyy-MM-dd')
  const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', threeMonthsAgo).gt('amount', 0).order('date', { ascending: false })
  const subscriptions = detectSubscriptions((transactions || []) as any)
  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.monthly_amount, 0)
  const totalAnnual = subscriptions.reduce((sum, sub) => sum + sub.annual_amount, 0)
  const needsMoreData = (transactions || []).length < 60

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Subscriptions" subtitle="Recurring charges detected from your transactions" />
      <SubscriptionsContent
        subscriptions={subscriptions}
        totalMonthly={totalMonthly}
        totalAnnual={totalAnnual}
        needsMoreData={needsMoreData}
        transactionCount={(transactions || []).length}
      />
    </div>
  )
}
