import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectCategoryFromDescription } from '@/lib/utils/merchant-cleaner'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, name, merchant_name, category, amount')
      .eq('user_id', user.id)

    if (!transactions?.length) return NextResponse.json({ updated: 0, total: 0, success: true })

    let updated = 0
    const batchSize = 50

    for (let index = 0; index < transactions.length; index += batchSize) {
      const batch = transactions.slice(index, index + batchSize)
      for (const tx of batch) {
        const newCategory = detectCategoryFromDescription(tx.name || tx.merchant_name || '')
        if (newCategory !== tx.category) {
          await supabase.from('transactions').update({ category: newCategory }).eq('id', tx.id)
          updated++
        }
      }
    }

    return NextResponse.json({ updated, total: transactions.length, success: true })
  } catch (err: any) {
    console.error('Recategorize error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
