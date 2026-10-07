CREATE TABLE public.market_groups (
  name text PRIMARY KEY CHECK (length(trim(name)) BETWEEN 1 AND 60),
  position integer NOT NULL CHECK (position >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.market_products (
  symbol text PRIMARY KEY CHECK (symbol = upper(symbol) AND symbol ~ '^[A-Z0-9._-]{1,20}$'),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  group_name text NOT NULL REFERENCES public.market_groups(name) ON UPDATE CASCADE ON DELETE CASCADE,
  ask numeric(20, 8) NOT NULL CHECK (ask > 0),
  spread integer NOT NULL CHECK (spread BETWEEN 0 AND 1000000),
  decimals smallint NOT NULL CHECK (decimals BETWEEN 0 AND 8),
  change numeric(9, 4) NOT NULL CHECK (change BETWEEN -100 AND 100),
  position integer NOT NULL CHECK (position >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX market_products_group_position_idx
  ON public.market_products (group_name, position, symbol);

INSERT INTO public.market_groups (name, position) VALUES
  ('Metal', 0),
  ('Forex', 1),
  ('Energy', 2),
  ('Index', 3);

-- Initial catalog values are illustrative placeholders, not live market quotes.
INSERT INTO public.market_products
  (symbol, name, group_name, ask, spread, decimals, change, position)
VALUES
  ('AUDJPY', 'Australian Dollar / Japanese Yen', 'Forex', 110.401, 28, 3, 0.30, 0),
  ('AUDNZD', 'Australian Dollar / New Zealand Dollar', 'Forex', 1.24284, 31, 5, -0.11, 1),
  ('AUDUSD', 'Australian Dollar / US Dollar', 'Forex', 0.69828, 23, 5, 0.14, 2),
  ('EURAUD', 'Euro / Australian Dollar', 'Forex', 1.61279, 44, 5, 0.22, 3),
  ('EURCHF', 'Euro / Swiss Franc', 'Forex', 0.93549, 30, 5, 0.34, 4),
  ('EURGBP', 'Euro / British Pound', 'Forex', 0.84837, 22, 5, -0.04, 5),
  ('EURJPY', 'Euro / Japanese Yen', 'Forex', 178.016, 26, 3, 0.46, 6),
  ('EURUSD', 'Euro / US Dollar', 'Forex', 1.12593, 20, 5, 0.33, 7),
  ('GBPAUD', 'British Pound / Australian Dollar', 'Forex', 1.90125, 40, 5, 0.27, 8),
  ('GBPCHF', 'British Pound / Swiss Franc', 'Forex', 1.10287, 42, 5, 0.40, 9),
  ('GBPJPY', 'British Pound / Japanese Yen', 'Forex', 209.845, 35, 3, 0.53, 10),
  ('GBPUSD', 'British Pound / US Dollar', 'Forex', 1.32737, 22, 5, 0.40, 11),
  ('USDJPY', 'US Dollar / Japanese Yen', 'Forex', 158.124, 24, 3, 0.14, 12),
  ('XAUUSD', 'Gold / US Dollar', 'Metal', 4168.26, 32, 2, 0.69, 13),
  ('XAGUSD', 'Silver / US Dollar', 'Metal', 48.325, 25, 3, 0.82, 14),
  ('USOIL', 'West Texas Intermediate', 'Energy', 87.61, 3, 2, -1.86, 15),
  ('UKOIL', 'Brent Crude Oil', 'Energy', 91.24, 4, 2, -1.24, 16),
  ('US30', 'Dow Jones Industrial Average', 'Index', 42852.4, 20, 1, 0.42, 17),
  ('NAS100', 'Nasdaq 100', 'Index', 21345.6, 15, 1, 0.76, 18);
