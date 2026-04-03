import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { rows, account_id } = await request.json()
    if (!rows?.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 })

    const inserts = rows.map((row: { date: string; description?: string; amount: number; category?: string }) => {
      const idSource = `${row.date}_${row.description?.slice(0, 30) || 'unknown'}_${Math.abs(Number(row.amount || 0)).toFixed(2)}`
      const uniqueId = `csv_${idSource.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)}`

      return {
        user_id: user.id,
        account_id: account_id || null,
        plaid_transaction_id: uniqueId,
        amount: row.amount,
        name: row.description || 'Unknown',
        merchant_name: row.description || null,
        category: row.category || 'Other',
        date: row.date,
        pending: false,
        is_recurring: false,
        is_flagged: false,
        is_reimbursable: false,
        logo_url: null,
      }
    })

    if (!inserts.length) return NextResponse.json({ error: 'No valid rows parsed' }, { status: 400 })

    const { error, data } = await supabase
      .from('transactions')
      .upsert(inserts, {
        onConflict: 'plaid_transaction_id',
        ignoreDuplicates: true,
      })
      .select('id')

    if (error) {
      console.error('Import error:', error)
      throw error
    }

    return NextResponse.json({
      imported: data?.length || inserts.length,
      success: true,
    })
  } catch (err: any) {
    console.error('CSV import route error:', err)
    return NextResponse.json({ error: err.message || 'Import failed' }, { status: 500 })
  }
}
