import { Construction } from 'lucide-react'
import { TopBar } from '@/components/layout/top-bar'
import { EmptyState } from '@/components/shared/empty-state'

export default function InvestmentsPage() {
  return <div className="pb-10"><TopBar title="Investments" subtitle="Phase 2 roadmap." /><div className="px-6 py-6"><EmptyState icon={Construction} title="Coming in Phase 2" description="Portfolio allocation, account-level holdings, performance charts, and tax-aware insights are planned for the next release." /></div></div>
}
