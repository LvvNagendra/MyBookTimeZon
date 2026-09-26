-- Phase 0: dynamic sectors, feature modules, roles, and permissions.
-- Legacy UserRole / BusinessType enum codes are seeded 1:1 so booking & JWT stay compatible.

CREATE TABLE IF NOT EXISTS platform_sectors (
    id UUID NOT NULL PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    label VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_modules (
    id UUID NOT NULL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    label VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS sector_modules (
    sector_id UUID NOT NULL REFERENCES platform_sectors (id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES platform_modules (id) ON DELETE CASCADE,
    enabled_by_default BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (sector_id, module_id)
);

CREATE TABLE IF NOT EXISTS platform_permissions (
    id UUID NOT NULL PRIMARY KEY,
    code VARCHAR(96) NOT NULL UNIQUE,
    label VARCHAR(160) NOT NULL,
    description VARCHAR(500),
    module_code VARCHAR(64),
    scope VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_roles (
    id UUID NOT NULL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    label VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    scope VARCHAR(32) NOT NULL,
    system_role BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES platform_roles (id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES platform_permissions (id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ---------- sectors (match BusinessType) ----------
INSERT INTO platform_sectors (id, code, label, description, active, sort_order, created_at, updated_at) VALUES
(CAST('a1000001-0001-0001-0001-000000000001' AS UUID), 'CLINIC', 'Clinic / medical', 'Medical & clinical practices', TRUE, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a1000001-0001-0001-0001-000000000002' AS UUID), 'SALON', 'Salon', 'Hair & beauty salons', TRUE, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a1000001-0001-0001-0001-000000000003' AS UUID), 'SPA', 'Spa', 'Spa & wellness centers', TRUE, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a1000001-0001-0001-0001-000000000004' AS UUID), 'FITNESS', 'Fitness / gym', 'Fitness studios', TRUE, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a1000001-0001-0001-0001-000000000005' AS UUID), 'GYM', 'Gym', 'Gym locations', TRUE, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a1000001-0001-0001-0001-000000000006' AS UUID), 'WELLNESS', 'Wellness', 'Wellness practices', TRUE, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a1000001-0001-0001-0001-000000000007' AS UUID), 'COACHING', 'Coach / trainer', 'Coaching businesses', TRUE, 70, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a1000001-0001-0001-0001-000000000008' AS UUID), 'BEAUTY', 'Beauty studio', 'Beauty studios', TRUE, 80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a1000001-0001-0001-0001-000000000009' AS UUID), 'OTHER', 'Other business', 'Other service businesses', TRUE, 90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- ---------- modules ----------
INSERT INTO platform_modules (id, code, label, description, active, created_at, updated_at) VALUES
(CAST('a2000001-0001-0001-0001-000000000001' AS UUID), 'booking', 'Smart Booking', 'Appointments, slots, calendar', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000002' AS UUID), 'staff', 'Staff & Shifts', 'Roster, schedules, commissions', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000003' AS UUID), 'payments', 'Payments & POS', 'Online pay, deposits, cash ledger', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000004' AS UUID), 'crm', 'CRM & Clients', 'Customer history, LTV, preferences', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000005' AS UUID), 'analytics', 'Analytics', 'Business performance dashboards', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000006' AS UUID), 'inventory', 'Inventory', 'Products & consumables', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000007' AS UUID), 'portfolio', 'Portfolio & Gallery', 'Stylist showcase galleries', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000008' AS UUID), 'trending', 'Trending Looks', 'Salon-curated style trends', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000009' AS UUID), 'packages', 'Memberships & Packages', 'Prepaid packages & loyalty', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000010' AS UUID), 'notifications', 'Notifications', 'Email, SMS, WhatsApp, push', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000011' AS UUID), 'beauty_coach', 'Beauty Coach AI', 'AI coach & hair suggest', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000012' AS UUID), 'ehr', 'Health Records', 'Encrypted clinical notes (clinic)', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000013' AS UUID), 'prescriptions', 'Prescriptions & E-Notes', 'Digital Rx and consultation forms', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000014' AS UUID), 'telehealth', 'Teleconsultation', 'WebRTC video consults', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000015' AS UUID), 'queue', 'Token & Queue', 'Walk-in waitlist management', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a2000001-0001-0001-0001-000000000016' AS UUID), 'platform_admin', 'Platform Admin', 'Super-admin tenant & catalog ops', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- Shared modules for all active sectors
INSERT INTO sector_modules (sector_id, module_id, enabled_by_default)
SELECT s.id, m.id, TRUE
FROM platform_sectors s
CROSS JOIN platform_modules m
WHERE m.code IN ('booking', 'staff', 'payments', 'crm', 'analytics', 'notifications', 'beauty_coach')
ON CONFLICT DO NOTHING;

-- Salon / beauty / spa extras
INSERT INTO sector_modules (sector_id, module_id, enabled_by_default)
SELECT s.id, m.id, TRUE
FROM platform_sectors s
CROSS JOIN platform_modules m
WHERE s.code IN ('SALON', 'SPA', 'BEAUTY')
  AND m.code IN ('inventory', 'portfolio', 'trending', 'packages')
ON CONFLICT DO NOTHING;

-- Clinic extras
INSERT INTO sector_modules (sector_id, module_id, enabled_by_default)
SELECT s.id, m.id, TRUE
FROM platform_sectors s
CROSS JOIN platform_modules m
WHERE s.code = 'CLINIC'
  AND m.code IN ('ehr', 'prescriptions', 'telehealth', 'queue')
ON CONFLICT DO NOTHING;

-- Fitness / gym / wellness / coaching extras
INSERT INTO sector_modules (sector_id, module_id, enabled_by_default)
SELECT s.id, m.id, TRUE
FROM platform_sectors s
CROSS JOIN platform_modules m
WHERE s.code IN ('FITNESS', 'GYM', 'WELLNESS', 'COACHING', 'OTHER')
  AND m.code IN ('portfolio', 'packages')
ON CONFLICT DO NOTHING;

-- ---------- permissions ----------
INSERT INTO platform_permissions (id, code, label, description, module_code, scope, created_at, updated_at) VALUES
(CAST('a3000001-0001-0001-0001-000000000001' AS UUID), 'platform.admin', 'Platform administer', 'Full super-admin access', 'platform_admin', 'PLATFORM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000002' AS UUID), 'platform.tenants.manage', 'Manage tenants', 'Create/suspend tenants', 'platform_admin', 'PLATFORM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000003' AS UUID), 'platform.catalog.manage', 'Manage catalog', 'Sectors, modules, roles', 'platform_admin', 'PLATFORM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000010' AS UUID), 'tenant.settings.write', 'Edit business settings', 'Update clinic profile', 'booking', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000011' AS UUID), 'tenant.services.write', 'Manage services', 'CRUD service offerings', 'booking', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000012' AS UUID), 'tenant.staff.write', 'Manage staff', 'CRUD staff roster', 'staff', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000013' AS UUID), 'tenant.bookings.read', 'View bookings', 'List appointments', 'booking', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000014' AS UUID), 'tenant.bookings.write', 'Manage bookings', 'Cancel/reassign/complete', 'booking', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000015' AS UUID), 'tenant.payments.write', 'Manage payments', 'SaaS & POS payments', 'payments', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000016' AS UUID), 'tenant.trending.write', 'Manage trending styles', 'Salon looks CRUD', 'trending', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000017' AS UUID), 'tenant.crm.read', 'View customers', 'CRM read access', 'crm', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000018' AS UUID), 'tenant.analytics.read', 'View analytics', 'Dashboards', 'analytics', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000019' AS UUID), 'tenant.inventory.write', 'Manage inventory', 'Products & stock', 'inventory', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000020' AS UUID), 'tenant.portfolio.write', 'Manage portfolio', 'Gallery uploads', 'portfolio', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000021' AS UUID), 'tenant.ehr.write', 'Clinical notes', 'EHR write', 'ehr', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000022' AS UUID), 'tenant.prescriptions.write', 'Prescriptions', 'E-Rx write', 'prescriptions', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000023' AS UUID), 'tenant.telehealth.write', 'Telehealth', 'Start video consults', 'telehealth', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000024' AS UUID), 'tenant.queue.write', 'Queue management', 'Walk-in tokens', 'queue', 'TENANT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000030' AS UUID), 'customer.bookings.read', 'Own bookings', 'Customer appointment list', 'booking', 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a3000001-0001-0001-0001-000000000031' AS UUID), 'customer.profile.write', 'Own profile', 'Update customer profile', 'crm', 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- ---------- roles (match UserRole / ClinicMembershipRole) ----------
INSERT INTO platform_roles (id, code, label, description, scope, system_role, active, created_at, updated_at) VALUES
(CAST('a4000001-0001-0001-0001-000000000001' AS UUID), 'SUPER_ADMIN', 'Super Admin', 'Platform operator', 'PLATFORM', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a4000001-0001-0001-0001-000000000002' AS UUID), 'TENANT_ADMIN', 'Business Owner', 'Tenant owner / manager', 'TENANT', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a4000001-0001-0001-0001-000000000003' AS UUID), 'CLINIC_ADMIN', 'Clinic Admin', 'Alias of tenant owner', 'TENANT', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a4000001-0001-0001-0001-000000000004' AS UUID), 'STAFF', 'Staff', 'Stylist / doctor / employee', 'TENANT', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(CAST('a4000001-0001-0001-0001-000000000005' AS UUID), 'CUSTOMER', 'Customer', 'End customer', 'CUSTOMER', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- SUPER_ADMIN → all platform perms + all tenant perms (bypass also in code)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM platform_roles r CROSS JOIN platform_permissions p
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- TENANT_ADMIN / CLINIC_ADMIN → all TENANT scope
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM platform_roles r CROSS JOIN platform_permissions p
WHERE r.code IN ('TENANT_ADMIN', 'CLINIC_ADMIN') AND p.scope = 'TENANT'
ON CONFLICT DO NOTHING;

-- STAFF → bookings + limited
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM platform_roles r
JOIN platform_permissions p ON p.code IN (
  'tenant.bookings.read', 'tenant.bookings.write', 'tenant.crm.read', 'tenant.queue.write',
  'tenant.ehr.write', 'tenant.prescriptions.write', 'tenant.telehealth.write', 'tenant.portfolio.write'
)
WHERE r.code = 'STAFF'
ON CONFLICT DO NOTHING;

-- CUSTOMER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM platform_roles r
JOIN platform_permissions p ON p.code IN ('customer.bookings.read', 'customer.profile.write')
WHERE r.code = 'CUSTOMER'
ON CONFLICT DO NOTHING;
