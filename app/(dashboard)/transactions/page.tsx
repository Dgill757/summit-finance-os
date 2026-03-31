import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import TransactionsContent from './transactions-content'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: transactions } = await supabase.from('transactions').select('*, account:accounts(name)').eq('user_id', user?.id).order('date', { ascending: false }).limit(200)
  return (
    <div className="pb-10">
      <TopBar title="Transactions" subtitle="Search, filter, and inspect recent activity." />
      <TransactionsContent transactions={(transactions || []) as any} />
    </div>
  )
}
