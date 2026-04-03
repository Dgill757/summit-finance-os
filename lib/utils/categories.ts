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
  'Debt Payments': { id: 'debt', label: 'Debt Payments', icon: '💳', color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)' },
  'Business Services': { id: 'bizserv', label: 'Business Services', icon: '🏢', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.12)' },
  'Bank Fees': { id: 'bankfees', label: 'Bank Fees', icon: '🏛️', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.12)' },
  'Alcohol & Bars': { id: 'alcohol', label: 'Alcohol & Bars', icon: '🍺', color: '#f97316', bgColor: 'rgba(249,115,22,0.12)' },
  'Personal Care': { id: 'personal', label: 'Personal Care', icon: '💆', color: '#d946ef', bgColor: 'rgba(217,70,239,0.12)' },
  Other: { id: 'other', label: 'Other', icon: '📋', color: '#6b7280', bgColor: 'rgba(107,114,128,0.12)' },
}

export function getCategoryInfo(category: string | null): Category {
  return CATEGORIES[category || 'Other'] || CATEGORIES.Other
}

export const CATEGORY_LIST = Object.values(CATEGORIES)

export function mapPlaidCategory(cats: string[] | null): string {
  if (!cats?.length) return 'Other'
  const primary = cats[0]?.toLowerCase() || ''
  const detailed = cats[1]?.toLowerCase() || ''

  if (detailed.includes('restaurant') || detailed.includes('fast food') || detailed.includes('coffee')) return 'Food & Dining'
  if (detailed.includes('groceries') || detailed.includes('supermarkets')) return 'Groceries'
  if (primary.includes('travel') || detailed.includes('gas station') || detailed.includes('taxi') || detailed.includes('uber')) return 'Transportation'
  if (primary.includes('shops') || detailed.includes('clothing') || detailed.includes('electronics')) return 'Shopping'
  if (primary.includes('recreation') || detailed.includes('streaming') || detailed.includes('entertainment')) return 'Entertainment'
  if (detailed.includes('subscription') || detailed.includes('software')) return 'Subscriptions'
  if (primary.includes('healthcare') || primary.includes('medical')) return 'Health'
  if (detailed.includes('utilities')) return 'Utilities'
  if (primary.includes('transfer') && (detailed.includes('payroll') || detailed.includes('deposit'))) return 'Income'
  if (primary.includes('transfer')) return 'Transfer'
  return 'Other'
}
