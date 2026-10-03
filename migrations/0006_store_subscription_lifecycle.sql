-- Extend the existing users entitlement row; do not create a second live
-- subscription table. Store notification rows are only an idempotency ledger.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_start_date timestamp,
  ADD COLUMN IF NOT EXISTS subscription_product_id text,
  ADD COLUMN IF NOT EXISTS subscription_transaction_id text,
  ADD COLUMN IF NOT EXISTS subscription_auto_renew boolean,
  ADD COLUMN IF NOT EXISTS subscription_verified_at timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS users_google_play_purchase_token_uq
  ON users (google_play_purchase_token)
  WHERE google_play_purchase_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_apple_original_transaction_id_uq
  ON users (apple_original_transaction_id)
  WHERE apple_original_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_store_transaction_id_uq
  ON users (subscription_platform, subscription_transaction_id)
  WHERE subscription_transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS subscription_notification_events (
  id serial PRIMARY KEY,
  platform text NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT subscription_notification_events_platform_event_uq
    UNIQUE (platform, event_id)
);