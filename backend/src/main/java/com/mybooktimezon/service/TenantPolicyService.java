package com.mybooktimezon.service;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.entity.ClinicMembership;
import com.mybooktimezon.domain.enums.ClinicMembershipRole;
import com.mybooktimezon.domain.enums.SubscriptionStatus;
import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.repository.ClinicMembershipRepository;
import com.mybooktimezon.security.SecurityUserPrincipal;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TenantPolicyService {

    private final ClinicMembershipRepository clinicMembershipRepository;

    public void requireSuperAdmin(SecurityUserPrincipal principal) {
        if (principal.getRole() != UserRole.SUPER_ADMIN) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Super admin only");
        }
    }

    /** Any active membership in the clinic (tenant staff or owner), or super admin. */
    public void requireTenantMembership(SecurityUserPrincipal principal, UUID clinicId) {
        if (principal.getRole() == UserRole.SUPER_ADMIN) {
            return;
        }
        if (!clinicMembershipRepository.existsByUser_IdAndClinic_Id(principal.getUserId(), clinicId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You do not have access to this business");
        }
    }

    public boolean isTenantOwnerInClinic(SecurityUserPrincipal principal, UUID clinicId) {
        if (principal.getRole() == UserRole.SUPER_ADMIN) {
            return true;
        }
        return clinicMembershipRepository
                .findByUser_IdAndClinic_Id(principal.getUserId(), clinicId)
                .map(m -> m.getClinicRole() == ClinicMembershipRole.TENANT_ADMIN)
                .orElse(false);
    }

    public void requireTenantOwner(SecurityUserPrincipal principal, UUID clinicId) {
        if (principal.getRole() == UserRole.SUPER_ADMIN) {
            return;
        }
        if (!isTenantOwnerInClinic(principal, clinicId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Only the business owner can do this");
        }
    }

    public ClinicMembership membershipOrThrow(SecurityUserPrincipal principal, UUID clinicId) {
        requireTenantMembership(principal, clinicId);
        if (principal.getRole() == UserRole.SUPER_ADMIN) {
            return null;
        }
        return clinicMembershipRepository
                .findByUser_IdAndClinic_Id(principal.getUserId(), clinicId)
                .orElseThrow(() -> new BusinessException(HttpStatus.FORBIDDEN, "No membership"));
    }

    /** Block writes when trial ended, suspended, etc. */
    public void assertTenantCanOperate(Clinic clinic) {
        if (clinic.isTenantSuspended()) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "This business account is suspended.");
        }
        if (clinic.getSubscriptionStatus() == SubscriptionStatus.SUSPENDED) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "This business subscription is suspended.");
        }
        if (clinic.getSubscriptionStatus() == SubscriptionStatus.TRIAL
                && clinic.getTrialEndsAt() != null
                && Instant.now().isAfter(clinic.getTrialEndsAt())) {
            throw new BusinessException(
                    HttpStatus.FORBIDDEN, "Free trial has ended. Subscribe to keep using the platform.");
        }
    }
}
