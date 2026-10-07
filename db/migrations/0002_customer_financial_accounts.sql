CREATE TABLE public.customer_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 120),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  phone text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'Belum Verifikasi'
    CHECK (status IN ('Aktif', 'Belum Verifikasi', 'Diblokir')),
  daily_rate_override numeric(9, 4)
    CHECK (daily_rate_override IS NULL OR daily_rate_override BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_accounts (
  user_id uuid PRIMARY KEY REFERENCES public.customer_users(id) ON DELETE RESTRICT,
  deposit_balance numeric(20, 2) NOT NULL DEFAULT 0 CHECK (deposit_balance >= 0),
  main_balance numeric(20, 2) NOT NULL DEFAULT 0 CHECK (main_balance >= 0),
  total_accrual numeric(20, 2) NOT NULL DEFAULT 0 CHECK (total_accrual >= 0),
  daily_accrual numeric(20, 2) NOT NULL DEFAULT 0 CHECK (daily_accrual >= 0),
  daily_accrual_date date,
  last_compound_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_sessions (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.customer_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_sessions_user_expires_idx
  ON public.customer_sessions (user_id, expires_at);

CREATE TABLE public.customer_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.customer_users(id) ON DELETE RESTRICT,
  sender_name_ciphertext text NOT NULL,
  sender_bank_ciphertext text NOT NULL,
  sender_account_ciphertext text NOT NULL,
  sender_amount_idr numeric(20, 2) NOT NULL CHECK (sender_amount_idr > 0),
  destination_account_id text NOT NULL,
  method text NOT NULL,
  amount numeric(20, 2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  proof_ciphertext text NOT NULL,
  status text NOT NULL DEFAULT 'Menunggu'
    CHECK (status IN ('Menunggu', 'Disetujui', 'Ditolak')),
  note text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_deposits_user_created_idx
  ON public.customer_deposits (user_id, created_at DESC);

CREATE INDEX customer_deposits_status_created_idx
  ON public.customer_deposits (status, created_at DESC);

CREATE TABLE public.customer_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.customer_users(id) ON DELETE RESTRICT,
  bank_ciphertext text NOT NULL,
  account_ciphertext text NOT NULL,
  amount numeric(20, 2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  status text NOT NULL DEFAULT 'Menunggu'
    CHECK (status IN ('Menunggu', 'Diproses', 'Berhasil', 'Ditolak')),
  note text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_withdrawals_user_created_idx
  ON public.customer_withdrawals (user_id, created_at DESC);

CREATE INDEX customer_withdrawals_status_created_idx
  ON public.customer_withdrawals (status, created_at DESC);

CREATE TABLE public.customer_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.customer_users(id) ON DELETE RESTRICT,
  entry_type text NOT NULL CHECK (
    entry_type IN (
      'deposit_credit',
      'withdrawal_reserve',
      'withdrawal_refund',
      'deposit_to_main',
      'admin_rate_accrual',
      'referral_credit'
    )
  ),
  bucket text NOT NULL CHECK (bucket IN ('deposit', 'main')),
  amount numeric(20, 2) NOT NULL CHECK (amount > 0),
  balance_after numeric(20, 2) NOT NULL CHECK (balance_after >= 0),
  source_type text NOT NULL,
  source_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_type, source_type, source_id)
);

CREATE INDEX customer_ledger_user_created_idx
  ON public.customer_ledger_entries (user_id, created_at DESC);

CREATE TABLE public.customer_daily_accruals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.customer_users(id) ON DELETE RESTRICT,
  accrual_date date NOT NULL,
  rate_percent numeric(9, 4) NOT NULL CHECK (rate_percent BETWEEN 0 AND 100),
  amount numeric(20, 2) NOT NULL CHECK (amount > 0),
  balance_after numeric(20, 2) NOT NULL CHECK (balance_after >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, accrual_date)
);

CREATE TABLE public.customer_compound_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  global_rate_percent numeric(9, 4) NOT NULL DEFAULT 0
    CHECK (global_rate_percent BETWEEN 0 AND 100),
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.customer_compound_settings (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE public.customer_site_settings (
  setting_key text PRIMARY KEY,
  setting_value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_name text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customer_admin_audit_created_idx
  ON public.customer_admin_audit (created_at DESC);
