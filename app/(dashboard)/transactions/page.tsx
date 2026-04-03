import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import TransactionsContent from './transactions-content'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: transactions }, { data: accounts }] = await Promise.all([
    supabase.from('transactions').select('*, account:accounts(name)').eq('user_id', user?.id).order('date', { ascending: false }).range(0, 199),
    supabase.from('accounts').select('id, name').eq('user_id', user?.id).order('name'),
  ])

  return (
    <div className="pb-10">
      <TopBar title="Transactions" subtitle="Search, filter, edit, and review recent activity." />
      <TransactionsContent transactions={(transactions || []) as any} accounts={(accounts || []) as any} userId={user?.id || ''} />
    </div>
  )
}
