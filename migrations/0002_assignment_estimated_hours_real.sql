-- Older deployments may still have stored estimated hours as an integer.
-- Preserve existing values while allowing fractional estimates.
ALTER TABLE IF EXISTS public.assignments
  ALTER COLUMN estimated_hours TYPE real
  USING estimated_hours::real;