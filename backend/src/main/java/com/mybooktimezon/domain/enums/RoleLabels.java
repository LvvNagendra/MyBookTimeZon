package com.mybooktimezon.domain.enums;

/**
 * Product-facing labels for {@link UserRole}. Persist enum codes for JWT/security; show these in UI.
 *
 * <ul>
 *   <li>TENANT_ADMIN / CLINIC_ADMIN → Business Admin
 *   <li>STAFF → Employee (Doctor / Stylist via specialization)
 *   <li>CUSTOMER → Customer
 *   <li>SUPER_ADMIN → Platform Admin
 * </ul>
 */
public final class RoleLabels {

    private RoleLabels() {}

    public static String displayName(UserRole role) {
        if (role == null) {
            return "User";
        }
        return switch (role) {
            case SUPER_ADMIN -> "Platform Admin";
            case TENANT_ADMIN, CLINIC_ADMIN -> "Business Admin";
            case STAFF -> "Employee";
            case CUSTOMER -> "Customer";
        };
    }

    public static String displayName(String roleCode) {
        if (roleCode == null || roleCode.isBlank()) {
            return "User";
        }
        try {
            return displayName(UserRole.valueOf(roleCode.trim().toUpperCase()));
        } catch (IllegalArgumentException ex) {
            return roleCode;
        }
    }
}
