package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.config.OpenApiConfig;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.AdminPlatformService;
import com.mybooktimezon.web.dto.response.AdminDashboardDto;
import com.mybooktimezon.web.dto.response.AdminTenantSnapshotDto;
import com.mybooktimezon.web.dto.response.ClinicResponseDto;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import com.mybooktimezon.web.dto.request.AdminCreateTenantRequest;

@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/admin")
@Tag(name = "Super admin", description = "Platform operator: tenants, revenue overview, suspension.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminPlatformController {

    private final AdminPlatformService adminPlatformService;

    @GetMapping("/dashboard")
    public ResponseEntity<ResponseMessage<AdminDashboardDto>> dashboard(
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        AdminDashboardDto data = adminPlatformService.dashboard(principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Dashboard", data));
    }

    @GetMapping("/tenants")
    public ResponseEntity<ResponseMessage<List<ClinicResponseDto>>> tenants(
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        List<ClinicResponseDto> data = adminPlatformService.listTenants(principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Tenants", data));
    }

    @GetMapping("/tenants/{clinicId}/snapshot")
    public ResponseEntity<ResponseMessage<AdminTenantSnapshotDto>> tenantSnapshot(
            @AuthenticationPrincipal SecurityUserPrincipal principal, @PathVariable UUID clinicId) {
        AdminTenantSnapshotDto data = adminPlatformService.getTenantSnapshot(principal, clinicId);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Tenant snapshot", data));
    }

    @PostMapping("/tenants")
    public ResponseEntity<ResponseMessage<ClinicResponseDto>> createTenant(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody AdminCreateTenantRequest request) {
        ClinicResponseDto data = adminPlatformService.createTenant(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseMessageFactory.success(HttpStatus.CREATED, "Tenant created", data));
    }

    @PatchMapping("/tenants/{clinicId}/suspended")
    public ResponseEntity<ResponseMessage<ClinicResponseDto>> setSuspended(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable UUID clinicId,
            @RequestParam boolean value) {
        ClinicResponseDto data = adminPlatformService.setTenantSuspended(principal, clinicId, value);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Tenant updated", data));
    }
}
