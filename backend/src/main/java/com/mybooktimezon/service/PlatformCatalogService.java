package com.mybooktimezon.service;

import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.web.dto.request.SectorWriteRequest;
import com.mybooktimezon.web.dto.response.ModuleDto;
import com.mybooktimezon.web.dto.response.PermissionDto;
import com.mybooktimezon.web.dto.response.PlatformRoleDto;
import com.mybooktimezon.web.dto.response.SectorDto;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface PlatformCatalogService {

    List<SectorDto> listActiveSectors();

    List<SectorDto> listAllSectors(SecurityUserPrincipal principal);

    SectorDto createSector(SecurityUserPrincipal principal, SectorWriteRequest request);

    SectorDto updateSector(SecurityUserPrincipal principal, UUID sectorId, SectorWriteRequest request);

    List<ModuleDto> listModules(SecurityUserPrincipal principal);

    List<ModuleDto> listModulesForSectorCode(String sectorCode);

    List<PermissionDto> listPermissions(SecurityUserPrincipal principal);

    List<PlatformRoleDto> listRoles(SecurityUserPrincipal principal);

    PlatformRoleDto getRole(SecurityUserPrincipal principal, UUID roleId);

    PlatformRoleDto setRolePermissions(
            SecurityUserPrincipal principal, UUID roleId, List<String> permissionCodes);

    Set<String> resolvePermissionCodes(UserRole role);

    Set<String> resolvePermissionCodes(String roleCode);
}
