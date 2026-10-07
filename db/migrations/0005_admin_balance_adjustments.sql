ALTER TABLE public.customer_ledger_entries
  DROP CONSTRAINT customer_ledger_entries_entry_type_check;

ALTER TABLE public.customer_ledger_entries
  ADD CONSTRAINT customer_ledger_entries_entry_type_check
  CHECK (
    entry_type IN (
      'deposit_credit',
      'withdrawal_reserve',
      'withdrawal_refund',
      'deposit_to_main',
      'admin_rate_accrual',
      'referral_credit',
      'admin_adjustment'
    )
  );
