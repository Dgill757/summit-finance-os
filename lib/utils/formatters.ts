import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

export function formatCurrency(amount: number, opts: { compact?: boolean; sign?: boolean; decimals?: number } = {}): string {
  const { compact = false, sign = false, decimals = 2 } = opts
  const abs = Math.abs(amount)
  let formatted: string
  if (compact && abs >= 1_000_000) formatted = `$${(abs / 1_000_000).toFixed(1)}M`
  else if (compact && abs >= 1_000) formatted = `$${(abs / 1_000).toFixed(0)}K`
  else {
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(abs)
  }
  if (sign && amount > 0) return `+${formatted}`
  if (amount < 0) return `-${formatted}`
  return formatted
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, fmt)
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d')
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
}

export function cleanMerchantName(name: string): string {
  return name.replace(/\*.*$/, '').replace(/\s{2,}/g, ' ').replace(/[#\d]{4,}/g, '').trim()
}
