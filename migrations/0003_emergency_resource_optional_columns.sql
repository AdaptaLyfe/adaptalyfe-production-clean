-- Older emergency_resources tables lack the optional fields used by the form.
-- This migration is non-destructive and safe to run more than once against the
-- database configured as DATABASE_URL for the Railway staging service.
ALTER TABLE IF EXISTS public.emergency_resources
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS availability_hours varchar,
  ADD COLUMN IF NOT EXISTS is_emergency_only boolean DEFAULT false;
