import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapPlaidCategory } from '@/lib/utils/categories'

function parseAmount(row: any, columnMap: any) {
  if (columnMap.debit || columnMap.credit) {
    const debitRaw = String(row[columnMap.debit] || '0')
    const creditRaw = String(row[columnMap.credit] || '0')
    const debit = parseFloat(debitRaw.replace(/[$,()]/g, '')) || 0
    const credit = parseFloat(creditRaw.replace(/[$,()]/g, '')) || 0
    if (debit > 0) return debit
    if (credit > 0) return -credit
  }

  const rawAmount = String(row[columnMap.amount] || '0')
  const isNegative = rawAmount.includes('(') || rawAmount.trim().startsWith('-')
  const amount = parseFloat(rawAmount.replace(/[$,()+-]/g, ''))
  if (Number.isNaN(amount)) return null
  return isNegative ? -amount : amount
}

function normalizeDate(rawDate: string) {
  if (!rawDate) return ''
  if (rawDate.includes('/')) {
    const parts = rawDate.split('/')
    if (parts[0]?.length === 4) return rawDate.replace(/\//g, '-')
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
  }
  if (rawDate.includes('-')) {
    const parts = rawDate.split('-')
    if (parts[0]?.length === 4) return rawDate
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
  }
  return rawDate
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { rows, account_id, column_map } = await request.json()
    if (!rows?.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 })

    const inserts = rows
      .filter((row: any) => {
        const amount = parseAmount(row, column_map)
        const date = normalizeDate(String(row[column_map.date] || ''))
        return amount !== null && date
      })
      .map((row: any) => {
        const finalAmount = parseAmount(row, column_map) as number
        const date = normalizeDate(String(row[column_map.date] || ''))
        const description = row[column_map.description] || 'Unknown'
        const category = column_map.category && row[column_map.category] ? row[column_map.category] : mapPlaidCategory(null)
        return {
          user_id: user.id,
          account_id: account_id || null,
          amount: finalAmount,
          name: description,
          merchant_name: description,
          category,
          date,
          pending: false,
          is_recurring: false,
          is_flagged: false,
          is_reimbursable: false,
          plaid_transaction_id: `csv_${Buffer.from(`${description}_${date}_${finalAmount}`).toString('base64').slice(0, 32)}`,
        }
      })

    if (!inserts.length) return NextResponse.json({ error: 'No valid rows parsed' }, { status: 400 })

    const { error } = await supabase.from('transactions').upsert(inserts, { onConflict: 'plaid_transaction_id', ignoreDuplicates: true })
    if (error) throw error

    return NextResponse.json({ imported: inserts.length, success: true })
  } catch (err: any) {
    console.error('CSV import error:', err)
    return NextResponse.json({ error: err.message || 'Import failed' }, { status: 500 })
  }
}
