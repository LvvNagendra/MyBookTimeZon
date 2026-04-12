-- Seed platform super admin (BCrypt strength 12, matches BCryptPasswordEncoder(12)).
-- Plain password at migration time: Nani@143
-- Idempotent: skip if email already exists.

INSERT INTO users (id, email, mobile, password_hash, name, role, status, created_at, updated_at)
VALUES (
    CAST('00000001-0001-0001-0001-000000000001' AS UUID),
    'lvvnagendra99@gmail.com',
    NULL,
    '$2b$12$Ylwdvr0zPkouAsSlMWb4eeANZj3fwvKXLZ/IRORj1lU2S/mlufxYG',
    'Super Admin',
    'SUPER_ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;
