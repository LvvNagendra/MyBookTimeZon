package com.mybooktimezon.domain.enums;

public enum UserRole {
    SUPER_ADMIN,
    /** Tenant owner (clinic / salon / fitness business). */
    TENANT_ADMIN,
    STAFF,
    CUSTOMER,
    CLINIC_ADMIN
}
