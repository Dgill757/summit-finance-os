import { Construction } from 'lucide-react'
import { TopBar } from '@/components/layout/top-bar'
import { EmptyState } from '@/components/shared/empty-state'

export default function NetWorthPage() {
  return <div className="pb-10"><TopBar title="Net Worth" subtitle="Phase 2 roadmap." /><div className="px-6 py-6"><EmptyState icon={Construction} title="Coming in Phase 2" description="Deep asset tracking, manual holdings, liabilities, and long-range net worth projections are coming next." /></div></div>
}
