ALTER TABLE public.customer_users
  ADD COLUMN referral_code text,
  ADD COLUMN referred_by uuid REFERENCES public.customer_users(id) ON DELETE SET NULL,
  ADD COLUMN referral_commission_rate numeric(9, 4)
    CHECK (referral_commission_rate IS NULL OR referral_commission_rate BETWEEN 0 AND 100),
  ADD COLUMN referral_enabled boolean NOT NULL DEFAULT true;

UPDATE public.customer_users
SET referral_code = upper(substr(md5(id::text || clock_timestamp()::text), 1, 12))
WHERE referral_code IS NULL;

ALTER TABLE public.customer_users
  ALTER COLUMN referral_code SET DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  ALTER COLUMN referral_code SET NOT NULL,
  ADD CONSTRAINT customer_users_not_self_referred CHECK (referred_by IS DISTINCT FROM id);

CREATE UNIQUE INDEX customer_users_referral_code_idx
  ON public.customer_users (referral_code);

CREATE INDEX customer_users_referred_by_idx
  ON public.customer_users (referred_by)
  WHERE referred_by IS NOT NULL;

CREATE TABLE public.site_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  message text NOT NULL CHECK (length(trim(message)) BETWEEN 1 AND 3000),
  target_user_ids uuid[],
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    target_user_ids IS NULL
    OR (cardinality(target_user_ids) BETWEEN 1 AND 1000 AND array_position(target_user_ids, NULL) IS NULL)
  )
);

CREATE INDEX site_notifications_created_idx
  ON public.site_notifications (created_at DESC);
