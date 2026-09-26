package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.config.OpenApiConfig;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.PlatformCatalogService;
import com.mybooktimezon.web.dto.request.RolePermissionsUpdateRequest;
import com.mybooktimezon.web.dto.request.SectorWriteRequest;
import com.mybooktimezon.web.dto.response.ModuleDto;
import com.mybooktimezon.web.dto.response.PermissionDto;
import com.mybooktimezon.web.dto.response.PlatformRoleDto;
import com.mybooktimezon.web.dto.response.SectorDto;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/admin/catalog")
@Tag(name = "Platform catalog", description = "Dynamic sectors, modules, roles, and permissions.")
@SecurityRequirement(name = OpenApiConfig.BEARER_AUTH)
@PreAuthorize("hasRole('SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminCatalogController {

    private final PlatformCatalogService platformCatalogService;

    @GetMapping("/sectors")
    public ResponseEntity<ResponseMessage<List<SectorDto>>> sectors(
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        List<SectorDto> data = platformCatalogService.listAllSectors(principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Sectors", data));
    }

    @PostMapping("/sectors")
    public ResponseEntity<ResponseMessage<SectorDto>> createSector(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @Valid @RequestBody SectorWriteRequest request) {
        SectorDto data = platformCatalogService.createSector(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseMessageFactory.success(HttpStatus.CREATED, "Sector created", data));
    }

    @PutMapping("/sectors/{sectorId}")
    public ResponseEntity<ResponseMessage<SectorDto>> updateSector(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable UUID sectorId,
            @Valid @RequestBody SectorWriteRequest request) {
        SectorDto data = platformCatalogService.updateSector(principal, sectorId, request);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Sector updated", data));
    }

    @GetMapping("/modules")
    public ResponseEntity<ResponseMessage<List<ModuleDto>>> modules(
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        List<ModuleDto> data = platformCatalogService.listModules(principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Modules", data));
    }

    @GetMapping("/permissions")
    public ResponseEntity<ResponseMessage<List<PermissionDto>>> permissions(
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        List<PermissionDto> data = platformCatalogService.listPermissions(principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Permissions", data));
    }

    @GetMapping("/roles")
    public ResponseEntity<ResponseMessage<List<PlatformRoleDto>>> roles(
            @AuthenticationPrincipal SecurityUserPrincipal principal) {
        List<PlatformRoleDto> data = platformCatalogService.listRoles(principal);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Roles", data));
    }

    @GetMapping("/roles/{roleId}")
    public ResponseEntity<ResponseMessage<PlatformRoleDto>> role(
            @AuthenticationPrincipal SecurityUserPrincipal principal, @PathVariable UUID roleId) {
        PlatformRoleDto data = platformCatalogService.getRole(principal, roleId);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Role", data));
    }

    @PutMapping("/roles/{roleId}/permissions")
    public ResponseEntity<ResponseMessage<PlatformRoleDto>> setRolePermissions(
            @AuthenticationPrincipal SecurityUserPrincipal principal,
            @PathVariable UUID roleId,
            @Valid @RequestBody RolePermissionsUpdateRequest request) {
        PlatformRoleDto data =
                platformCatalogService.setRolePermissions(principal, roleId, request.getPermissionCodes());
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Role permissions updated", data));
    }
}
