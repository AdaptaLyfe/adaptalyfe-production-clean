-- Utility Billing Consumer Portal.
-- Every object created here is isolated under the utility_ namespace.

CREATE TABLE IF NOT EXISTS utility_users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_consumers (
  id BIGSERIAL PRIMARY KEY,
  utility_user_id BIGINT NOT NULL UNIQUE
    REFERENCES utility_users(id) ON DELETE CASCADE,
  consumer_number VARCHAR(32) NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  service_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_connections (
  id BIGSERIAL PRIMARY KEY,
  consumer_id BIGINT NOT NULL
    REFERENCES utility_consumers(id) ON DELETE CASCADE,
  utility_type VARCHAR(16) NOT NULL
    CHECK (utility_type IN ('electricity', 'water')),
  connection_number VARCHAR(40) NOT NULL UNIQUE,
  meter_number VARCHAR(40) NOT NULL,
  current_reading NUMERIC(12, 2) NOT NULL,
  consumption NUMERIC(12, 2) NOT NULL,
  consumption_unit VARCHAR(16) NOT NULL,
  current_bill NUMERIC(12, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (consumer_id, utility_type)
);

CREATE TABLE IF NOT EXISTS utility_bills (
  id BIGSERIAL PRIMARY KEY,
  consumer_id BIGINT NOT NULL
    REFERENCES utility_consumers(id) ON DELETE CASCADE,
  utility_type VARCHAR(16) NOT NULL
    CHECK (utility_type IN ('electricity', 'water')),
  bill_number VARCHAR(48) NOT NULL UNIQUE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  status VARCHAR(16) NOT NULL CHECK (status IN ('due', 'paid')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (consumer_id, utility_type, billing_period_start)
);

CREATE TABLE IF NOT EXISTS utility_payments (
  id BIGSERIAL PRIMARY KEY,
  consumer_id BIGINT NOT NULL
    REFERENCES utility_consumers(id) ON DELETE CASCADE,
  bill_id BIGINT NOT NULL REFERENCES utility_bills(id) ON DELETE CASCADE,
  payment_reference VARCHAR(48) NOT NULL UNIQUE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  payment_method VARCHAR(24) NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('completed', 'pending', 'failed'))
);

CREATE TABLE IF NOT EXISTS utility_service_requests (
  id BIGSERIAL PRIMARY KEY,
  consumer_id BIGINT NOT NULL
    REFERENCES utility_consumers(id) ON DELETE CASCADE,
  ticket_number VARCHAR(48) NOT NULL UNIQUE,
  category VARCHAR(40) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS utility_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  utility_user_id BIGINT NOT NULL
    REFERENCES utility_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS utility_sessions_expires_at_idx
  ON utility_sessions (expires_at);
CREATE INDEX IF NOT EXISTS utility_bills_consumer_due_idx
  ON utility_bills (consumer_id, due_date);
CREATE INDEX IF NOT EXISTS utility_payments_consumer_paid_idx
  ON utility_payments (consumer_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS utility_service_requests_consumer_created_idx
  ON utility_service_requests (consumer_id, created_at DESC);

-- Demo-only account. The stored value is a bcrypt hash, not a plaintext password.
INSERT INTO utility_users (username, password_hash)
VALUES ('demo.consumer', '$2b$12$8avhUJ7N4CI9Bg3Ni3S2J.PqvymPHu1vrnrggV4wNUa1TslJOtqLO')
ON CONFLICT (username) DO NOTHING;

INSERT INTO utility_consumers (utility_user_id, consumer_number, full_name, service_address)
SELECT id, 'MUS-20481', 'Jordan Taylor', '1847 Cedar Ridge Avenue, Fairview, OH 44126'
FROM utility_users
WHERE username = 'demo.consumer'
ON CONFLICT (consumer_number) DO NOTHING;

INSERT INTO utility_connections (
  consumer_id, utility_type, connection_number, meter_number,
  current_reading, consumption, consumption_unit, current_bill
)
SELECT c.id, v.utility_type, v.connection_number, v.meter_number,
       v.current_reading, v.consumption, v.consumption_unit, v.current_bill
FROM utility_consumers c
CROSS JOIN (VALUES
  ('electricity', 'EL-7782-4901', 'EM-4201786', 18429.00, 642.00, 'kWh', 128.42),
  ('water', 'WA-7782-4902', 'WM-6104392', 827.00, 5.80, 'kgal', 64.18)
) AS v(utility_type, connection_number, meter_number, current_reading, consumption, consumption_unit, current_bill)
WHERE c.consumer_number = 'MUS-20481'
ON CONFLICT (consumer_id, utility_type) DO NOTHING;

WITH tariff AS (
  SELECT *
  FROM (VALUES
    ('electricity', 128.42::NUMERIC, 113.90::NUMERIC, 121.20::NUMERIC),
    ('water', 64.18::NUMERIC, 58.75::NUMERIC, 61.10::NUMERIC)
  ) AS values_table(utility_type, current_amount, previous_amount, older_amount)
),
periods AS (
  SELECT
    0 AS month_offset,
    date_trunc('month', CURRENT_DATE)::DATE AS period_start,
    CURRENT_DATE AS period_end,
    (CURRENT_DATE + 14)::DATE AS due_date,
    'due'::VARCHAR(16) AS status
  UNION ALL
  SELECT
    1,
    (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::DATE,
    (date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::DATE,
    (CURRENT_DATE - 18)::DATE,
    'paid'::VARCHAR(16)
  UNION ALL
  SELECT
    2,
    (date_trunc('month', CURRENT_DATE) - INTERVAL '2 months')::DATE,
    (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' - INTERVAL '1 day')::DATE,
    (CURRENT_DATE - 48)::DATE,
    'paid'::VARCHAR(16)
)
INSERT INTO utility_bills (
  consumer_id, utility_type, bill_number, billing_period_start,
  billing_period_end, due_date, amount, status
)
SELECT
  c.id,
  tariff.utility_type,
  'MUS-' || upper(substr(tariff.utility_type, 1, 3)) || '-' ||
    to_char(periods.period_start, 'YYYYMM'),
  periods.period_start,
  periods.period_end,
  periods.due_date,
  CASE periods.month_offset
    WHEN 0 THEN tariff.current_amount
    WHEN 1 THEN tariff.previous_amount
    ELSE tariff.older_amount
  END,
  periods.status
FROM utility_consumers c
CROSS JOIN tariff
CROSS JOIN periods
WHERE c.consumer_number = 'MUS-20481'
ON CONFLICT (consumer_id, utility_type, billing_period_start) DO NOTHING;

INSERT INTO utility_payments (
  consumer_id, bill_id, payment_reference, amount,
  payment_method, paid_at, status
)
SELECT
  bill.consumer_id,
  bill.id,
  'DEMO-' || bill.bill_number,
  bill.amount,
  CASE bill.utility_type WHEN 'electricity' THEN 'ACH' ELSE 'Debit card' END,
  (bill.due_date - INTERVAL '2 days')::TIMESTAMPTZ,
  'completed'
FROM utility_bills bill
JOIN utility_consumers consumer ON consumer.id = bill.consumer_id
WHERE consumer.consumer_number = 'MUS-20481'
  AND bill.status = 'paid'
ON CONFLICT (payment_reference) DO NOTHING;

INSERT INTO utility_service_requests (consumer_id, ticket_number, category, description, status)
SELECT id, 'SR-2026-1048', 'Meter reading', 'Please review the latest meter reading for the service address.', 'In progress'
FROM utility_consumers
WHERE consumer_number = 'MUS-20481'
ON CONFLICT (ticket_number) DO NOTHING;