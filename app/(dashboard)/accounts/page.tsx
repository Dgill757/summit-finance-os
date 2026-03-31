import { Landmark, Wallet } from 'lucide-react'
import { TopBar } from '@/components/layout/top-bar'
import { StatCard } from '@/components/dashboard/stat-card'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/formatters'

const accountGroups = ['depository', 'credit', 'investment', 'loan']

export default async function AccountsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', user?.id).order('type')
  const rows = accounts || []
  const assets = rows.filter((account) => account.type !== 'credit' && account.type !== 'loan').reduce((sum, account) => sum + Number(account.current_balance || 0), 0)
  const liabilities = rows.filter((account) => account.type === 'credit' || account.type === 'loan').reduce((sum, account) => sum + Math.abs(Number(account.current_balance || 0)), 0)

  return (
    <div className="pb-10">
      <TopBar title="Accounts" subtitle="Every connected account, grouped by balance type." />
      <div className="space-y-6 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard label="Total Assets" value={assets} icon={Landmark} accent="green" />
          <StatCard label="Total Liabilities" value={liabilities} icon={Wallet} accent="red" />
        </div>
        <div className="space-y-5">
          {accountGroups.map((group) => {
            const groupAccounts = rows.filter((account) => account.type === group)
            if (!groupAccounts.length) return null
            return (
              <section key={group} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-muted">{group}</div>
                    <h2 className="mt-2 font-display text-xl font-semibold text-primary">{group.charAt(0).toUpperCase() + group.slice(1)} Accounts</h2>
                  </div>
                  <div className="font-num text-sm text-secondary">{groupAccounts.length} accounts</div>
                </div>
                <div className="space-y-3">
                  {groupAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between rounded-2xl border border-border bg-panel/50 px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-primary">{account.display_name || account.name}</div>
                        <div className="text-xs text-secondary">{account.institution_name || 'Institution'} {account.mask ? `• • ${account.mask}` : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-num text-lg font-semibold text-primary">{formatCurrency(Number(account.current_balance || 0))}</div>
                        <div className="text-xs text-muted">{account.subtype || account.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
