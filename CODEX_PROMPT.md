# SUMMIT FINANCE OS — CLAUDE CODE MASTER BUILD PROMPT

## HOW TO USE THIS
1. Open your terminal inside `C:\Users\DanGi\summit-finance-os`
2. Run: `claude` to open Claude Code
3. Paste EVERYTHING below the line into Claude Code and press Enter
4. Let it run — it will build the entire project autonomously

---

## PASTE THIS ENTIRE BLOCK INTO CLAUDE CODE:

You are building **Summit Finance OS** — a premium, executive-grade personal + business financial operating system. This is a $100,000 SaaS-quality product, not a vibe-coded demo. Every component must look like it belongs in OnlyGenius or Linear.

**CRITICAL DESIGN RULE:** Dark theme. Colors: canvas `#080c14`, surface `#0e1520`, panel `#131c2e`, border `#1e2d42`. Accent: teal `#14b8a6`. Text: `#e8edf5` primary, `#6b82a0` secondary, `#3a4f68` muted. Fonts: Syne (display/headings) + DM Sans (body) + DM Mono (numbers/code). Every number uses tabular-nums monospace. Cards have `1px border` + subtle hover glow. NO purple gradients. NO generic AI aesthetics. This looks like software executives pay for.

**Build the complete Next.js 14 App Router project by running these steps in order:**

---

### PHASE 1: INITIALIZE PROJECT

Run these commands:
```
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

Then install all dependencies:
```
npm install @supabase/ssr @supabase/supabase-js plaid openai framer-motion recharts react-plaid-link date-fns clsx tailwind-merge lucide-react class-variance-authority @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tooltip @radix-ui/react-progress @radix-ui/react-tabs @radix-ui/react-scroll-area sonner numeral zustand
```

---

### PHASE 2: CREATE ALL CONFIG FILES

**`tailwind.config.ts`** — Replace the entire file with:
```typescript
import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        canvas:  '#080c14',
        surface: '#0e1520',
        panel:   '#131c2e',
        border:  '#1e2d42',
        teal:        '#14b8a6',
        'teal-dim':  '#0d6b62',
        'teal-glow': 'rgba(20,184,166,0.25)',
        'teal-bg':   'rgba(20,184,166,0.08)',
        primary:   '#e8edf5',
        secondary: '#6b82a0',
        muted:     '#3a4f68',
        up:      '#22c55e',
        'up-bg': 'rgba(34,197,94,0.10)',
        down:    '#ef4444',
        'down-bg': 'rgba(239,68,68,0.10)',
        warn:    '#f59e0b',
        'warn-bg': 'rgba(245,158,11,0.10)',
        blue:    '#3b82f6',
        'blue-bg': 'rgba(59,130,246,0.10)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(30,45,66,0.6)',
        'glow-teal': '0 0 20px rgba(20,184,166,0.15)',
        'elevated': '0 8px 32px rgba(0,0,0,0.5)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity:'0', transform:'translateY(12px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        'fade-in': { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
export default config
```

**`app/globals.css`** — Replace entirely with:
```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { background: #080c14; color: #e8edf5; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #1e2d42; border-radius: 3px; }

.font-num { font-family: 'DM Mono', monospace; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
.bg-grid { background-image: linear-gradient(rgba(30,45,66,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,45,66,0.4) 1px, transparent 1px); background-size: 40px 40px; }
.card-hover { transition: border-color 0.2s, box-shadow 0.2s; }
.card-hover:hover { border-color: rgba(20,184,166,0.3); box-shadow: 0 0 0 1px rgba(20,184,166,0.15), 0 4px 20px rgba(0,0,0,0.3); }
.text-gradient-teal { background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
```

**`.env.local`** — Create this file (user fills in their keys):
```
NEXT_PUBLIC_SUPABASE_URL=https://qdknhhqqdluvdifmuahi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE
PLAID_CLIENT_ID=PASTE_YOUR_PLAID_CLIENT_ID
PLAID_SECRET=PASTE_YOUR_PLAID_SECRET
PLAID_ENV=sandbox
OPENAI_API_KEY=PASTE_YOUR_OPENAI_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**`middleware.ts`** — Create at root:
```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const publicRoutes = ['/login', '/auth/callback']
  const isPublic = publicRoutes.some(r => pathname.startsWith(r))
  if (!user && !isPublic) return NextResponse.redirect(new URL('/login', request.url))
  if (user && isPublic && !pathname.startsWith('/auth/')) return NextResponse.redirect(new URL('/dashboard', request.url))
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

### PHASE 3: CREATE DIRECTORY STRUCTURE

Create ALL these directories:
```
mkdir -p lib/supabase lib/plaid lib/utils lib/openai
mkdir -p types
mkdir -p components/layout components/dashboard components/charts components/shared components/goals
mkdir -p "app/(auth)/login"
mkdir -p "app/(dashboard)/dashboard"
mkdir -p "app/(dashboard)/accounts"
mkdir -p "app/(dashboard)/transactions"
mkdir -p "app/(dashboard)/budgets"
mkdir -p "app/(dashboard)/goals"
mkdir -p "app/(dashboard)/settings"
mkdir -p "app/(dashboard)/advisor"
mkdir -p "app/(dashboard)/business"
mkdir -p "app/(dashboard)/net-worth"
mkdir -p "app/(dashboard)/investments"
mkdir -p "app/(dashboard)/reports"
mkdir -p app/api/plaid/create-link-token
mkdir -p app/api/plaid/exchange-public-token
mkdir -p app/api/plaid/transactions
mkdir -p app/api/plaid/accounts
mkdir -p app/api/plaid/webhook
mkdir -p app/api/ai/chat
mkdir -p app/auth/callback
mkdir -p supabase
```

---

### PHASE 4: CREATE LIBRARY FILES

**`lib/utils/cn.ts`**:
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
```

**`lib/utils/formatters.ts`**:
```typescript
import { format, isToday, isYesterday, parseISO, formatDistanceToNow } from 'date-fns'

export function formatCurrency(amount: number, opts: { compact?: boolean; sign?: boolean; decimals?: number } = {}): string {
  const { compact = false, sign = false, decimals = 2 } = opts
  const abs = Math.abs(amount)
  let formatted: string
  if (compact && abs >= 1_000_000) formatted = `$${(abs / 1_000_000).toFixed(1)}M`
  else if (compact && abs >= 1_000) formatted = `$${(abs / 1_000).toFixed(0)}K`
  else formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(abs)
  if (sign && amount > 0) return `+${formatted}`
  if (amount < 0) return `-${formatted}`
  return formatted
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, fmt)
}

export function formatDateShort(dateStr: string): string { return format(parseISO(dateStr), 'MMM d') }
export function formatRelative(dateStr: string): string { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) }
export function cleanMerchantName(name: string): string { return name.replace(/\*.*$/, '').replace(/\s{2,}/g, ' ').replace(/[#\d]{4,}/g, '').trim() }
```

**`lib/utils/categories.ts`**:
```typescript
export interface Category { id: string; label: string; icon: string; color: string; bgColor: string }

export const CATEGORIES: Record<string, Category> = {
  'Food & Dining':  { id: 'food',      label: 'Food & Dining',  icon: '🍽️', color: '#f97316', bgColor: 'rgba(249,115,22,0.12)' },
  'Groceries':      { id: 'groceries', label: 'Groceries',      icon: '🛒', color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)'  },
  'Transportation': { id: 'transport', label: 'Transportation', icon: '🚗', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.12)' },
  'Shopping':       { id: 'shopping',  label: 'Shopping',       icon: '🛍️', color: '#a855f7', bgColor: 'rgba(168,85,247,0.12)' },
  'Housing':        { id: 'housing',   label: 'Housing',        icon: '🏠', color: '#14b8a6', bgColor: 'rgba(20,184,166,0.12)' },
  'Entertainment':  { id: 'entertain', label: 'Entertainment',  icon: '🎬', color: '#ec4899', bgColor: 'rgba(236,72,153,0.12)' },
  'Health':         { id: 'health',    label: 'Health',         icon: '💊', color: '#ef4444', bgColor: 'rgba(239,68,68,0.12)'  },
  'Travel':         { id: 'travel',    label: 'Travel',         icon: '✈️', color: '#06b6d4', bgColor: 'rgba(6,182,212,0.12)'  },
  'Subscriptions':  { id: 'subs',      label: 'Subscriptions',  icon: '🔄', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' },
  'Business':       { id: 'business',  label: 'Business',       icon: '💼', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.12)' },
  'Utilities':      { id: 'utilities', label: 'Utilities',      icon: '⚡', color: '#eab308', bgColor: 'rgba(234,179,8,0.12)'  },
  'Income':         { id: 'income',    label: 'Income',         icon: '💰', color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)'  },
  'Transfer':       { id: 'transfer',  label: 'Transfer',       icon: '↔️', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.12)'},
  'Other':          { id: 'other',     label: 'Other',          icon: '📋', color: '#6b7280', bgColor: 'rgba(107,114,128,0.12)'},
}

export function getCategoryInfo(category: string | null): Category { return CATEGORIES[category || 'Other'] || CATEGORIES['Other'] }
export const CATEGORY_LIST = Object.values(CATEGORIES)

export function mapPlaidCategory(cats: string[] | null): string {
  if (!cats?.length) return 'Other'
  const p = cats[0]?.toLowerCase() || '', d = cats[1]?.toLowerCase() || ''
  if (d.includes('restaurant') || d.includes('fast food') || d.includes('coffee')) return 'Food & Dining'
  if (d.includes('groceries') || d.includes('supermarkets')) return 'Groceries'
  if (p.includes('travel') || d.includes('gas station') || d.includes('taxi') || d.includes('uber')) return 'Transportation'
  if (p.includes('shops') || d.includes('clothing') || d.includes('electronics')) return 'Shopping'
  if (p.includes('recreation') || d.includes('streaming') || d.includes('entertainment')) return 'Entertainment'
  if (d.includes('subscription') || d.includes('software')) return 'Subscriptions'
  if (p.includes('healthcare') || p.includes('medical')) return 'Health'
  if (d.includes('utilities')) return 'Utilities'
  if (p.includes('transfer') && (d.includes('payroll') || d.includes('deposit'))) return 'Income'
  if (p.includes('transfer')) return 'Transfer'
  return 'Other'
}
```

**`lib/supabase/client.ts`**:
```typescript
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`lib/supabase/server.ts`**:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { try { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} } } }
  )
}

export async function createServiceClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { try { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} } } }
  )
}
```

**`lib/plaid/client.ts`**:
```typescript
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'
const env = (process.env.PLAID_ENV || 'sandbox') as keyof typeof PlaidEnvironments
const configuration = new Configuration({
  basePath: PlaidEnvironments[env],
  baseOptions: { headers: { 'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!, 'PLAID-SECRET': process.env.PLAID_SECRET! } },
})
export const plaidClient = new PlaidApi(configuration)
export const PLAID_PRODUCTS: Products[] = [Products.Transactions]
export const PLAID_OPTIONAL_PRODUCTS: Products[] = [Products.Investments, Products.Liabilities]
export const PLAID_COUNTRY_CODES: CountryCode[] = [CountryCode.Us]
```

**`lib/openai/client.ts`**:
```typescript
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
]
```

---

### PHASE 5: CREATE ALL API ROUTES

**`app/auth/callback/route.ts`**:
```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookieStore.getAll() }, setAll(s) { s.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/dashboard`)
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

**`app/api/plaid/create-link-token/route.ts`**:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient, PLAID_PRODUCTS, PLAID_OPTIONAL_PRODUCTS, PLAID_COUNTRY_CODES } from '@/lib/plaid/client'
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: 'Summit Finance OS',
      products: PLAID_PRODUCTS,
      optional_products: PLAID_OPTIONAL_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: 'en',
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/webhook`,
    })
    return NextResponse.json({ link_token: response.data.link_token })
  } catch (err: any) {
    console.error('Link token error:', err?.response?.data || err)
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 })
  }
}
```

**`app/api/plaid/exchange-public-token/route.ts`**:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'
import { mapPlaidCategory } from '@/lib/utils/categories'
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { public_token, institution_name, institution_id } = await request.json()
    const tokenRes = await plaidClient.itemPublicTokenExchange({ public_token })
    const { access_token, item_id } = tokenRes.data
    await supabase.from('plaid_items').upsert({ user_id: user.id, access_token, item_id, institution_id, institution_name: institution_name || 'Unknown Bank', status: 'good' }, { onConflict: 'item_id' })
    const accountsRes = await plaidClient.accountsGet({ access_token })
    const accounts = accountsRes.data.accounts
    await supabase.from('accounts').upsert(accounts.map(acc => ({ user_id: user.id, plaid_item_id: item_id, plaid_account_id: acc.account_id, name: acc.name, official_name: acc.official_name ?? null, type: acc.type, subtype: acc.subtype ?? null, current_balance: acc.balances.current ?? null, available_balance: acc.balances.available ?? null, currency_code: acc.balances.iso_currency_code ?? 'USD', mask: acc.mask ?? null, institution_name: institution_name ?? null })), { onConflict: 'plaid_account_id' })
    return NextResponse.json({ success: true, account_count: accounts.length })
  } catch (err: any) {
    console.error('Exchange token error:', err?.response?.data || err)
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 })
  }
}
```

**`app/api/plaid/transactions/route.ts`**:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'
import { mapPlaidCategory } from '@/lib/utils/categories'
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: items } = await supabase.from('plaid_items').select('*').eq('user_id', user.id).eq('status', 'good')
    if (!items?.length) return NextResponse.json({ synced: 0 })
    let totalSynced = 0
    for (const item of items) {
      let cursor = item.cursor ?? undefined, hasMore = true
      const toAdd: any[] = [], toModify: any[] = [], toRemove: string[] = []
      while (hasMore) {
        const res = await plaidClient.transactionsSync({ access_token: item.access_token, cursor, count: 500 })
        toAdd.push(...res.data.added); toModify.push(...res.data.modified)
        toRemove.push(...res.data.removed.map((r: any) => r.transaction_id))
        hasMore = res.data.has_more; cursor = res.data.next_cursor
      }
      const { data: accounts } = await supabase.from('accounts').select('id, plaid_account_id').eq('user_id', user.id)
      const accountMap = Object.fromEntries((accounts || []).map(a => [a.plaid_account_id, a.id]))
      if (toAdd.length) {
        const inserts = toAdd.filter(tx => accountMap[tx.account_id]).map(tx => ({ user_id: user.id, account_id: accountMap[tx.account_id], plaid_transaction_id: tx.transaction_id, amount: tx.amount, name: tx.merchant_name || tx.name, merchant_name: tx.merchant_name ?? null, category: mapPlaidCategory(tx.personal_finance_category?.primary ? [tx.personal_finance_category.primary, tx.personal_finance_category.detailed] : tx.category), plaid_category: tx.category ?? null, date: tx.date, pending: tx.pending, logo_url: tx.logo_url ?? null, is_recurring: false }))
        await supabase.from('transactions').upsert(inserts, { onConflict: 'plaid_transaction_id' })
        totalSynced += inserts.length
      }
      for (const tx of toModify) { await supabase.from('transactions').update({ amount: tx.amount, name: tx.merchant_name || tx.name, pending: tx.pending, category: mapPlaidCategory(tx.category) }).eq('plaid_transaction_id', tx.transaction_id) }
      if (toRemove.length) await supabase.from('transactions').delete().in('plaid_transaction_id', toRemove)
      await supabase.from('plaid_items').update({ cursor, updated_at: new Date().toISOString() }).eq('id', item.id)
    }
    return NextResponse.json({ synced: totalSynced, success: true })
  } catch (err: any) {
    console.error('Sync error:', err?.response?.data || err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
```

**`app/api/plaid/accounts/route.ts`**:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
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
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 })
  }
}
```

**`app/api/plaid/webhook/route.ts`**:
```typescript
import { NextResponse } from 'next/server'
export async function POST(request: Request) {
  const body = await request.json()
  console.log('Plaid webhook:', body.webhook_type, body.webhook_code)
  return NextResponse.json({ received: true })
}
```

**`app/api/ai/chat/route.ts`**:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai, AI_SYSTEM_PROMPT, AI_FUNCTIONS } from '@/lib/openai/client'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

async function executeFunctionCall(name: string, args: any, supabase: any, userId: string) {
  const now = new Date()
  if (name === 'get_spending_summary') {
    const { data } = await supabase.from('transactions').select('amount, category').eq('user_id', userId).gte('date', args.start_date).lte('date', args.end_date).gt('amount', 0)
    const byCategory: Record<string, number> = {}
    for (const tx of data || []) { if (!args.category || tx.category === args.category) byCategory[tx.category || 'Other'] = (byCategory[tx.category || 'Other'] || 0) + tx.amount }
    const total = Object.values(byCategory).reduce((s, v) => s + v, 0)
    return { categories: Object.entries(byCategory).sort((a,b) => b[1]-a[1]).map(([k,v]) => ({ category: k, amount: v, percent: total > 0 ? Math.round(v/total*100) : 0 })), total }
  }
  if (name === 'get_net_worth') {
    const { data: accounts } = await supabase.from('accounts').select('type, current_balance').eq('user_id', userId)
    const assets = (accounts || []).filter((a: any) => a.type !== 'credit' && a.type !== 'loan').reduce((s: number, a: any) => s + (a.current_balance || 0), 0)
    const liabilities = (accounts || []).filter((a: any) => a.type === 'credit' || a.type === 'loan').reduce((s: number, a: any) => s + Math.abs(a.current_balance || 0), 0)
    return { net_worth: assets - liabilities, total_assets: assets, total_liabilities: liabilities }
  }
  if (name === 'get_goals_progress') {
    const query = supabase.from('goals').select('*').eq('user_id', userId)
    if (args.type) query.eq('type', args.type)
    const { data } = await query
    return { goals: (data || []).map((g: any) => ({ ...g, progress_percent: g.target_amount > 0 ? Math.round(g.current_amount / g.target_amount * 100) : 0, remaining: g.target_amount - g.current_amount })) }
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
    const monthDate = new Date(args.month + '-01')
    const start = format(startOfMonth(monthDate), 'yyyy-MM-dd'), end = format(endOfMonth(monthDate), 'yyyy-MM-dd')
    const { data: budgets } = await supabase.from('budgets').select('*').eq('user_id', userId).gte('month', start).lte('month', end)
    const { data: txs } = await supabase.from('transactions').select('amount, category').eq('user_id', userId).gte('date', start).lte('date', end).gt('amount', 0)
    const spent: Record<string, number> = {}
    for (const tx of txs || []) { spent[tx.category || 'Other'] = (spent[tx.category || 'Other'] || 0) + tx.amount }
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { messages } = await request.json()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: AI_SYSTEM_PROMPT }, ...messages],
      tools: AI_FUNCTIONS.map(f => ({ type: 'function' as const, function: f })),
      tool_choice: 'auto',
    })
    const msg = response.choices[0].message
    if (msg.tool_calls?.length) {
      const toolResults = await Promise.all(msg.tool_calls.map(async tc => ({ tool_call_id: tc.id, role: 'tool' as const, content: JSON.stringify(await executeFunctionCall(tc.function.name, JSON.parse(tc.function.arguments), supabase, user.id)) })))
      const final = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: AI_SYSTEM_PROMPT }, ...messages, msg, ...toolResults],
      })
      return NextResponse.json({ message: final.choices[0].message.content })
    }
    return NextResponse.json({ message: msg.content })
  } catch (err: any) {
    console.error('AI chat error:', err)
    return NextResponse.json({ error: 'AI error' }, { status: 500 })
  }
}
```

---

### PHASE 6: CREATE THE APP SHELL

**`app/layout.tsx`**:
```typescript
import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'Summit Finance OS', description: 'Your complete financial command center' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-canvas text-primary antialiased">{children}</body>
    </html>
  )
}
```

**`app/page.tsx`**:
```typescript
import { redirect } from 'next/navigation'
export default function Root() { redirect('/dashboard') }
```

---

### PHASE 7: AUTH — LOGIN PAGE

**`app/(auth)/login/page.tsx`** — Create a beautiful, premium dark login page with:
- Left panel (hidden on mobile): dark surface background with grid overlay, teal radial glow, Summit Finance OS branding with TrendingUp icon, 3 feature bullets (Live Bank Sync, AI Advisor, Real-time Net Worth), security badge at bottom
- Right panel: "Welcome back" heading, email + password inputs styled with dark surface bg + teal focus ring, show/hide password toggle, "Sign in to Summit" button in teal, spinning loader state
- On submit: call `supabase.auth.signInWithPassword()`, redirect to `/dashboard`, show error if fails
- Styling: All inputs have `bg-surface border-border rounded-xl` + `focus:border-teal/40 focus:ring-1 focus:ring-teal/30` — NO white backgrounds anywhere
- Import `createClient` from `@/lib/supabase/client`, use `useRouter` for redirect

---

### PHASE 8: DASHBOARD LAYOUT

**`app/(dashboard)/layout.tsx`**:
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Toaster } from 'sonner'
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle()
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar userEmail={profile?.email || user.email || ''} userName={profile?.full_name || 'Dan Gill'} />
      <main className="flex-1 overflow-y-auto bg-canvas">{children}</main>
      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: '#0e1520', border: '1px solid #1e2d42', color: '#e8edf5' } }} />
    </div>
  )
}
```

---

### PHASE 9: SIDEBAR COMPONENT

**`components/layout/sidebar.tsx`** — Build a premium collapsible sidebar with:
- Width: 240px expanded, 60px collapsed, toggle with ChevronRight button
- Header: Summit FinOS logo (LayoutDashboard icon in teal rounded square + "Summit" white + "FinOS" teal text)
- Quick action button: "Quick Add Transaction" in teal-bg with Plus icon
- Navigation sections with tiny uppercase labels:
  - **Overview**: Dashboard (LayoutDashboard), Net Worth (TrendingUp), Accounts (BookOpen)
  - **Money Flow**: Transactions (CreditCard), Budgets (PieChart), Subscriptions (Zap)
  - **Planning**: Goals (Target), Investments (BarChart3), Reports (BarChart3), Future Planning (TrendingUp)
  - **Command**: Business OS (Building2), Family (Users), AI Advisor (Bot)
- Active state: `bg-teal-bg border border-teal/20 text-teal` with small teal dot on right
- Inactive: `text-secondary hover:text-primary hover:bg-panel`
- Footer: Settings link + user avatar (teal initial circle) + email + logout button (LogOut icon → hover text-down)
- When collapsed: show only icons, centered, with title tooltip

---

### PHASE 10: TOP BAR COMPONENT

**`components/layout/top-bar.tsx`**:
```typescript
'use client'
import { Bell, RefreshCw } from 'lucide-react'
interface TopBarProps { title: string; subtitle?: string; onSync?: () => void; syncing?: boolean; actions?: React.ReactNode }
export function TopBar({ title, subtitle, onSync, syncing, actions }: TopBarProps) {
  return (
    <header className="h-[60px] border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-30 flex items-center px-6 gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-display font-bold text-primary">{title}</h1>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {onSync && (
          <button onClick={onSync} disabled={syncing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel border border-border text-xs text-secondary hover:text-primary hover:border-teal/30 transition-all disabled:opacity-50">
            <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
            <span className="hidden sm:block">{syncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}
        {actions}
        <button className="relative w-8 h-8 rounded-lg bg-panel border border-border flex items-center justify-center text-muted hover:text-primary transition-all">
          <Bell size={13} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-teal" />
        </button>
      </div>
    </header>
  )
}
```

---

### PHASE 11: DASHBOARD COMPONENTS

**`components/shared/plaid-connect-button.tsx`** — Button that:
1. Fetches link token from `/api/plaid/create-link-token`
2. Opens Plaid Link with `usePlaidLink` from `react-plaid-link`
3. On success, POSTs to `/api/plaid/exchange-public-token`
4. Shows toast on success/error
5. Props: `onSuccess?: () => void`, `variant?: 'primary' | 'ghost'`

**`components/dashboard/stat-card.tsx`** — Premium KPI card with:
- Props: label, value, delta (%), deltaLabel, format ('currency'|'percent'|'number'), icon, accent color, loading state
- Loading: animated pulse skeleton
- Design: `rounded-2xl bg-surface border border-border p-5 card-hover`
- Top: thin gradient line `from-transparent via-teal/20 to-transparent`
- Header row: tiny uppercase label left, icon in colored rounded square right
- Value: large `font-num text-[28px] font-bold`
- Delta: TrendingUp/TrendingDown icon + percent in green/red + label text
- Accent colors: teal, green, red, amber, blue — each with matching bg and border

**`components/charts/cash-flow-chart.tsx`** — Recharts AreaChart:
- Props: `data: { month: string; income: number; expenses: number }[]`, `loading?`
- Income area: teal `#14b8a6` stroke + gradient fill opacity 0-25%
- Expenses area: red `#ef4444` stroke + gradient fill opacity 0-20%
- Dark axes, no vertical grid lines, custom tooltip with dark panel style
- Formatters use `formatCurrency` with compact option

**`components/charts/spending-donut.tsx`** — PieChart with legend:
- Left: Recharts PieChart donut (innerRadius 42, outerRadius 60) — top 5 categories
- Right: Legend list with icon + name + amount + progress bar
- Category colors from `getCategoryInfo`
- Custom dark tooltip

**`components/dashboard/recent-transactions.tsx`** — Transaction list:
- Props: `transactions[]`, `loading?`
- Loading: 6 animated skeleton rows
- Each row: category emoji icon in colored rounded square + merchant name (cleaned) + date + pending badge + amount (red for debit, green for credit)
- Hover: `hover:bg-panel/60` row highlight
- Footer: "View all transactions" link with arrow

**`components/dashboard/goals-strip.tsx`** — Compact goals list:
- Props: `goals[]`, `loading?`
- Each goal: icon + name + percent right-aligned + progress bar + saved/target amounts
- Progress bar color from `goal.color`
- Empty state: Create first goal button
- Footer: "Manage goals" link

**`components/dashboard/connect-bank-prompt.tsx`** — Empty state when no accounts:
- Centered card with Link2 icon in teal circle
- Title: "Connect Your Bank"
- 2 trust badges: Shield "Bank-grade security" + Zap "Instant sync"
- Big teal button that fetches link token and opens Plaid

---

### PHASE 12: DASHBOARD PAGE

**`app/(dashboard)/dashboard/page.tsx`** — Server component that fetches:
- All accounts → compute net worth (assets - liabilities)
- This month's transactions → income, expenses, cashFlow, savingsRate
- Spending by category (this month)
- Cash flow data for last 6 months (parallel queries)
- Last net worth snapshot → delta %
- Recent 10 transactions
- Active goals

Pass everything to a client `DashboardContent` component.

**`app/(dashboard)/dashboard/dashboard-content.tsx`** — Client component:
- Sync button that calls both `/api/plaid/accounts` and `/api/plaid/transactions` → toast → router.refresh()
- Row 1: 4 StatCards — Net Worth (teal), Total Assets (green), Month Expenses (red), Savings Rate (green/amber/red based on %)
- Row 2: CashFlowChart (2/3 width) + SpendingDonut (1/3 width) — both in `rounded-2xl bg-surface border border-border p-5`
- Row 3: RecentTransactions (2/3) + GoalsStrip (1/3)
- Row 4: Monthly summary banner — 3 columns (Income | Expenses | Net Cash Flow) with teal/red/green numbers
- If no accounts: show ConnectBankPrompt instead

---

### PHASE 13: REMAINING PAGES

**`app/(dashboard)/accounts/page.tsx`** — Server component showing all accounts grouped by type (depository, credit, investment, loan) with balances. Each group in a `rounded-2xl bg-surface border border-border` card. Show total assets and total liabilities KPI cards at top.

**`app/(dashboard)/transactions/page.tsx`** + **`transactions-content.tsx`** — Full transactions table with:
- 3 stat cards: count, total spending, total income
- Search bar (filter by merchant name) + category dropdown filter
- Table: date | merchant (with category icon) | category pill | account | amount
- Alternating subtle row hover
- Footer showing count
- Pagination or limit to 200

**`app/(dashboard)/budgets/page.tsx`** + **`budgets-content.tsx`** — Monthly budgets:
- Summary: total budgeted, total spent, on-track count
- Add budget form (category dropdown + amount)
- Grid of budget cards with progress bars (green < 80%, amber 80-100%, red > 100%)
- Each card shows spent/budget amounts and "Over by $X" when exceeded

**`app/(dashboard)/goals/page.tsx`** + **`goals-content.tsx`** — Full goals management:
- Stats: active count, completed count, total saved
- Create goal form: icon picker (emoji grid), name, target amount, current amount, type (personal/family/business/retirement toggle), target date, color
- Goal cards in 3-column grid: icon + name + progress bar + saved/target + "Add Deposit" button
- Completed goals list at bottom with checkmark
- Empty state: Target icon + "Start with something meaningful — like giving your dad $50,000"

**`app/(dashboard)/settings/page.tsx`** + **`settings-content.tsx`** — Settings page:
- Connected Banks section: list all plaid_items with account sub-list, "Sync All" button, "Add Account" (PlaidConnectButton), disconnect button per bank
- Account Info section: email, plan badge

**`app/(dashboard)/advisor/page.tsx`** — AI Advisor chat:
- Full-height chat interface like a premium messaging app
- Messages: user (right, teal bubble) + AI (left, surface card with Bot icon)
- Input bar: text input + Send button
- AI greeting: "Hello! I'm your Summit AI Financial Advisor. I have full access to your financial data. Ask me anything."
- On send: POST to `/api/ai/chat` with message history → stream response → display
- Suggested prompts: "What's my net worth?", "How much did I spend on food last month?", "Am I on track for my goals?", "What subscriptions should I cancel?"

**`app/(dashboard)/business/page.tsx`** — Business OS:
- Current MRR (large display) with vs last month delta
- MRR Planner: inputs for target MRR + months + churn rate → calculate clients needed
- Service packages CRUD: name + MRR + setup fee cards with edit/delete
- MRR history bar chart (last 12 months) using Recharts
- Add monthly metric button

**Stub pages** for `/net-worth`, `/investments`, `/reports` — show "Coming in Phase 2" with construction emoji and description of what's coming.

---

### PHASE 14: DATABASE SCHEMA

**`supabase/schema.sql`** — Create this complete SQL file that sets up all tables. Run it in Supabase SQL Editor. Include:

```sql
-- Profiles (auto-created on signup via trigger)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, email TEXT NOT NULL, avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their profile" ON profiles USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN INSERT INTO profiles (id, email, full_name) VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name') ON CONFLICT (id) DO NOTHING; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Plaid Items
CREATE TABLE IF NOT EXISTS plaid_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL, item_id TEXT NOT NULL UNIQUE, institution_id TEXT, institution_name TEXT,
  cursor TEXT, status TEXT DEFAULT 'good', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own plaid items" ON plaid_items USING (auth.uid() = user_id);

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id TEXT, plaid_account_id TEXT UNIQUE, name TEXT NOT NULL, official_name TEXT,
  type TEXT NOT NULL, subtype TEXT, current_balance NUMERIC(14,2), available_balance NUMERIC(14,2),
  currency_code TEXT DEFAULT 'USD', mask TEXT, is_hidden BOOLEAN DEFAULT FALSE,
  display_name TEXT, institution_name TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own accounts" ON accounts USING (auth.uid() = user_id);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL, plaid_transaction_id TEXT UNIQUE,
  amount NUMERIC(14,2) NOT NULL, name TEXT NOT NULL, merchant_name TEXT, category TEXT,
  plaid_category TEXT[], date DATE NOT NULL, pending BOOLEAN DEFAULT FALSE,
  notes TEXT, tags TEXT[], is_recurring BOOLEAN DEFAULT FALSE, is_flagged BOOLEAN DEFAULT FALSE,
  is_reimbursable BOOLEAN DEFAULT FALSE, logo_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_plaid ON transactions(plaid_transaction_id);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own transactions" ON transactions USING (auth.uid() = user_id);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, amount NUMERIC(14,2) NOT NULL, month DATE NOT NULL,
  owner TEXT DEFAULT 'shared', rollover BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, month, owner)
);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own budgets" ON budgets USING (auth.uid() = user_id);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, type TEXT DEFAULT 'personal', target_amount NUMERIC(14,2) NOT NULL,
  current_amount NUMERIC(14,2) DEFAULT 0, target_date DATE, linked_account_id UUID,
  icon TEXT DEFAULT '🎯', color TEXT DEFAULT '#14b8a6', is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own goals" ON goals USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS goal_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL, note TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE goal_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own goal deposits" ON goal_deposits USING (EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_deposits.goal_id AND goals.user_id = auth.uid()));

-- Business Metrics
CREATE TABLE IF NOT EXISTS business_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, mrr NUMERIC(14,2) DEFAULT 0, client_count INTEGER DEFAULT 0,
  churn_rate NUMERIC(5,2) DEFAULT 0, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id, month)
);
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own business metrics" ON business_metrics USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS service_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, mrr NUMERIC(14,2) NOT NULL, setup_fee NUMERIC(14,2) DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own service packages" ON service_packages USING (auth.uid() = user_id);

-- Manual Assets + Net Worth Snapshots
CREATE TABLE IF NOT EXISTS manual_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, type TEXT, value NUMERIC(14,2) NOT NULL, description TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE manual_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own manual assets" ON manual_assets USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL, total_assets NUMERIC(14,2), total_liabilities NUMERIC(14,2), net_worth NUMERIC(14,2),
  UNIQUE(user_id, snapshot_date)
);
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own net worth snapshots" ON net_worth_snapshots USING (auth.uid() = user_id);

SELECT 'Schema installed' as status;
```

---

### PHASE 15: FINAL STEPS

1. Create a `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: 'plaid-merchant-logos.plaid.com' }, { protocol: 'https', hostname: 'logo.clearbit.com' }] },
}
module.exports = nextConfig
```

2. Verify everything compiles: `npm run build` — fix any TypeScript errors

3. Run `npm run dev` and confirm the app loads at `http://localhost:3000`

4. Make an initial git commit:
```
git add .
git commit -m "feat: Summit Finance OS Phase 1 complete"
git push origin main
```

---

### WHAT SUCCESS LOOKS LIKE

When complete, the user should be able to:
1. Visit `http://localhost:3000` → redirect to `/dashboard` → redirect to `/login`
2. Log in with email/password → land on dashboard
3. See the sidebar with all navigation items
4. Go to Settings → click "Add Account" → Plaid Link opens → use `user_good` / `pass_good` (sandbox)
5. Return to Dashboard → click "Sync Now" → see real transactions populate
6. Navigate to Transactions, Budgets, Goals, Business OS, AI Advisor

The UI should look like a $100,000 SaaS product: dark canvas background, teal accents, Syne display font, DM Mono for numbers, premium card components with subtle hover effects. NOT like a template. NOT like Vercel's default Next.js starter.

**DO NOT stop until `npm run build` passes with no errors and `npm run dev` shows a working app.**
