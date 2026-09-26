package com.mybooktimezon.web.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Value;

/** Super-admin view: one tenant’s roster, catalogue, and profile completeness. */
@Value
@Builder
public class AdminTenantSnapshotDto {
    ClinicResponseDto clinic;
    List<AdminStaffBriefDto> staff;
    List<AdminMembershipBriefDto> memberships;
    List<AdminServiceBriefDto> services;
    long appointmentsLast30Days;
    boolean hasGeoPin;
    boolean hasDisplayLocation;
    boolean hasSpecialties;
    boolean hasSalonPhone;
    boolean hasWorkingHours;
    boolean hasActiveServices;
}
