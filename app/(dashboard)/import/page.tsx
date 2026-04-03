import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/top-bar'
import { createClient } from '@/lib/supabase/server'
import { ImportContent } from './import-content'

export const dynamic = 'force-dynamic'

export default async function ImportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accounts } = await supabase.from('accounts').select('id, name, type, institution_name').eq('user_id', user.id).order('type')

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Import Transactions" subtitle="Upload a bank statement CSV" />
      <ImportContent accounts={accounts || []} />
    </div>
  )
}
