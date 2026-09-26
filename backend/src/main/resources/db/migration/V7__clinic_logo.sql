-- Business organization: logo for public booking & discovery (URL or compressed data URL).

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS logo_url TEXT;
