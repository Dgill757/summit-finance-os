export interface AccountRecord {
  id: string
  user_id?: string
  name: string
  official_name?: string | null
  type: string
  subtype?: string | null
  current_balance?: number | null
  available_balance?: number | null
  institution_name?: string | null
  mask?: string | null
  plaid_item_id?: string | null
  display_name?: string | null
}

export interface TransactionRecord {
  id: string
  user_id?: string
  amount: number
  name: string
  merchant_name?: string | null
  category?: string | null
  date: string
  pending?: boolean | null
  logo_url?: string | null
  account?: { name?: string | null } | null
  notes?: string | null
  is_business?: boolean | null
  is_recurring?: boolean | null
  account_id?: string | null
}

export interface GoalRecord {
  id: string
  user_id?: string
  name: string
  type: string
  icon: string
  color: string
  target_amount: number
  current_amount: number
  target_date?: string | null
  is_completed?: boolean | null
}

export interface SubscriptionRecord {
  merchant: string
  monthly_amount: number
  annual_amount: number
  months_detected: number
  last_charged: string
  logo_url?: string | null
  category: string
}

export interface ManualAssetRecord {
  id: string
  user_id?: string
  name: string
  type?: string | null
  value: number
  description?: string | null
  updated_at?: string | null
  created_at?: string | null
}

export interface BusinessMetricRecord {
  id: string
  month: string
  mrr: number
  client_count?: number | null
  churn_rate?: number | null
  notes?: string | null
}

export interface ServicePackageRecord {
  id: string
  name: string
  mrr: number
  setup_fee?: number | null
}
