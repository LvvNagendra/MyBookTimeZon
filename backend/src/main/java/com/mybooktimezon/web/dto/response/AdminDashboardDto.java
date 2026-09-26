package com.mybooktimezon.web.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminDashboardDto {
    long totalTenants;
    long tenantsInTrial;
    long tenantsActiveSubscription;
    long suspendedTenants;
    long tenantOwnerAccounts;
    long pendingPlatformPayments;
    long estimatedMonthlyRecurringPaise;
    String revenueNote;

    /** Registered customer accounts (app users in CUSTOMER role). */
    long totalCustomerAccounts;
    /** Bookable staff rows across all tenants. */
    long totalStaffMembers;
    /** Active service catalogue rows (bookable). */
    long totalActiveServiceOfferings;
    /** Appointments starting in the last 7 days (all tenants). */
    long appointmentsLast7Days;
    /** Tenants with latitude & longitude (discoverable on map). */
    long tenantsWithGeoMapped;
    /** Tenants missing coordinates (not on map until they add a pin). */
    long tenantsMissingGeo;
    /** Active tenants with zero active services (onboarding gap). */
    long tenantsWithNoActiveServices;
    /** Short guidance for admins (growth / ops). */
    String platformPulseNote;

    /** Subscription mix for charts (trial / active / suspended / other). */
    List<AdminMetricPointDto> subscriptionMix;
    /** Business-type mix (salon, clinic, …). */
    List<AdminMetricPointDto> businessTypeMix;
    /** Daily appointment volume for the last 7 local UTC days. */
    List<AdminMetricPointDto> appointmentsByDay;
    /** Ops health bars (geo coverage, services, payments). */
    List<AdminMetricPointDto> opsHealth;
}
