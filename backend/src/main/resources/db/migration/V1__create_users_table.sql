-- Aligns with JPA entity UserAccount (@Table users) + AuditedEntity.
-- Safe to run before Hibernate; other tables may still be created/updated by ddl-auto.

CREATE TABLE IF NOT EXISTS users (
    id UUID NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile VARCHAR(32),
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
