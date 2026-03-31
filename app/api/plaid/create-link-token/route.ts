import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient, PLAID_COUNTRY_CODES, PLAID_OPTIONAL_PRODUCTS, PLAID_PRODUCTS } from '@/lib/plaid/client'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: 'Summit Finance OS',
      products: [...PLAID_PRODUCTS],
      optional_products: [...PLAID_OPTIONAL_PRODUCTS],
      country_codes: [...PLAID_COUNTRY_CODES],
      language: 'en',
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/webhook`,
    })
    return NextResponse.json({ link_token: response.data.link_token })
  } catch (err: any) {
    console.error('Link token error:', err?.response?.data || err)
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 })
  }
}
