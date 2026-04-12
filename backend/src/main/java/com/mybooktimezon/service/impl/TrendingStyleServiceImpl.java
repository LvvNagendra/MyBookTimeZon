package com.mybooktimezon.service.impl;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.common.exception.ResourceNotFoundException;
import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.entity.ClinicTrendingStyle;
import com.mybooktimezon.repository.ClinicRepository;
import com.mybooktimezon.repository.ClinicTrendingStyleRepository;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.TenantPolicyService;
import com.mybooktimezon.service.TrendingStyleService;
import com.mybooktimezon.web.dto.request.TrendingStyleWriteRequest;
import com.mybooktimezon.web.dto.response.TrendingStyleResponseDto;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TrendingStyleServiceImpl implements TrendingStyleService {

    private final ClinicTrendingStyleRepository trendingStyleRepository;
    private final ClinicRepository clinicRepository;
    private final TenantPolicyService tenantPolicyService;

    @Override
    @Transactional(readOnly = true)
    public List<TrendingStyleResponseDto> listForTenant(UUID clinicId, SecurityUserPrincipal principal) {
        tenantPolicyService.requireTenantMembership(principal, clinicId);
        return trendingStyleRepository.findByClinic_IdOrderBySortOrderAscCreatedAtAsc(clinicId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrendingStyleResponseDto> listPublicForClinic(UUID clinicId) {
        return trendingStyleRepository.findByClinic_IdAndActiveTrueOrderBySortOrderAscCreatedAtAsc(clinicId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public TrendingStyleResponseDto create(
            UUID clinicId, SecurityUserPrincipal principal, TrendingStyleWriteRequest request) {
        tenantPolicyService.requireTenantOwner(principal, clinicId);
        Clinic clinic = loadClinic(clinicId);
        tenantPolicyService.assertTenantCanOperate(clinic);
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        ClinicTrendingStyle row = new ClinicTrendingStyle();
        row.setClinic(clinic);
        row.setTitle(request.getTitle().trim());
        row.setTagline(request.getTagline() != null ? request.getTagline().trim() : null);
        row.setImageUrl(request.getImageUrl() != null ? request.getImageUrl().trim() : null);
        row.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        row.setActive(request.getActive() == null || request.getActive());
        trendingStyleRepository.save(row);
        return toDto(row);
    }

    @Override
    @Transactional
    public TrendingStyleResponseDto update(
            UUID clinicId, UUID styleId, SecurityUserPrincipal principal, TrendingStyleWriteRequest request) {
        tenantPolicyService.requireTenantOwner(principal, clinicId);
        Clinic clinic = loadClinic(clinicId);
        tenantPolicyService.assertTenantCanOperate(clinic);
        ClinicTrendingStyle row =
                trendingStyleRepository
                        .findByIdAndClinic_Id(styleId, clinicId)
                        .orElseThrow(() -> new ResourceNotFoundException("Trending style not found"));
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            row.setTitle(request.getTitle().trim());
        }
        if (request.getTagline() != null) {
            row.setTagline(request.getTagline().trim());
        }
        if (request.getImageUrl() != null) {
            row.setImageUrl(request.getImageUrl().trim().isEmpty() ? null : request.getImageUrl().trim());
        }
        if (request.getSortOrder() != null) {
            row.setSortOrder(request.getSortOrder());
        }
        if (request.getActive() != null) {
            row.setActive(request.getActive());
        }
        trendingStyleRepository.save(row);
        return toDto(row);
    }

    @Override
    @Transactional
    public void delete(UUID clinicId, UUID styleId, SecurityUserPrincipal principal) {
        tenantPolicyService.requireTenantOwner(principal, clinicId);
        Clinic clinic = loadClinic(clinicId);
        tenantPolicyService.assertTenantCanOperate(clinic);
        ClinicTrendingStyle row =
                trendingStyleRepository
                        .findByIdAndClinic_Id(styleId, clinicId)
                        .orElseThrow(() -> new ResourceNotFoundException("Trending style not found"));
        trendingStyleRepository.delete(row);
    }

    private Clinic loadClinic(UUID clinicId) {
        return clinicRepository.findById(clinicId).orElseThrow(() -> new ResourceNotFoundException("Clinic not found"));
    }

    private TrendingStyleResponseDto toDto(ClinicTrendingStyle s) {
        return TrendingStyleResponseDto.builder()
                .id(s.getId())
                .title(s.getTitle())
                .tagline(s.getTagline())
                .imageUrl(s.getImageUrl())
                .sortOrder(s.getSortOrder())
                .active(s.isActive())
                .build();
    }
}
