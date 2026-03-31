export interface AccountRecord {
  id: string
  name: string
  official_name?: string | null
  type: string
  subtype?: string | null
  current_balance?: number | null
  available_balance?: number | null
  institution_name?: string | null
  mask?: string | null
}

export interface TransactionRecord {
  id: string
  amount: number
  name: string
  merchant_name?: string | null
  category?: string | null
  date: string
  pending?: boolean | null
  logo_url?: string | null
  account?: { name?: string | null } | null
}

export interface GoalRecord {
  id: string
  name: string
  type: string
  icon: string
  color: string
  target_amount: number
  current_amount: number
  target_date?: string | null
  is_completed?: boolean | null
}
