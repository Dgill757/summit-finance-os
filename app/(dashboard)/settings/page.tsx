import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import SettingsContent from './settings-content'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [{ data: items }, { data: accounts }, { data: categoryRules }, { data: profile }, { data: transactions }, { data: invites }] = await Promise.all([
    supabase.from('plaid_items').select('*').eq('user_id', user?.id),
    supabase.from('accounts').select('*').eq('user_id', user?.id),
    supabase.from('category_rules').select('*').eq('user_id', user?.id),
    supabase.from('profiles').select('notification_prefs, expense_split_percent').eq('id', user?.id).maybeSingle(),
    supabase.from('transactions').select('*').eq('user_id', user?.id).order('date', { ascending: false }),
    supabase.from('family_invites').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
  ])
  return (
    <div className="pb-10">
      <TopBar title="Settings" subtitle="Manage institutions, sync behavior, and account access." />
      <SettingsContent
        items={items || []}
        accounts={accounts || []}
        email={user?.email || ''}
        userId={user?.id || ''}
        categoryRules={categoryRules || []}
        notificationPrefs={profile?.notification_prefs || {}}
        transactions={transactions || []}
        invites={invites || []}
      />
    </div>
  )
}
