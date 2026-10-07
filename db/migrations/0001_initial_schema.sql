-- Non-sensitive site configuration. Do not store credentials or customer data here.
CREATE TABLE public.app_settings (
  setting_key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The application currently has demo-only account flows.
-- The constraint prevents these records from being mistaken for real accounts.
CREATE TABLE public.demo_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  currency char(3) NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  balance numeric(20, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  is_demo boolean NOT NULL DEFAULT true CHECK (is_demo IS TRUE),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Deliberately excludes bank-account details, uploaded payment proofs, and real-user identifiers.
CREATE TABLE public.demo_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_account_id uuid NOT NULL REFERENCES public.demo_accounts(id) ON DELETE RESTRICT,
  entry_type text NOT NULL CHECK (
    entry_type IN ('deposit', 'withdrawal', 'trade', 'profit', 'adjustment')
  ),
  status text NOT NULL DEFAULT 'completed' CHECK (
    status IN ('pending', 'processing', 'completed', 'rejected')
  ),
  amount numeric(20, 2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  is_demo boolean NOT NULL DEFAULT true CHECK (is_demo IS TRUE),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX demo_ledger_entries_account_created_at_idx
  ON public.demo_ledger_entries (demo_account_id, created_at DESC);
