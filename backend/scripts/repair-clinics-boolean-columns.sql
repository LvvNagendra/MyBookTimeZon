-- PostgreSQL: repair clinics after failed "add not null boolean" migrate.
-- If columns are missing, add them with defaults first; if they exist with NULLs, backfill then enforce NOT NULL.

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS tenant_suspended boolean;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS online_payments_enabled boolean;

UPDATE clinics SET tenant_suspended = false WHERE tenant_suspended IS NULL;
UPDATE clinics SET online_payments_enabled = false WHERE online_payments_enabled IS NULL;

ALTER TABLE clinics ALTER COLUMN tenant_suspended SET DEFAULT false;
ALTER TABLE clinics ALTER COLUMN tenant_suspended SET NOT NULL;

ALTER TABLE clinics ALTER COLUMN online_payments_enabled SET DEFAULT false;
ALTER TABLE clinics ALTER COLUMN online_payments_enabled SET NOT NULL;
