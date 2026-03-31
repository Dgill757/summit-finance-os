import { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/70 p-10 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-bg text-teal">
        <Icon size={22} />
      </div>
      <h3 className="font-display text-xl font-semibold text-primary">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-secondary">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
