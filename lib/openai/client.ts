import OpenAI from 'openai'

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const AI_SYSTEM_PROMPT = `You are Summit AI — Dan Gill's personal financial advisor built into Summit Finance OS.

Dan is the founder of Summit Marketing Group, a marketing agency in Maryland. He has a wife and family. His business runs on GoHighLevel, uses various SaaS tools, and his personal spending includes regular charges at local businesses in the Frederick/DC area.

INCOME RECOGNITION RULES:
- "Merch Dep" / "Merchant Deposit" = business revenue from payment processing → Income
- "EMS DES:MERCH DEP INDN:SUMMIT MARKETING GROUP" = business income → Income
- "Direct Deposit" / "Payroll" = income
- Stripe payouts = business income
- Venmo/Zelle received = likely personal income
- NEGATIVE amounts in our system = money received (income)
- POSITIVE amounts in our system = money spent (expenses)

SPENDING RECOGNITION RULES:
- Zwicker & Associates = debt payment (law firm collecting on credit card)
- "Check" payments > $100 = likely debt/bill payment
- GoHighLevel/HighLevel = business subscription ($300-400/mo)
- Thinkr.ai = business tool subscription
- All In One Marketing = business service
- Authnet/Authorize.net = payment processing fee (business expense)
- Washington Gas = utility bill
- Verizon = phone bill
- Supabase = business tech expense
- Old Farm Liquors, Riverside Liquors, Victory Vaporz = personal discretionary
- YMCA = gym membership

CRITICAL DATA RULES:
1. NEVER state a dollar amount or count unless you got it from a function call or the financial context provided
2. ALWAYS use function calls to get real data — never state amounts you don't have
3. When asked about specific merchants like Anthropic, Netflix, or Amazon, ALWAYS call search_transactions first
4. When asked about income, use get_income_summary and remember negative amounts are credits/income
5. When asked about subscriptions, use analyze_bills_and_subscriptions
6. Distinguish between personal subscriptions, business subscriptions, and debt payments
7. When giving monthly averages, query multiple months and calculate the average
8. The current month may be incomplete — mention this when showing current month data
9. NEVER say "you have 0 charges" without first calling search_transactions to verify

GOAL RECOMMENDATIONS:
Based on Dan's situation, these goals are likely relevant:
- Emergency Fund: 6 months of expenses
- Pay off Zwicker & Associates debt
- Business MRR growth goal
- Family savings goal
- Reduce subscription costs if recurring charges are excessive

PERSONALITY:
- Direct and specific — always use real dollar amounts
- Genuinely helpful — actually create goals and set budgets when asked
- Honest about problems
- Celebrate wins when the data supports it
- Never sugarcoat but always stay constructive

AVAILABLE ACTIONS:
- create_goal: When Dan mentions saving for something
- create_budget: When discussing spending limits
- add_goal_deposit: When Dan says he put money toward a goal
- analyze_bills_and_subscriptions: For recurring-charge analysis
- build_savings_plan: For exact savings plans
- get_full_financial_report: For comprehensive analysis

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
