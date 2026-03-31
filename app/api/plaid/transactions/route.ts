import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'
import { mapPlaidCategory } from '@/lib/utils/categories'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [{ data: items }, { data: categoryRules }] = await Promise.all([
      supabase.from('plaid_items').select('*').eq('user_id', user.id).eq('status', 'good'),
      supabase.from('category_rules').select('*').eq('user_id', user.id),
    ])
    if (!items?.length) return NextResponse.json({ synced: 0 })

    const resolveCategory = (name: string, fallback: string) => {
      const lowerName = name.toLowerCase()
      const matched = (categoryRules || []).find((rule) => lowerName.includes(String(rule.merchant_pattern || '').toLowerCase()))
      return matched?.category || fallback
    }

    let totalSynced = 0
    for (const item of items) {
      let cursor = item.cursor ?? undefined
      let hasMore = true
      const toAdd: any[] = []
      const toModify: any[] = []
      const toRemove: string[] = []
      while (hasMore) {
        const res = await plaidClient.transactionsSync({ access_token: item.access_token, cursor, count: 500 })
        toAdd.push(...res.data.added)
        toModify.push(...res.data.modified)
        toRemove.push(...res.data.removed.map((r: { transaction_id: string }) => r.transaction_id))
        hasMore = res.data.has_more
        cursor = res.data.next_cursor
      }

      const { data: accounts } = await supabase.from('accounts').select('id, plaid_account_id').eq('user_id', user.id)
      const accountMap = Object.fromEntries((accounts || []).map((a) => [a.plaid_account_id, a.id]))

      if (toAdd.length) {
        const inserts = toAdd
          .filter((tx) => accountMap[tx.account_id])
          .map((tx) => ({
            user_id: user.id,
            account_id: accountMap[tx.account_id],
            plaid_transaction_id: tx.transaction_id,
            amount: tx.amount,
            name: tx.merchant_name || tx.name,
            merchant_name: tx.merchant_name ?? null,
            category: resolveCategory(tx.merchant_name || tx.name, mapPlaidCategory(tx.personal_finance_category?.primary ? [tx.personal_finance_category.primary, tx.personal_finance_category.detailed] : tx.category)),
            plaid_category: tx.category ?? null,
            date: tx.date,
            pending: tx.pending,
            logo_url: tx.logo_url ?? null,
            is_recurring: false,
            is_business: false,
          }))
        await supabase.from('transactions').upsert(inserts, { onConflict: 'plaid_transaction_id' })
        totalSynced += inserts.length
      }

      for (const tx of toModify) {
        const merchantName = tx.merchant_name || tx.name
        await supabase
          .from('transactions')
          .update({ amount: tx.amount, name: merchantName, pending: tx.pending, category: resolveCategory(merchantName, mapPlaidCategory(tx.category)) })
          .eq('plaid_transaction_id', tx.transaction_id)
      }
      if (toRemove.length) await supabase.from('transactions').delete().in('plaid_transaction_id', toRemove)
      await supabase.from('plaid_items').update({ cursor, updated_at: new Date().toISOString() }).eq('id', item.id)
    }
    return NextResponse.json({ synced: totalSynced, success: true })
  } catch (err: any) {
    console.error('Sync error:', err?.response?.data || err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
