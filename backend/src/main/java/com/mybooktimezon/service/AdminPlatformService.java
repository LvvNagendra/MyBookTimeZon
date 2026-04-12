package com.mybooktimezon.service;

import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.web.dto.request.AdminCreateTenantRequest;
import com.mybooktimezon.web.dto.response.AdminDashboardDto;
import com.mybooktimezon.web.dto.response.AdminTenantSnapshotDto;
import com.mybooktimezon.web.dto.response.ClinicResponseDto;
import java.util.List;
import java.util.UUID;

public interface AdminPlatformService {

    AdminDashboardDto dashboard(SecurityUserPrincipal principal);

    List<ClinicResponseDto> listTenants(SecurityUserPrincipal principal);

    AdminTenantSnapshotDto getTenantSnapshot(SecurityUserPrincipal principal, UUID clinicId);

    ClinicResponseDto createTenant(SecurityUserPrincipal principal, AdminCreateTenantRequest request);

    ClinicResponseDto setTenantSuspended(SecurityUserPrincipal principal, UUID clinicId, boolean suspended);
}
