import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import GoalsContent from './goals-content'

export default async function GoalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: goals } = await supabase.from('goals').select('*').eq('user_id', user?.id).order('created_at', { ascending: false })
  return (
    <div className="pb-10">
      <TopBar title="Goals" subtitle="Track what matters and move money toward it intentionally." />
      <GoalsContent goals={goals || []} userId={user?.id || ''} />
    </div>
  )
}
