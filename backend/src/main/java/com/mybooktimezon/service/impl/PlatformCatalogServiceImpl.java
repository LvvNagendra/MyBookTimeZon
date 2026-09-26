package com.mybooktimezon.service.impl;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.domain.entity.PlatformModule;
import com.mybooktimezon.domain.entity.PlatformPermission;
import com.mybooktimezon.domain.entity.PlatformRole;
import com.mybooktimezon.domain.entity.PlatformSector;
import com.mybooktimezon.domain.entity.SectorModule;
import com.mybooktimezon.domain.enums.BusinessType;
import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.repository.PlatformModuleRepository;
import com.mybooktimezon.repository.PlatformPermissionRepository;
import com.mybooktimezon.repository.PlatformRoleRepository;
import com.mybooktimezon.repository.PlatformSectorRepository;
import com.mybooktimezon.repository.SectorModuleRepository;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.PlatformCatalogService;
import com.mybooktimezon.service.TenantPolicyService;
import com.mybooktimezon.web.dto.request.SectorWriteRequest;
import com.mybooktimezon.web.dto.response.ModuleDto;
import com.mybooktimezon.web.dto.response.PermissionDto;
import com.mybooktimezon.web.dto.response.PlatformRoleDto;
import com.mybooktimezon.web.dto.response.SectorDto;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlatformCatalogServiceImpl implements PlatformCatalogService {

    private final PlatformSectorRepository sectorRepository;
    private final PlatformModuleRepository moduleRepository;
    private final SectorModuleRepository sectorModuleRepository;
    private final PlatformPermissionRepository permissionRepository;
    private final PlatformRoleRepository roleRepository;
    private final TenantPolicyService tenantPolicyService;

    @Override
    @Transactional(readOnly = true)
    public List<SectorDto> listActiveSectors() {
        List<PlatformSector> rows = sectorRepository.findByActiveTrueOrderBySortOrderAscLabelAsc();
        if (rows.isEmpty()) {
            return fallbackSectorsFromEnum();
        }
        return rows.stream().map(s -> toSectorDto(s, true)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SectorDto> listAllSectors(SecurityUserPrincipal principal) {
        tenantPolicyService.requirePermission(principal, null, "platform.catalog.manage");
        return sectorRepository.findAllByOrderBySortOrderAscLabelAsc().stream()
                .map(s -> toSectorDto(s, true))
                .toList();
    }

    @Override
    @Transactional
    public SectorDto createSector(SecurityUserPrincipal principal, SectorWriteRequest request) {
        tenantPolicyService.requirePermission(principal, null, "platform.catalog.manage");
        String code = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (sectorRepository.existsByCodeIgnoreCase(code)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Sector code already exists");
        }
        PlatformSector sector = new PlatformSector();
        sector.setCode(code);
        sector.setLabel(request.getLabel().trim());
        sector.setDescription(trimToNull(request.getDescription()));
        sector.setActive(request.getActive() == null || request.getActive());
        sector.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 100);
        sectorRepository.save(sector);
        replaceSectorModules(sector, request.getModuleCodes());
        return toSectorDto(sector, true);
    }

    @Override
    @Transactional
    public SectorDto updateSector(
            SecurityUserPrincipal principal, UUID sectorId, SectorWriteRequest request) {
        tenantPolicyService.requirePermission(principal, null, "platform.catalog.manage");
        PlatformSector sector =
                sectorRepository
                        .findById(sectorId)
                        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Sector not found"));
        if (request.getLabel() != null && !request.getLabel().isBlank()) {
            sector.setLabel(request.getLabel().trim());
        }
        if (request.getDescription() != null) {
            sector.setDescription(trimToNull(request.getDescription()));
        }
        if (request.getActive() != null) {
            sector.setActive(request.getActive());
        }
        if (request.getSortOrder() != null) {
            sector.setSortOrder(request.getSortOrder());
        }
        // code is immutable for system sectors once created (avoid breaking public URLs)
        sectorRepository.save(sector);
        if (request.getModuleCodes() != null) {
            replaceSectorModules(sector, request.getModuleCodes());
        }
        return toSectorDto(sector, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ModuleDto> listModules(SecurityUserPrincipal principal) {
        tenantPolicyService.requirePermission(principal, null, "platform.catalog.manage");
        return moduleRepository.findAllByOrderByLabelAsc().stream().map(this::toModuleDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ModuleDto> listModulesForSectorCode(String sectorCode) {
        if (sectorCode == null || sectorCode.isBlank()) {
            return List.of();
        }
        List<SectorModule> links =
                sectorModuleRepository.findEnabledModulesForSectorCode(sectorCode.trim());
        if (!links.isEmpty()) {
            return links.stream().map(sm -> toModuleDto(sm.getModule())).toList();
        }
        // Fallback: shared core modules when catalog not migrated yet
        return List.of(
                ModuleDto.builder().code("booking").label("Smart Booking").active(true).build(),
                ModuleDto.builder().code("staff").label("Staff & Shifts").active(true).build(),
                ModuleDto.builder().code("payments").label("Payments & POS").active(true).build(),
                ModuleDto.builder().code("crm").label("CRM & Clients").active(true).build(),
                ModuleDto.builder().code("analytics").label("Analytics").active(true).build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermissionDto> listPermissions(SecurityUserPrincipal principal) {
        tenantPolicyService.requirePermission(principal, null, "platform.catalog.manage");
        return permissionRepository.findAllByOrderByCodeAsc().stream().map(this::toPermissionDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlatformRoleDto> listRoles(SecurityUserPrincipal principal) {
        tenantPolicyService.requirePermission(principal, null, "platform.catalog.manage");
        return roleRepository.findAllWithPermissions().stream().map(this::toRoleDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PlatformRoleDto getRole(SecurityUserPrincipal principal, UUID roleId) {
        tenantPolicyService.requirePermission(principal, null, "platform.catalog.manage");
        PlatformRole role =
                roleRepository
                        .findByIdWithPermissions(roleId)
                        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Role not found"));
        return toRoleDto(role);
    }

    @Override
    @Transactional
    public PlatformRoleDto setRolePermissions(
            SecurityUserPrincipal principal, UUID roleId, List<String> permissionCodes) {
        tenantPolicyService.requirePermission(principal, null, "platform.catalog.manage");
        PlatformRole role =
                roleRepository
                        .findByIdWithPermissions(roleId)
                        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Role not found"));
        if (role.isSystemRole() && "SUPER_ADMIN".equalsIgnoreCase(role.getCode())) {
            // allow editing but ensure platform.admin stays
            if (permissionCodes == null || permissionCodes.stream().noneMatch(c -> "platform.admin".equalsIgnoreCase(c))) {
                throw new BusinessException(
                        HttpStatus.BAD_REQUEST, "SUPER_ADMIN must retain platform.admin permission");
            }
        }
        Set<PlatformPermission> next = new HashSet<>();
        if (permissionCodes != null) {
            for (String code : permissionCodes) {
                if (code == null || code.isBlank()) continue;
                PlatformPermission p =
                        permissionRepository
                                .findByCodeIgnoreCase(code.trim())
                                .orElseThrow(
                                        () ->
                                                new BusinessException(
                                                        HttpStatus.BAD_REQUEST, "Unknown permission: " + code));
                next.add(p);
            }
        }
        role.setPermissions(next);
        roleRepository.save(role);
        return toRoleDto(role);
    }

    @Override
    @Transactional(readOnly = true)
    public Set<String> resolvePermissionCodes(UserRole role) {
        if (role == null) {
            return Set.of();
        }
        return resolvePermissionCodes(role.name());
    }

    @Override
    @Transactional(readOnly = true)
    public Set<String> resolvePermissionCodes(String roleCode) {
        if (roleCode == null || roleCode.isBlank()) {
            return Set.of();
        }
        List<String> fromDb = roleRepository.findPermissionCodesByRoleCode(roleCode.trim());
        if (!fromDb.isEmpty()) {
            return new LinkedHashSet<>(fromDb);
        }
        return fallbackPermissions(roleCode.trim().toUpperCase(Locale.ROOT));
    }

    private void replaceSectorModules(PlatformSector sector, List<String> moduleCodes) {
        List<SectorModule> existing = sectorModuleRepository.findBySectorId(sector.getId());
        sectorModuleRepository.deleteAll(existing);
        if (moduleCodes == null || moduleCodes.isEmpty()) {
            return;
        }
        List<SectorModule> next = new ArrayList<>();
        for (String code : moduleCodes) {
            if (code == null || code.isBlank()) continue;
            PlatformModule module =
                    moduleRepository
                            .findByCodeIgnoreCase(code.trim())
                            .orElseThrow(
                                    () ->
                                            new BusinessException(
                                                    HttpStatus.BAD_REQUEST, "Unknown module: " + code));
            SectorModule sm = new SectorModule();
            sm.setSectorId(sector.getId());
            sm.setModuleId(module.getId());
            sm.setEnabledByDefault(true);
            next.add(sm);
        }
        sectorModuleRepository.saveAll(next);
    }

    private SectorDto toSectorDto(PlatformSector sector, boolean includeModules) {
        List<ModuleDto> modules = List.of();
        if (includeModules) {
            modules =
                    sectorModuleRepository.findBySectorIdWithModule(sector.getId()).stream()
                            .filter(SectorModule::isEnabledByDefault)
                            .map(sm -> toModuleDto(sm.getModule()))
                            .toList();
            if (modules.isEmpty()) {
                modules = listModulesForSectorCode(sector.getCode());
            }
        }
        return SectorDto.builder()
                .id(sector.getId())
                .code(sector.getCode())
                .label(sector.getLabel())
                .description(sector.getDescription())
                .active(sector.isActive())
                .sortOrder(sector.getSortOrder())
                .modules(modules)
                .build();
    }

    private ModuleDto toModuleDto(PlatformModule m) {
        return ModuleDto.builder()
                .id(m.getId())
                .code(m.getCode())
                .label(m.getLabel())
                .description(m.getDescription())
                .active(m.isActive())
                .build();
    }

    private PermissionDto toPermissionDto(PlatformPermission p) {
        return PermissionDto.builder()
                .id(p.getId())
                .code(p.getCode())
                .label(p.getLabel())
                .description(p.getDescription())
                .moduleCode(p.getModuleCode())
                .scope(p.getScope())
                .build();
    }

    private PlatformRoleDto toRoleDto(PlatformRole role) {
        List<String> codes =
                role.getPermissions().stream()
                        .map(PlatformPermission::getCode)
                        .sorted()
                        .collect(Collectors.toList());
        return PlatformRoleDto.builder()
                .id(role.getId())
                .code(role.getCode())
                .label(role.getLabel())
                .description(role.getDescription())
                .scope(role.getScope())
                .systemRole(role.isSystemRole())
                .active(role.isActive())
                .permissionCodes(codes)
                .build();
    }

    private List<SectorDto> fallbackSectorsFromEnum() {
        return Arrays.stream(BusinessType.values())
                .map(
                        t ->
                                SectorDto.builder()
                                        .code(t.name())
                                        .label(t.getDisplayLabel())
                                        .active(true)
                                        .sortOrder(0)
                                        .modules(listModulesForSectorCode(t.name()))
                                        .build())
                .toList();
    }

    private Set<String> fallbackPermissions(String roleCode) {
        return switch (roleCode) {
            case "SUPER_ADMIN" -> Set.of(
                    "platform.admin",
                    "platform.tenants.manage",
                    "platform.catalog.manage",
                    "tenant.settings.write",
                    "tenant.services.write",
                    "tenant.staff.write",
                    "tenant.bookings.read",
                    "tenant.bookings.write",
                    "tenant.payments.write",
                    "tenant.trending.write",
                    "tenant.crm.read",
                    "tenant.analytics.read");
            case "TENANT_ADMIN", "CLINIC_ADMIN" -> Set.of(
                    "tenant.settings.write",
                    "tenant.services.write",
                    "tenant.staff.write",
                    "tenant.bookings.read",
                    "tenant.bookings.write",
                    "tenant.payments.write",
                    "tenant.trending.write",
                    "tenant.crm.read",
                    "tenant.analytics.read",
                    "tenant.inventory.write",
                    "tenant.portfolio.write",
                    "tenant.ehr.write",
                    "tenant.prescriptions.write",
                    "tenant.telehealth.write",
                    "tenant.queue.write");
            case "STAFF" -> Set.of(
                    "tenant.bookings.read",
                    "tenant.bookings.write",
                    "tenant.crm.read",
                    "tenant.queue.write",
                    "tenant.ehr.write",
                    "tenant.prescriptions.write",
                    "tenant.telehealth.write",
                    "tenant.portfolio.write");
            case "CUSTOMER" -> Set.of("customer.bookings.read", "customer.profile.write");
            default -> Set.of();
        };
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
