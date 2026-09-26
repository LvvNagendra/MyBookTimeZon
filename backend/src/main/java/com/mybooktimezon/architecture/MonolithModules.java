package com.mybooktimezon.architecture;

/**
 * Monolithic application with clear module boundaries for a future microservices split.
 *
 * <p>Current deployable: one Spring Boot JAR. Logical modules map 1:1 to future services:
 *
 * <ul>
 *   <li>{@code AUTH} — JWT login/register, roles (SUPER_ADMIN / TENANT_ADMIN=Admin / STAFF=Employee /
 *       CUSTOMER), platform RBAC catalog
 *   <li>{@code TENANT} — Clinic org (tenant_id = clinics.id), logo, hours, location, memberships
 *   <li>{@code WORKFORCE} — Staff/employees, specialization (Doctor/Stylist), availability JSON
 *   <li>{@code CATALOG} — Services (duration drives slot length)
 *   <li>{@code BOOKING} — Slot generation, conflict checks, appointments, CRM from visits
 *   <li>{@code NOTIFY} — Email reminders today; SMS/WhatsApp/Kafka async later
 *   <li>{@code BILLING} — SaaS subscription ledger + optional Razorpay appointment checkout
 * </ul>
 *
 * <p>Every business row is scoped by {@code clinic_id} (tenant). Do not share data across tenants.
 * Redis slot cache and Kafka notifications can plug into BOOKING / NOTIFY without changing the API
 * contract.
 */
public final class MonolithModules {

    public static final String AUTH = "auth";
    public static final String TENANT = "tenant";
    public static final String WORKFORCE = "workforce";
    public static final String CATALOG = "catalog";
    public static final String BOOKING = "booking";
    public static final String NOTIFY = "notify";
    public static final String BILLING = "billing";

    private MonolithModules() {}
}
