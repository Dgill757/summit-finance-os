import OpenAI from 'openai'

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const AI_SYSTEM_PROMPT = `You are the AI Financial Advisor for Summit Finance OS — Dan Gill's personal CFO. Dan is the founder of Summit Marketing Group, a marketing agency.

YOUR CAPABILITIES:
- You can CREATE goals, SET budgets, ADD deposits to goals, ADD manual bills, and ANALYZE finances
- You have access to Dan's real transaction history, account balances, goals, budgets, bills, and spending patterns
- You can take real actions in the app via function calls

YOUR PERSONALITY:
- Direct, specific, and honest — no fluff
- Use real dollar amounts from Dan's actual data
- Celebrate wins genuinely
- Flag problems directly: "You're spending $347/month on subscriptions and only saving 3%"
- Be encouraging but truthful about hard realities

CRITICAL RULES:
1. ALWAYS call functions before answering financial questions — never guess at numbers
2. When Dan asks you to create a goal, USE the create_goal function — actually create it
3. When suggesting goals, be SPECIFIC: "Create an Emergency Fund goal of $15,000 by December 2026"
4. When asked about bills or subscriptions, USE analyze_bills_and_subscriptions first
5. When building a savings plan, USE build_savings_plan to get real data
6. Format responses with clear sections using **bold headers**
7. Always end with 1-3 specific next actions Dan can take today

GOAL CREATION GUIDELINES:
- Emergency Fund: 6 months of expenses using real spending data
- Business goals should be MRR or ARR targets
- Family goals should include the family in the name when relevant
- Retirement goals should be realistic, not generic
- Always suggest a realistic target date based on the current savings rate

SPENDING ANALYSIS GUIDELINES:
- Flag any subscription over $50/month as "Review"
- Flag any subscription over $100/month as "Cut candidate"
- Compare category spending to 50/30/20 benchmarks when relevant
- Identify zombie subscriptions and duplicate tools when visible in the data

Never give professional investment, legal, or tax advice. Suggest professionals for complex decisions.`

export const AI_FUNCTIONS = [
  {
    name: 'get_spending_summary',
    description: 'Get total spending by category for a date range',
    parameters: {
      type: 'object',
      properties: {
        start_date: { type: 'string' },
        end_date: { type: 'string' },
        category: { type: 'string', description: 'Optional category filter' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_net_worth',
    description: 'Get current net worth: total assets minus liabilities',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_goals_progress',
    description: 'Get all financial goals and their progress',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Filter by: personal, family, business, retirement' },
      },
    },
  },
  {
    name: 'search_transactions',
    description: 'Search transactions by keyword, merchant, or amount range',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        min_amount: { type: 'number' },
        max_amount: { type: 'number' },
        start_date: { type: 'string' },
        end_date: { type: 'string' },
      },
    },
  },
  {
    name: 'get_budget_vs_actual',
    description: 'Compare budget vs actual spending for a month',
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'string', description: 'YYYY-MM format' },
      },
      required: ['month'],
    },
  },
  {
    name: 'get_income_summary',
    description: 'Get total income for a date range',
    parameters: {
      type: 'object',
      properties: {
        start_date: { type: 'string' },
        end_date: { type: 'string' },
      },
      required: ['start_date', 'end_date'],
    },
  },
  {
    name: 'get_business_mrr',
    description: 'Get current and historical MRR data',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'create_goal',
    description: 'Create a new financial goal for Dan. Use when he wants to save for something or set a goal.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Goal name, e.g. "Emergency Fund"' },
        target_amount: { type: 'number', description: 'Target dollar amount' },
        type: { type: 'string', enum: ['personal', 'family', 'business', 'retirement'], description: 'Goal type' },
        target_date: { type: 'string', description: 'Target date YYYY-MM-DD, optional' },
        icon: { type: 'string', description: 'Emoji icon for the goal' },
      },
      required: ['name', 'target_amount', 'type'],
    },
  },
  {
    name: 'add_goal_deposit',
    description: 'Add money toward a goal when Dan wants to contribute to one.',
    parameters: {
      type: 'object',
      properties: {
        goal_name: { type: 'string', description: 'Name of the goal to deposit to' },
        amount: { type: 'number', description: 'Dollar amount to add' },
        note: { type: 'string', description: 'Optional note' },
      },
      required: ['goal_name', 'amount'],
    },
  },
  {
    name: 'create_budget',
    description: 'Create or update a monthly budget for a spending category.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Budget category name' },
        amount: { type: 'number', description: 'Monthly budget amount in dollars' },
      },
      required: ['category', 'amount'],
    },
  },
  {
    name: 'suggest_goals_from_spending',
    description: 'Analyze spending patterns and suggest 3 specific financial goals Dan should create.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'analyze_bills_and_subscriptions',
    description: 'Pull a complete analysis of recurring charges, bills, and subscriptions with recommendations.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'build_savings_plan',
    description: 'Create a personalized savings plan based on income, expenses, and goals.',
    parameters: {
      type: 'object',
      properties: {
        monthly_savings_target: { type: 'number', description: 'How much Dan wants to save per month' },
      },
    },
  },
  {
    name: 'get_full_financial_report',
    description: 'Generate a complete financial health report using Dan’s real data.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'add_manual_bill',
    description: 'Create a manual monthly bill entry when Dan wants to track a fixed expense.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Bill name' },
        amount: { type: 'number', description: 'Monthly amount' },
        category: { type: 'string', description: 'Bill category' },
        due_day: { type: 'number', description: 'Day of month, 1-31' },
        is_business: { type: 'boolean', description: 'Whether this is a business expense' },
        notes: { type: 'string', description: 'Optional note' },
      },
      required: ['name', 'amount'],
    },
  },
] as const
