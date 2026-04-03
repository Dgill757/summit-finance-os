import { NextResponse } from 'next/server'
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { AI_FUNCTIONS, AI_SYSTEM_PROMPT, openai } from '@/lib/openai/client'

type ToolResult = { success?: boolean; message?: string; [key: string]: unknown }

async function executeFunctionCall(name: string, args: Record<string, any>, supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<ToolResult> {
  if (name === 'get_spending_summary') {
    const { data } = await supabase
      .from('transactions')
      .select('amount, category')
      .eq('user_id', userId)
      .gte('date', args.start_date)
      .lte('date', args.end_date)
      .gt('amount', 0)

    const byCategory: Record<string, number> = {}
    for (const tx of data || []) {
      const category = tx.category || 'Other'
      if (!args.category || category === args.category) byCategory[category] = (byCategory[category] || 0) + Number(tx.amount)
    }
    const total = Object.values(byCategory).reduce((sum, value) => sum + value, 0)
    return {
      categories: Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => ({
          category,
          amount,
          percent: total > 0 ? Math.round((amount / total) * 100) : 0,
        })),
      total,
    }
  }

  if (name === 'get_net_worth') {
    const { data: accounts } = await supabase.from('accounts').select('type, current_balance').eq('user_id', userId)
    const assets = (accounts || [])
      .filter((account) => account.type !== 'credit' && account.type !== 'loan')
      .reduce((sum, account) => sum + Number(account.current_balance || 0), 0)
    const liabilities = (accounts || [])
      .filter((account) => account.type === 'credit' || account.type === 'loan')
      .reduce((sum, account) => sum + Math.abs(Number(account.current_balance || 0)), 0)
    return { net_worth: assets - liabilities, total_assets: assets, total_liabilities: liabilities }
  }

  if (name === 'get_goals_progress') {
    let query = supabase.from('goals').select('*').eq('user_id', userId)
    if (args.type) query = query.eq('type', args.type)
    const { data } = await query.order('created_at', { ascending: false })
    return {
      goals: (data || []).map((goal) => ({
        ...goal,
        progress_percent: Number(goal.target_amount) > 0 ? Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100) : 0,
        remaining: Number(goal.target_amount) - Number(goal.current_amount),
      })),
    }
  }

  if (name === 'search_transactions') {
    let query = supabase
      .from('transactions')
      .select('id, name, merchant_name, amount, date, category, account_id')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100)

    if (args.start_date) query = query.gte('date', args.start_date)
    if (args.end_date) query = query.lte('date', args.end_date)
    if (typeof args.min_amount === 'number') query = query.gte('amount', args.min_amount)
    if (typeof args.max_amount === 'number') query = query.lte('amount', args.max_amount)
    if (args.query) query = query.or(`name.ilike.%${args.query}%,merchant_name.ilike.%${args.query}%`)

    const { data } = await query
    const total = (data || []).reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0)
    return {
      transactions: data || [],
      count: (data || []).length,
      total_amount: total,
      message: data?.length
        ? `Found ${data.length} transactions matching "${args.query}" totaling $${total.toFixed(2)}`
        : `No transactions found matching "${args.query}"`,
    }
  }

  if (name === 'get_budget_vs_actual') {
    const monthDate = new Date(`${args.month}-01`)
    const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
    const end = format(endOfMonth(monthDate), 'yyyy-MM-dd')
    const { data: budgets } = await supabase.from('budgets').select('*').eq('user_id', userId).gte('month', start).lte('month', end)
    const { data: txs } = await supabase.from('transactions').select('amount, category').eq('user_id', userId).gte('date', start).lte('date', end).gt('amount', 0)
    const spent: Record<string, number> = {}
    for (const tx of txs || []) spent[tx.category || 'Other'] = (spent[tx.category || 'Other'] || 0) + Number(tx.amount)
    return {
      budget_vs_actual: (budgets || []).map((budget) => ({
        category: budget.category,
        budgeted: Number(budget.amount),
        spent: spent[budget.category] || 0,
        remaining: Number(budget.amount) - (spent[budget.category] || 0),
        over_budget: (spent[budget.category] || 0) > Number(budget.amount),
      })),
    }
  }

  if (name === 'get_income_summary') {
    const { data } = await supabase
      .from('transactions')
      .select('amount, date')
      .eq('user_id', userId)
      .gte('date', args.start_date)
      .lte('date', args.end_date)
      .lt('amount', 0)
    const total = (data || []).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
    return { total_income: total, transaction_count: (data || []).length }
  }

  if (name === 'get_business_mrr') {
    const { data } = await supabase.from('business_metrics').select('*').eq('user_id', userId).order('month', { ascending: false }).limit(12)
    return { metrics: data || [], current_mrr: Number(data?.[0]?.mrr || 0) }
  }

  if (name === 'create_goal') {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        name: args.name,
        target_amount: args.target_amount,
        type: args.type || 'personal',
        current_amount: 0,
        target_date: args.target_date || null,
        icon: args.icon || '🎯',
        color: '#14b8a6',
        is_completed: false,
      })
      .select()
      .single()
    if (error) return { error: error.message }
    return { success: true, action_type: 'goal_created', message: `Goal "${args.name}" created with target $${args.target_amount}.`, goal: data }
  }

  if (name === 'add_goal_deposit') {
    const { data: goals } = await supabase.from('goals').select('*').eq('user_id', userId).ilike('name', `%${args.goal_name}%`).limit(1)
    const goal = goals?.[0]
    if (!goal) return { error: `Could not find goal matching "${args.goal_name}"` }
    const newAmount = Math.min(Number(goal.current_amount) + Number(args.amount), Number(goal.target_amount))
    const completed = newAmount >= Number(goal.target_amount)
    const { data: updatedGoal, error } = await supabase
      .from('goals')
      .update({ current_amount: newAmount, is_completed: completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', goal.id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) return { error: error.message }
    await supabase.from('goal_deposits').insert({ goal_id: goal.id, amount: args.amount, note: args.note || null })
    return {
      success: true,
      action_type: 'goal_deposit_added',
      message: `Added $${args.amount} to "${goal.name}". New total: $${newAmount} of $${goal.target_amount}.`,
      goal: updatedGoal,
    }
  }

  if (name === 'create_budget') {
    const month = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const { error } = await supabase.from('budgets').upsert(
      {
        user_id: userId,
        category: args.category,
        amount: args.amount,
        month,
        owner: 'shared',
        rollover: false,
      },
      { onConflict: 'user_id,category,month,owner' },
    )
    if (error) return { error: error.message }
    return { success: true, action_type: 'budget_created', message: `Budget set: $${args.amount}/month for ${args.category}.` }
  }

  if (name === 'suggest_goals_from_spending') {
    const { data: txs } = await supabase
      .from('transactions')
      .select('amount, category')
      .eq('user_id', userId)
      .gte('date', format(subMonths(new Date(), 3), 'yyyy-MM-dd'))
      .gt('amount', 0)
    const categoryTotals: Record<string, number> = {}
    for (const tx of txs || []) categoryTotals[tx.category || 'Other'] = (categoryTotals[tx.category || 'Other'] || 0) + Number(tx.amount)
    const { data: accounts } = await supabase.from('accounts').select('type, current_balance').eq('user_id', userId)
    const savings = (accounts || [])
      .filter((account) => account.type === 'depository')
      .reduce((sum, account) => sum + Number(account.current_balance || 0), 0)
    return {
      spending_patterns: Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 5),
      current_savings: savings,
      suggestion_context: 'Use this real data to suggest 3 specific, personalized goals and create them when the user explicitly asks.',
    }
  }

  if (name === 'analyze_bills_and_subscriptions') {
    const { data: txs } = await supabase
      .from('transactions')
      .select('name, merchant_name, amount, date, category')
      .eq('user_id', userId)
      .gte('date', format(subMonths(new Date(), 3), 'yyyy-MM-dd'))
      .gt('amount', 0)
    const { data: bills } = await supabase.from('manual_bills').select('*').eq('user_id', userId).eq('is_active', true)
    const merchantMonths: Record<string, Set<string>> = {}
    const merchantAmounts: Record<string, number[]> = {}
    for (const tx of txs || []) {
      const key = tx.merchant_name || tx.name
      const month = tx.date.substring(0, 7)
      merchantMonths[key] ??= new Set()
      merchantMonths[key].add(month)
      merchantAmounts[key] ??= []
      merchantAmounts[key].push(Number(tx.amount))
    }
    const recurring = Object.entries(merchantMonths)
      .filter(([, months]) => months.size >= 2)
      .map(([merchant]) => ({
        name: merchant,
        avg_monthly: (merchantAmounts[merchant] || []).reduce((sum, amount) => sum + amount, 0) / Math.max((merchantAmounts[merchant] || []).length, 1),
      }))
      .sort((a, b) => b.avg_monthly - a.avg_monthly)
    return {
      recurring_charges: recurring,
      manual_bills: bills || [],
      total_monthly_recurring: recurring.reduce((sum, item) => sum + item.avg_monthly, 0),
      total_manual_bills: (bills || []).reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
      count: recurring.length,
    }
  }

  if (name === 'build_savings_plan') {
    const now = new Date()
    const { data: txs } = await supabase
      .from('transactions')
      .select('amount, category')
      .eq('user_id', userId)
      .gte('date', format(startOfMonth(now), 'yyyy-MM-dd'))
      .lte('date', format(endOfMonth(now), 'yyyy-MM-dd'))
    const income = (txs || []).filter((tx) => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
    const expenses = (txs || []).filter((tx) => Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0)
    const categoryTotals: Record<string, number> = {}
    for (const tx of (txs || []).filter((row) => Number(row.amount) > 0)) categoryTotals[tx.category || 'Other'] = (categoryTotals[tx.category || 'Other'] || 0) + Number(tx.amount)
    return {
      income,
      current_expenses: expenses,
      current_savings: income - expenses,
      spending_by_category: categoryTotals,
      savings_target: Number(args.monthly_savings_target || 0),
    }
  }

  if (name === 'get_full_financial_report') {
    const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', userId)
    const { data: goals } = await supabase.from('goals').select('*').eq('user_id', userId).eq('is_completed', false)
    const now = new Date()
    const { data: txs } = await supabase
      .from('transactions')
      .select('amount, category, name')
      .eq('user_id', userId)
      .gte('date', format(startOfMonth(now), 'yyyy-MM-dd'))
      .lte('date', format(endOfMonth(now), 'yyyy-MM-dd'))
    const assets = (accounts || [])
      .filter((account) => account.type !== 'credit' && account.type !== 'loan')
      .reduce((sum, account) => sum + Number(account.current_balance || 0), 0)
    const liabilities = (accounts || [])
      .filter((account) => account.type === 'credit' || account.type === 'loan')
      .reduce((sum, account) => sum + Math.abs(Number(account.current_balance || 0)), 0)
    const income = (txs || []).filter((tx) => Number(tx.amount) < 0).reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
    const expenses = (txs || []).filter((tx) => Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0)
    return {
      net_worth: assets - liabilities,
      total_assets: assets,
      total_liabilities: liabilities,
      month_income: income,
      month_expenses: expenses,
      savings_rate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
      goals,
      account_count: accounts?.length || 0,
    }
  }

  if (name === 'add_manual_bill') {
    const { data, error } = await supabase
      .from('manual_bills')
      .insert({
        user_id: userId,
        name: args.name,
        amount: args.amount,
        category: args.category || 'Other',
        due_day: args.due_day || null,
        is_business: Boolean(args.is_business),
        notes: args.notes || null,
      })
      .select()
      .single()
    if (error) return { error: error.message }
    return { success: true, action_type: 'bill_added', message: `Added monthly bill "${args.name}" for $${args.amount}.`, bill: data }
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

    const categoryTotals: Record<string, number> = {}
    const merchantTotals: Record<string, number> = {}
    const merchantMonths: Record<string, Set<string>> = {}
    for (const tx of recentTx || []) {
      if (Number(tx.amount) > 0) {
        const category = tx.category || 'Other'
        const merchant = tx.name || 'Unknown'
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(tx.amount)
        merchantTotals[merchant] = (merchantTotals[merchant] || 0) + Number(tx.amount)
        merchantMonths[merchant] ??= new Set()
        merchantMonths[merchant].add(tx.date.substring(0, 7))
      }
    }

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([category, amount]) => `${category}: $${amount.toFixed(2)}`)
    const topMerchants = Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([merchant, amount]) => `${merchant}: $${amount.toFixed(2)}`)
    const likelySubscriptions = Object.entries(merchantMonths)
      .filter(([, months]) => months.size >= 2)
      .map(([merchant]) => `${merchant}: $${((merchantTotals[merchant] || 0) / Math.max(merchantMonths[merchant]?.size || 1, 1)).toFixed(2)}/mo`)

    const contextPrompt = financialContext
      ? `
=== DAN GILL — COMPLETE FINANCIAL SNAPSHOT ===

DATA COVERAGE: ${financialContext.transaction_count || 0} transactions analyzed
DATE RANGE: ${financialContext.data_from || 'unknown'} to ${financialContext.data_to || 'unknown'}

MONTHLY AVERAGES (last 3 months):
- Average Monthly Income: $${Number(financialContext.avg_monthly_income || 0).toFixed(2)}
- Average Monthly Spending: $${Number(financialContext.avg_monthly_expenses || 0).toFixed(2)}
- Average Savings Rate: ${financialContext.savings_rate || 0}%

THIS MONTH:
- Income: $${Number(financialContext.month_income || 0).toFixed(2)}
- Expenses: $${Number(financialContext.month_expenses || 0).toFixed(2)}

NET WORTH (from bank accounts):
- Total Assets: $${Number(financialContext.total_assets || 0).toFixed(2)}
- Total Liabilities: $${Number(financialContext.total_liabilities || 0).toFixed(2)}
- Net Worth: $${Number(financialContext.net_worth || 0).toFixed(2)}
Note: Net worth may be understated if using CSV import (account balances not synced)

TOP SPENDING CATEGORIES (last 3 months):
${(financialContext.top_categories || []).map((category: Record<string, any>) => `- ${category.category}: $${Number(category.amount).toFixed(2)}`).join('\n')}

DETECTED SUBSCRIPTIONS/RECURRING ($${Number(financialContext.total_subscriptions_monthly || 0).toFixed(2)}/month total):
${(financialContext.subscriptions || []).slice(0, 15).map((subscription: Record<string, any>) => `- ${subscription.name}: ~$${Number(subscription.monthly_avg).toFixed(2)}/mo (seen ${subscription.months_seen} months)`).join('\n')}

ACTIVE GOALS (${financialContext.active_goals || 0}):
${(financialContext.goals || []).map((goal: Record<string, any>) => `- ${goal.name}: $${goal.current_amount} of $${goal.target_amount} (${Math.round((Number(goal.current_amount) / Math.max(Number(goal.target_amount), 1)) * 100)}%) — ${goal.type}`).join('\n')}

=== END SNAPSHOT ===

IMPORTANT: This data is real. When asked specific questions about merchants, amounts,
or categories, USE FUNCTION CALLS to get exact data from the database.
`
      : 'No financial context provided — call functions to get data.'

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
      messages: [{ role: 'system', content: `${AI_SYSTEM_PROMPT}\n${enhancedContext}` }, ...(messages || [])],
      tools: AI_FUNCTIONS.map((tool) => ({ type: 'function' as const, function: tool })),
      tool_choice: 'auto',
    })

    const assistantMessage = response.choices[0]?.message
    const toolCalls = (assistantMessage?.tool_calls || []).filter((toolCall) => toolCall.type === 'function')

    if (toolCalls.length) {
      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall) => {
          const result = await executeFunctionCall(toolCall.function.name, JSON.parse(toolCall.function.arguments), supabase, user.id)
          return {
            tool_call_id: toolCall.id,
            role: 'tool' as const,
            content: JSON.stringify(result),
          }
        }),
      )

      const final = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: `${AI_SYSTEM_PROMPT}\n${enhancedContext}` }, ...(messages || []), assistantMessage, ...toolResults],
      })

      const actionsTaken = toolResults
        .map((result) => {
          const parsed = JSON.parse(result.content) as ToolResult
          return parsed.success ? parsed : null
        })
        .filter(Boolean)

      return NextResponse.json({
        message: final.choices[0]?.message?.content || 'No response generated.',
        actions_taken: actionsTaken,
      })
    }

    return NextResponse.json({ message: assistantMessage?.content || 'No response generated.', actions_taken: [] })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'AI error' }, { status: 500 })
  }
}
