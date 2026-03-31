export interface Category {
  id: string
  label: string
  icon: string
  color: string
  bgColor: string
}

export const CATEGORIES: Record<string, Category> = {
  'Food & Dining': { id: 'food', label: 'Food & Dining', icon: '🍽️', color: '#f97316', bgColor: 'rgba(249,115,22,0.12)' },
  Groceries: { id: 'groceries', label: 'Groceries', icon: '🛒', color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)' },
  Transportation: { id: 'transport', label: 'Transportation', icon: '🚗', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.12)' },
  Shopping: { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#a855f7', bgColor: 'rgba(168,85,247,0.12)' },
  Housing: { id: 'housing', label: 'Housing', icon: '🏠', color: '#14b8a6', bgColor: 'rgba(20,184,166,0.12)' },
  Entertainment: { id: 'entertain', label: 'Entertainment', icon: '🎬', color: '#ec4899', bgColor: 'rgba(236,72,153,0.12)' },
  Health: { id: 'health', label: 'Health', icon: '💊', color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)' },
  Travel: { id: 'travel', label: 'Travel', icon: '✈️', color: '#06b6d4', bgColor: 'rgba(6,182,212,0.12)' },
  Subscriptions: { id: 'subs', label: 'Subscriptions', icon: '🔄', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' },
  Business: { id: 'business', label: 'Business', icon: '💼', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.12)' },
  Utilities: { id: 'utilities', label: 'Utilities', icon: '⚡', color: '#eab308', bgColor: 'rgba(234,179,8,0.12)' },
  Income: { id: 'income', label: 'Income', icon: '💰', color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)' },
  Transfer: { id: 'transfer', label: 'Transfer', icon: '↔️', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.12)' },
  Other: { id: 'other', label: 'Other', icon: '📋', color: '#6b7280', bgColor: 'rgba(107,114,128,0.12)' },
}

export function getCategoryInfo(category: string | null): Category {
  return CATEGORIES[category || 'Other'] || CATEGORIES.Other
}

export const CATEGORY_LIST = Object.values(CATEGORIES)

export function mapPlaidCategory(cats: string[] | null): string {
  if (!cats?.length) return 'Other'
  const p = cats[0]?.toLowerCase() || ''
  const d = cats[1]?.toLowerCase() || ''
  if (d.includes('restaurant') || d.includes('fast food') || d.includes('coffee')) return 'Food & Dining'
  if (d.includes('groceries') || d.includes('supermarkets')) return 'Groceries'
  if (p.includes('travel') || d.includes('gas station') || d.includes('taxi') || d.includes('uber')) return 'Transportation'
  if (p.includes('shops') || d.includes('clothing') || d.includes('electronics')) return 'Shopping'
  if (p.includes('recreation') || d.includes('streaming') || d.includes('entertainment')) return 'Entertainment'
  if (d.includes('subscription') || d.includes('software')) return 'Subscriptions'
  if (p.includes('healthcare') || p.includes('medical')) return 'Health'
  if (d.includes('utilities')) return 'Utilities'
  if (p.includes('transfer') && (d.includes('payroll') || d.includes('deposit'))) return 'Income'
  if (p.includes('transfer')) return 'Transfer'
  return 'Other'
}
