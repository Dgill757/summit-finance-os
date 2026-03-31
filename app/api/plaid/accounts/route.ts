import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: items } = await supabase.from('plaid_items').select('*').eq('user_id', user.id).eq('status', 'good')
    if (!items?.length) return NextResponse.json({ updated: 0 })
    for (const item of items) {
      const res = await plaidClient.accountsBalanceGet({ access_token: item.access_token })
      for (const acc of res.data.accounts) {
        await supabase.from('accounts').update({ current_balance: acc.balances.current ?? null, available_balance: acc.balances.available ?? null, updated_at: new Date().toISOString() }).eq('plaid_account_id', acc.account_id).eq('user_id', user.id)
      }
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Refresh error:', err?.response?.data || err)
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 })
  }
}
