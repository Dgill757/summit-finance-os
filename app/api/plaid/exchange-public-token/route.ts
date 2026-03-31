import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { public_token, institution_name, institution_id } = await request.json()
    const tokenRes = await plaidClient.itemPublicTokenExchange({ public_token })
    const { access_token, item_id } = tokenRes.data

    await supabase
      .from('plaid_items')
      .upsert({ user_id: user.id, access_token, item_id, institution_id, institution_name: institution_name || 'Unknown Bank', status: 'good' }, { onConflict: 'item_id' })

    const accountsRes = await plaidClient.accountsGet({ access_token })
    const accounts = accountsRes.data.accounts

    await supabase.from('accounts').upsert(
      accounts.map((acc) => ({
        user_id: user.id,
        plaid_item_id: item_id,
        plaid_account_id: acc.account_id,
        name: acc.name,
        official_name: acc.official_name ?? null,
        type: acc.type,
        subtype: acc.subtype ?? null,
        current_balance: acc.balances.current ?? null,
        available_balance: acc.balances.available ?? null,
        currency_code: acc.balances.iso_currency_code ?? 'USD',
        mask: acc.mask ?? null,
        institution_name: institution_name ?? null,
      })),
      { onConflict: 'plaid_account_id' },
    )

    return NextResponse.json({ success: true, account_count: accounts.length })
  } catch (err: any) {
    console.error('Exchange token error:', err?.response?.data || err)
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 })
  }
}
