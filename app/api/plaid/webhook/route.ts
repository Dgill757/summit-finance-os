import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  console.log('Plaid webhook:', body.webhook_type, body.webhook_code)
  return NextResponse.json({ received: true })
}
