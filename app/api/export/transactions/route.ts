import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start') || '2020-01-01'
  const endDate = searchParams.get('end') || new Date().toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, accounts(name, institution_name)')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  const headers = ['Date', 'Merchant', 'Category', 'Account', 'Amount', 'Pending', 'Notes']
  const rows = (transactions || []).map((tx: any) => [
    tx.date,
    `"${String(tx.name || '').replace(/"/g, '""')}"`,
    tx.category || 'Other',
    `"${String(tx.accounts?.name || '').replace(/"/g, '""')}"`,
    Number(tx.amount) < 0 ? Math.abs(Number(tx.amount)).toFixed(2) : `-${Number(tx.amount).toFixed(2)}`,
    tx.pending ? 'Pending' : 'Cleared',
    `"${String(tx.notes || '').replace(/"/g, '""')}"`,
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="summit-transactions-${endDate}.csv"`,
    },
  })
}
