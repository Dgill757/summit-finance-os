import OpenAI from 'openai'

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const AI_SYSTEM_PROMPT = `You are the AI Financial Advisor for Summit Finance OS, built for Dan Gill — founder of Summit Marketing Group. You are his personal CFO: direct, specific, data-driven, and honest.

You have access to Dan's complete financial data via function calls. ALWAYS call functions to get real data before answering financial questions. Never give generic advice — give specific numbers from the actual data.

Personality: Fiscally conservative but optimistically strategic. Celebrate wins genuinely. Flag risks directly. Be concise — Dan is a busy entrepreneur.

Never give professional financial/legal/tax advice. Suggest a professional when appropriate.`

export const AI_FUNCTIONS = [
  { name: 'get_spending_summary', description: 'Get total spending by category for a date range', parameters: { type: 'object', properties: { start_date: { type: 'string' }, end_date: { type: 'string' }, category: { type: 'string', description: 'Optional category filter' } }, required: ['start_date', 'end_date'] } },
  { name: 'get_net_worth', description: 'Get current net worth: total assets minus liabilities', parameters: { type: 'object', properties: {} } },
  { name: 'get_goals_progress', description: 'Get all financial goals and their progress', parameters: { type: 'object', properties: { type: { type: 'string', description: 'Filter by: personal, family, business, retirement' } } } },
  { name: 'search_transactions', description: 'Search transactions by keyword, merchant, or amount range', parameters: { type: 'object', properties: { query: { type: 'string' }, min_amount: { type: 'number' }, max_amount: { type: 'number' }, start_date: { type: 'string' }, end_date: { type: 'string' } } } },
  { name: 'get_budget_vs_actual', description: 'Compare budget vs actual spending for a month', parameters: { type: 'object', properties: { month: { type: 'string', description: 'YYYY-MM format' } }, required: ['month'] } },
  { name: 'get_income_summary', description: 'Get total income for a date range', parameters: { type: 'object', properties: { start_date: { type: 'string' }, end_date: { type: 'string' } }, required: ['start_date', 'end_date'] } },
  { name: 'get_business_mrr', description: 'Get current and historical MRR data', parameters: { type: 'object', properties: {} } },
] as const
