import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getCategoryInfo } from '@/lib/utils/categories'
import { cleanMerchantName, formatCurrency, formatDateShort } from '@/lib/utils/formatters'
import { TransactionRecord } from '@/types'

export function RecentTransactions({ transactions, loading }: { transactions: TransactionRecord[]; loading?: boolean }) {
  if (loading) return <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-panel" />)}</div>

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => {
        const category = getCategoryInfo(transaction.category || 'Other')
        const isCredit = transaction.amount < 0
        return (
          <div key={transaction.id} className="flex items-center justify-between rounded-2xl px-3 py-3 transition hover:bg-panel/60">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg" style={{ backgroundColor: category.bgColor }}>
                {category.icon}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-primary">{cleanMerchantName(transaction.merchant_name || transaction.name)}</div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>{formatDateShort(transaction.date)}</span>
                  {transaction.pending && <span className="rounded-full border border-warn/20 bg-warn-bg px-2 py-0.5 text-warn">Pending</span>}
                </div>
              </div>
            </div>
            <div className={`font-num text-sm font-semibold ${isCredit ? 'text-up' : 'text-primary'}`}>{isCredit ? '+' : '-'}{formatCurrency(transaction.amount, { decimals: 2 }).replace('-', '')}</div>
          </div>
        )
      })}
      <Link href="/transactions" className="inline-flex items-center gap-2 pt-2 text-sm text-teal transition hover:text-primary">
        View all transactions
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}
