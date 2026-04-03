import { NextResponse } from 'next/server'
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { openai, AI_SYSTEM_PROMPT, AI_FUNCTIONS } from '@/lib/openai/client'

async function executeFunctionCall(name: string, args: any, supabase: any, userId: string) {
  if (name === 'get_spending_summary') {
    const { data } = await supabase.from('transactions').select('amount, category').eq('user_id', userId).gte('date', args.start_date).lte('date', args.end_date).gt('amount', 0)
    const byCategory: Record<string, number> = {}
    for (const tx of data || []) {
      if (!args.category || tx.category === args.category) byCategory[tx.category || 'Other'] = (byCategory[tx.category || 'Other'] || 0) + tx.amount
    }
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0)
    return { categories: Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ category: k, amount: v, percent: total > 0 ? Math.round((v / total) * 100) : 0 })), total }
  }
  if (name === 'get_net_worth') {
    const { data: accounts } = await supabase.from('accounts').select('type, current_balance').eq('user_id', userId)
    const assets = (accounts || []).filter((a: any) => a.type !== 'credit' && a.type !== 'loan').reduce((s: number, a: any) => s + (a.current_balance || 0), 0)
    const liabilities = (accounts || []).filter((a: any) => a.type === 'credit' || a.type === 'loan').reduce((s: number, a: any) => s + Math.abs(a.current_balance || 0), 0)
    return { net_worth: assets - liabilities, total_assets: assets, total_liabilities: liabilities }
  }
  if (name === 'get_goals_progress') {
    let query = supabase.from('goals').select('*').eq('user_id', userId)
    if (args.type) query = query.eq('type', args.type)
    const { data } = await query
    return { goals: (data || []).map((g: any) => ({ ...g, progress_percent: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0, remaining: g.target_amount - g.current_amount })) }
  }
  if (name === 'search_transactions') {
    let query = supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(50)
    if (args.start_date) query = query.gte('date', args.start_date)
    if (args.end_date) query = query.lte('date', args.end_date)
    if (args.min_amount) query = query.gte('amount', args.min_amount)
    if (args.max_amount) query = query.lte('amount', args.max_amount)
    if (args.query) query = query.ilike('name', `%${args.query}%`)
    const { data } = await query
    return { transactions: data || [], count: (data || []).length }
  }
  if (name === 'get_budget_vs_actual') {
    const monthDate = new Date(`${args.month}-01`)
    const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
    const end = format(endOfMonth(monthDate), 'yyyy-MM-dd')
    const { data: budgets } = await supabase.from('budgets').select('*').eq('user_id', userId).gte('month', start).lte('month', end)
    const { data: txs } = await supabase.from('transactions').select('amount, category').eq('user_id', userId).gte('date', start).lte('date', end).gt('amount', 0)
    const spent: Record<string, number> = {}
    for (const tx of txs || []) spent[tx.category || 'Other'] = (spent[tx.category || 'Other'] || 0) + tx.amount
    return { budget_vs_actual: (budgets || []).map((b: any) => ({ category: b.category, budgeted: b.amount, spent: spent[b.category] || 0, remaining: b.amount - (spent[b.category] || 0), over_budget: (spent[b.category] || 0) > b.amount })) }
  }
  if (name === 'get_income_summary') {
    const { data } = await supabase.from('transactions').select('amount, date').eq('user_id', userId).gte('date', args.start_date).lte('date', args.end_date).lt('amount', 0)
    const total = (data || []).reduce((s: number, t: any) => s + Math.abs(t.amount), 0)
    return { total_income: total, transaction_count: (data || []).length }
  }
  if (name === 'get_business_mrr') {
    const { data } = await supabase.from('business_metrics').select('*').eq('user_id', userId).order('month', { ascending: false }).limit(12)
    return { metrics: data || [], current_mrr: data?.[0]?.mrr || 0 }
  }
  return { error: 'Unknown function' }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { messages, financialContext } = await request.json()
    const { data: recentTx } = await supabase
      .from('transactions')
      .select('amount, category, name, date')
      .eq('user_id', user.id)
      .gte('date', format(subMonths(new Date(), 2), 'yyyy-MM-dd'))
      .order('date', { ascending: false })
      .limit(200)

    const catTotals: Record<string, number> = {}
    const merchantTotals: Record<string, number> = {}
    const merchantMonths: Record<string, Set<string>> = {}
    for (const tx of recentTx || []) {
      if (tx.amount > 0) {
        const category = tx.category || 'Other'
        const name = tx.name || 'Unknown'
        catTotals[category] = (catTotals[category] || 0) + Number(tx.amount)
        merchantTotals[name] = (merchantTotals[name] || 0) + Number(tx.amount)
        const month = tx.date.substring(0, 7)
        merchantMonths[name] ??= new Set()
        merchantMonths[name].add(month)
      }
    }

    const topCategories = Object.entries(catTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)

    const topMerchants = Object.entries(merchantTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, amt]) => `${name}: $${amt.toFixed(2)}`)

    const likelySubscriptions = Object.entries(merchantMonths)
      .filter(([, months]) => months.size >= 2)
      .map(([name]) => `${name}: $${((merchantTotals[name] || 0) / 2).toFixed(2)}/mo`)

    const contextPrompt = financialContext
      ? `
CURRENT FINANCIAL SNAPSHOT FOR DAN GILL:
- Net Worth: $${Number(financialContext.net_worth || 0).toFixed(2)}
- Total Assets: $${Number(financialContext.total_assets || 0).toFixed(2)}
- Total Liabilities: $${Number(financialContext.total_liabilities || 0).toFixed(2)}
- This Month Income: $${Number(financialContext.month_income || 0).toFixed(2)}
- This Month Expenses: $${Number(financialContext.month_expenses || 0).toFixed(2)}
- Savings Rate: ${financialContext.savings_rate || 0}%
- Active Goals: ${financialContext.active_goals || 0}
${financialContext.goals?.map((g: any) => `  • ${g.name}: $${g.current_amount} of $${g.target_amount} (${g.type})`).join('\n') || ''}

Use this data when answering questions. Always be specific with dollar amounts.
`
      : ''
    const enhancedContext = `
${contextPrompt}

SPENDING ANALYSIS (last 2 months):
Top Categories: ${topCategories.join(', ') || 'None yet'}
Top Merchants: ${topMerchants.join(', ') || 'None yet'}
Likely Subscriptions: ${likelySubscriptions.join(', ') || 'None yet'}
Total Transactions Analyzed: ${recentTx?.length || 0}
`
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: `${AI_SYSTEM_PROMPT}\n${enhancedContext}` }, ...messages],
      tools: AI_FUNCTIONS.map((f) => ({ type: 'function' as const, function: f })),
      tool_choice: 'auto',
    })
    const msg = response.choices[0].message
    const functionCalls = (msg.tool_calls || []).filter((toolCall) => toolCall.type === 'function')
    if (functionCalls.length) {
      const toolResults = await Promise.all(functionCalls.map(async (tc) => ({ tool_call_id: tc.id, role: 'tool' as const, content: JSON.stringify(await executeFunctionCall(tc.function.name, JSON.parse(tc.function.arguments), supabase, user.id)) })))
      const final = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: `${AI_SYSTEM_PROMPT}\n${enhancedContext}` }, ...messages, msg, ...toolResults],
      })
      return NextResponse.json({ message: final.choices[0].message.content })
    }
    return NextResponse.json({ message: msg.content })
  } catch (err: any) {
    console.error('AI chat error:', err)
    return NextResponse.json({ error: 'AI error' }, { status: 500 })
  }
}
