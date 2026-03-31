'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { BarChart3, BookOpen, Bot, Building2, ChevronRight, CreditCard, LayoutDashboard, LogOut, PieChart, Plus, Settings, Target, TrendingUp, Users, Zap } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

const sections = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/net-worth', label: 'Net Worth', icon: TrendingUp },
      { href: '/accounts', label: 'Accounts', icon: BookOpen },
    ],
  },
  {
    label: 'Money Flow',
    items: [
      { href: '/transactions', label: 'Transactions', icon: CreditCard },
      { href: '/budgets', label: 'Budgets', icon: PieChart },
      { href: '/transactions?category=Subscriptions', label: 'Subscriptions', icon: Zap },
    ],
  },
  {
    label: 'Planning',
    items: [
      { href: '/goals', label: 'Goals', icon: Target },
      { href: '/investments', label: 'Investments', icon: BarChart3 },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
      { href: '/net-worth', label: 'Future Planning', icon: TrendingUp },
    ],
  },
  {
    label: 'Command',
    items: [
      { href: '/business', label: 'Business OS', icon: Building2 },
      { href: '/goals?type=family', label: 'Family', icon: Users },
      { href: '/advisor', label: 'AI Advisor', icon: Bot },
    ],
  },
]

export function Sidebar({ userEmail, userName }: { userEmail: string; userName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = (userName || 'Dan Gill')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Tooltip.Provider delayDuration={100}>
      <aside className={cn('hidden h-screen shrink-0 border-r border-border bg-surface/95 p-3 transition-all duration-300 md:flex md:flex-col', collapsed ? 'w-[60px]' : 'w-[240px]')}>
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard" className={cn('flex items-center gap-3 overflow-hidden', collapsed && 'justify-center')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal/20 bg-teal-bg text-teal shadow-glow-teal">
              <LayoutDashboard size={18} />
            </div>
            {!collapsed && (
              <div>
                <div className="font-display text-lg font-bold text-primary">Summit <span className="text-teal">FinOS</span></div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-muted">Executive Command</div>
              </div>
            )}
          </Link>
          <button onClick={() => setCollapsed((value) => !value)} className={cn('rounded-lg border border-border bg-panel p-2 text-secondary transition hover:border-teal/30 hover:text-primary', collapsed && 'mx-auto')}>
            <ChevronRight size={14} className={cn('transition-transform', !collapsed && 'rotate-180')} />
          </button>
        </div>

        <button className={cn('mb-6 flex items-center gap-2 rounded-2xl border border-teal/15 bg-teal-bg px-3 py-3 text-sm text-teal transition hover:border-teal/30 hover:shadow-glow-teal', collapsed && 'justify-center px-0')}>
          <Plus size={16} />
          {!collapsed && <span>Quick Add Transaction</span>}
        </button>

        <div className="flex-1 space-y-5 overflow-y-auto pr-1">
          {sections.map((section) => (
            <div key={section.label}>
              {!collapsed && <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{section.label}</div>}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  const content = (
                    <Link
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all',
                        collapsed && 'justify-center px-0',
                        active ? 'border-teal/20 bg-teal-bg text-teal' : 'border-transparent text-secondary hover:bg-panel hover:text-primary',
                      )}
                    >
                      <item.icon size={16} />
                      {!collapsed && <span>{item.label}</span>}
                      {active && !collapsed && <span className="absolute right-3 h-2 w-2 rounded-full bg-teal" />}
                    </Link>
                  )
                  return collapsed ? (
                    <Tooltip.Root key={item.href}>
                      <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content side="right" className="rounded-md border border-border bg-panel px-2 py-1 text-xs text-primary shadow-card">
                          {item.label}
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  ) : (
                    <div key={item.href}>{content}</div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <Link href="/settings" className={cn('mb-3 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-secondary transition hover:bg-panel hover:text-primary', collapsed && 'justify-center px-0')}>
            <Settings size={16} />
            {!collapsed && <span>Settings</span>}
          </Link>
          <div className={cn('rounded-2xl border border-border bg-panel p-3', collapsed && 'p-2')}>
            <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal text-sm font-bold text-canvas">{initials}</div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-primary">{userName}</div>
                  <div className="truncate text-xs text-muted">{userEmail}</div>
                </div>
              )}
            </div>
            <button onClick={handleLogout} className={cn('mt-3 flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-secondary transition hover:border-down/30 hover:text-down', collapsed && 'justify-center px-0')}>
              <LogOut size={14} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </Tooltip.Provider>
  )
}
