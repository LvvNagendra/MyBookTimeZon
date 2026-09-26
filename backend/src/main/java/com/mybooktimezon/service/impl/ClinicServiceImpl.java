package com.mybooktimezon.service.impl;

import java.util.UUID;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.common.exception.ResourceNotFoundException;
import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.repository.ClinicMembershipRepository;
import com.mybooktimezon.repository.ClinicRepository;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.ClinicService;
import com.mybooktimezon.service.TenantPolicyService;
import com.mybooktimezon.web.dto.request.ClinicUpdateRequest;
import com.mybooktimezon.web.dto.response.ClinicResponseDto;
import com.mybooktimezon.web.mapper.ClinicMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClinicServiceImpl implements ClinicService {

    private static final Logger log = LogManager.getLogger(ClinicServiceImpl.class);

    private final ClinicRepository clinicRepository;
    private final ClinicMembershipRepository clinicMembershipRepository;
    private final ClinicMapper clinicMapper;
    
    private final TenantPolicyService tenantPolicyService;

    @Override
    @Transactional(readOnly = true)
    public ClinicResponseDto getBySlug(String slug) {
        try {
            String key = slug.trim().toLowerCase();
            Clinic clinic =
                    clinicRepository
                            .findBySlugIgnoreCase(key)
                            .orElseThrow(() -> new ResourceNotFoundException("Clinic not found for slug: " + key));
            if (clinic.isTenantSuspended()) {
                throw new ResourceNotFoundException("Business not available");
            }
            return clinicMapper.toDto(clinic);
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("getBySlug failed for {}", slug, ex);
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not load clinic", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ClinicResponseDto getByIdForUser(UUID clinicId, SecurityUserPrincipal principal) {
        try {
            assertClinicAccess(principal, clinicId);
            Clinic clinic =
                    clinicRepository
                            .findById(clinicId)
                            .orElseThrow(() -> new ResourceNotFoundException("Clinic not found"));
            return clinicMapper.toDto(clinic);
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("getById failed {} user {}", clinicId, principal.getUserId(), ex);
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not load clinic", ex);
        }
    }

    @Override
    @Transactional
    public ClinicResponseDto updateForUser(
            UUID clinicId, SecurityUserPrincipal principal, ClinicUpdateRequest request) {
        try {
            assertClinicAccess(principal, clinicId);
            Clinic clinic =
                    clinicRepository
                            .findById(clinicId)
                            .orElseThrow(() -> new ResourceNotFoundException("Clinic not found"));
            if (principal.getRole() != UserRole.SUPER_ADMIN) {
                tenantPolicyService.assertTenantCanOperate(clinic);
            }
            clinicMapper.updateClinicFromRequest(request, clinic);
            clinicRepository.save(clinic);
            log.info("Clinic {} updated by user {}", clinicId, principal.getUserId());
            return clinicMapper.toDto(clinic);
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("update clinic failed {}", clinicId, ex);
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not update clinic", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ClinicResponseDto getMyClinic(SecurityUserPrincipal principal) {
        if (principal.getClinicId() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "No clinic context for this account");
        }
        return getByIdForUser(principal.getClinicId(), principal);
    }

    private void assertClinicAccess(SecurityUserPrincipal principal, UUID clinicId) {
        if (principal.getRole() == UserRole.SUPER_ADMIN) {
            return;
        }
        if (!clinicMembershipRepository.existsByUser_IdAndClinic_Id(principal.getUserId(), clinicId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You do not have access to this clinic");
        }
    }
}
