-- Profiles (auto-created on signup via trigger)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their profile" ON profiles USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE IF NOT EXISTS plaid_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  item_id TEXT NOT NULL UNIQUE,
  institution_id TEXT,
  institution_name TEXT,
  cursor TEXT,
  status TEXT DEFAULT 'good',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own plaid items" ON plaid_items USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id TEXT,
  plaid_account_id TEXT UNIQUE,
  name TEXT NOT NULL,
  official_name TEXT,
  type TEXT NOT NULL,
  subtype TEXT,
  current_balance NUMERIC(14,2),
  available_balance NUMERIC(14,2),
  currency_code TEXT DEFAULT 'USD',
  mask TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  display_name TEXT,
  institution_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own accounts" ON accounts USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  plaid_transaction_id TEXT UNIQUE,
  amount NUMERIC(14,2) NOT NULL,
  name TEXT NOT NULL,
  merchant_name TEXT,
  category TEXT,
  plaid_category TEXT[],
  date DATE NOT NULL,
  pending BOOLEAN DEFAULT FALSE,
  notes TEXT,
  tags TEXT[],
  is_recurring BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_reimbursable BOOLEAN DEFAULT FALSE,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_plaid ON transactions(plaid_transaction_id);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own transactions" ON transactions USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  month DATE NOT NULL,
  owner TEXT DEFAULT 'shared',
  rollover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, month, owner)
);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own budgets" ON budgets USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'personal',
  target_amount NUMERIC(14,2) NOT NULL,
  current_amount NUMERIC(14,2) DEFAULT 0,
  target_date DATE,
  linked_account_id UUID,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#14b8a6',
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own goals" ON goals USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS goal_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE goal_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own goal deposits" ON goal_deposits USING (EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_deposits.goal_id AND goals.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS business_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  mrr NUMERIC(14,2) DEFAULT 0,
  client_count INTEGER DEFAULT 0,
  churn_rate NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own business metrics" ON business_metrics USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS service_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mrr NUMERIC(14,2) NOT NULL,
  setup_fee NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own service packages" ON service_packages USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS manual_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  value NUMERIC(14,2) NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE manual_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own manual assets" ON manual_assets USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_assets NUMERIC(14,2),
  total_liabilities NUMERIC(14,2),
  net_worth NUMERIC(14,2),
  UNIQUE(user_id, snapshot_date)
);
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own net worth snapshots" ON net_worth_snapshots USING (auth.uid() = user_id);

SELECT 'Schema installed' as status;
