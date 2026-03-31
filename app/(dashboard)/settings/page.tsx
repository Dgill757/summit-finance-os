import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import SettingsContent from './settings-content'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [{ data: items }, { data: accounts }] = await Promise.all([
    supabase.from('plaid_items').select('*').eq('user_id', user?.id),
    supabase.from('accounts').select('*').eq('user_id', user?.id),
  ])
  return (
    <div className="pb-10">
      <TopBar title="Settings" subtitle="Manage institutions, sync behavior, and account access." />
      <SettingsContent items={items || []} accounts={accounts || []} email={user?.email || ''} userId={user?.id || ''} />
    </div>
  )
}
