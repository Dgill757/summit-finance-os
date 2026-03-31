import { Construction } from 'lucide-react'
import { TopBar } from '@/components/layout/top-bar'
import { EmptyState } from '@/components/shared/empty-state'

export default function ReportsPage() {
  return <div className="pb-10"><TopBar title="Reports" subtitle="Phase 2 roadmap." /><div className="px-6 py-6"><EmptyState icon={Construction} title="Coming in Phase 2" description="Exportable executive reports, trend digests, and finance review packs are queued for the next phase." /></div></div>
}
