'use client'

import { Bell, RefreshCw } from 'lucide-react'

interface TopBarProps {
  title: string
  subtitle?: string
  onSync?: () => void
  syncing?: boolean
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, onSync, syncing, actions }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-4 border-b border-border bg-surface/80 px-6 backdrop-blur-sm">
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-sm font-bold text-primary">{title}</h1>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {onSync && (
          <button onClick={onSync} disabled={syncing} className="flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs text-secondary transition-all hover:border-teal/30 hover:text-primary disabled:opacity-50">
            <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
            <span className="hidden sm:block">{syncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}
        {actions}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-panel text-muted transition-all hover:text-primary">
          <Bell size={13} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-teal" />
        </button>
      </div>
    </header>
  )
}
