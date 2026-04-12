-- Salon-curated trending cuts / looks for public booking pages (scoped by clinic_id).

CREATE TABLE IF NOT EXISTS clinic_trending_styles (
    id UUID NOT NULL PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    tagline VARCHAR(500),
    image_url VARCHAR(1024),
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clinic_trending_styles_clinic ON clinic_trending_styles (clinic_id, active, sort_order);
