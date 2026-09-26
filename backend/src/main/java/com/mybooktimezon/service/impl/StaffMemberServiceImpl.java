package com.mybooktimezon.service.impl;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.common.exception.ResourceNotFoundException;
import com.mybooktimezon.common.util.PhoneUtils;
import com.mybooktimezon.common.util.WorkingHoursHelper;
import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.entity.ClinicMembership;
import com.mybooktimezon.domain.entity.StaffMember;
import com.mybooktimezon.domain.entity.UserAccount;
import com.mybooktimezon.domain.enums.ClinicMembershipRole;
import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.domain.enums.UserStatus;
import com.mybooktimezon.repository.ClinicMembershipRepository;
import com.mybooktimezon.repository.ClinicRepository;
import com.mybooktimezon.repository.StaffMemberRepository;
import com.mybooktimezon.repository.UserAccountRepository;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.StaffMemberService;
import com.mybooktimezon.service.TenantPolicyService;
import com.mybooktimezon.web.dto.request.StaffMemberWriteRequest;
import com.mybooktimezon.web.dto.response.StaffMemberResponseDto;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StaffMemberServiceImpl implements StaffMemberService {

    private final StaffMemberRepository staffMemberRepository;
    private final ClinicRepository clinicRepository;
    private final UserAccountRepository userAccountRepository;
    private final ClinicMembershipRepository clinicMembershipRepository;
    private final TenantPolicyService tenantPolicyService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<StaffMemberResponseDto> list(UUID clinicId, SecurityUserPrincipal principal) {
        tenantPolicyService.requireTenantMembership(principal, clinicId);
        return staffMemberRepository.findByClinic_IdOrderByDisplayNameAsc(clinicId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public StaffMemberResponseDto create(UUID clinicId, SecurityUserPrincipal principal, StaffMemberWriteRequest request) {
        tenantPolicyService.requirePermission(principal, clinicId, "tenant.staff.write");
        Clinic clinic = loadClinic(clinicId);
        tenantPolicyService.assertTenantCanOperate(clinic);
        if (request.getDisplayName() == null || request.getDisplayName().isBlank()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Display name is required");
        }
        StaffMember s = new StaffMember();
        s.setClinic(clinic);
        s.setDisplayName(request.getDisplayName().trim());
        s.setSpecialization(request.getSpecialization() != null ? request.getSpecialization().trim() : null);
        s.setWorkingHoursJson(
                request.getWorkingHoursJson() != null && !request.getWorkingHoursJson().isBlank()
                        ? request.getWorkingHoursJson()
                        : WorkingHoursHelper.defaultWeeklyJson());
        s.setEmail(normalizeEmail(request.getEmail()));
        s.setMobile(resolveMobileOrNull(request.getMobile()));
        assertUniqueStaffContact(clinicId, null, s.getEmail(), s.getMobile());
        s.setGender(request.getGender() != null && !request.getGender().isBlank()
                ? request.getGender().trim().toUpperCase()
                : null);
        s.setParallelBookingsMax(
                request.getParallelBookingsMax() != null
                        ? Math.min(50, Math.max(1, request.getParallelBookingsMax()))
                        : 1);
        s.setPhotoUrl(request.getPhotoUrl() != null ? request.getPhotoUrl().trim() : null);
        s.setActive(request.getActive() == null || request.getActive());
        if (request.getLoginPassword() != null && !request.getLoginPassword().isBlank()) {
            linkOrCreateStaffLogin(clinic, s, request.getLoginPassword());
        }
        staffMemberRepository.save(s);
        return toDto(s);
    }

    @Override
    @Transactional
    public StaffMemberResponseDto update(
            UUID clinicId, UUID staffId, SecurityUserPrincipal principal, StaffMemberWriteRequest request) {
        Clinic clinic = loadClinic(clinicId);
        tenantPolicyService.assertTenantCanOperate(clinic);
        StaffMember s =
                staffMemberRepository
                        .findByIdAndClinic_Id(staffId, clinicId)
                        .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        boolean owner = tenantPolicyService.isTenantOwnerInClinic(principal, clinicId)
                || tenantPolicyService.hasPermission(principal, "platform.admin");
        boolean self =
                s.getUser() != null
                        && principal.getUserId() != null
                        && s.getUser().getId().equals(principal.getUserId());

        if (!owner && !self) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You cannot edit this staff profile");
        }

        if (owner) {
            if (request.getDisplayName() != null) {
                s.setDisplayName(request.getDisplayName().trim());
            }
            if (request.getSpecialization() != null) {
                s.setSpecialization(request.getSpecialization().trim());
            }
            if (request.getActive() != null) {
                s.setActive(request.getActive());
            }
            if (request.getEmail() != null) {
                s.setEmail(normalizeEmail(request.getEmail()));
            }
            if (request.getMobile() != null) {
                s.setMobile(
                        request.getMobile().trim().isEmpty()
                                ? null
                                : resolveMobileOrNull(request.getMobile()));
            }
            if (request.getPhotoUrl() != null) {
                s.setPhotoUrl(request.getPhotoUrl().trim().isEmpty() ? null : request.getPhotoUrl().trim());
            }
            if (request.getGender() != null) {
                s.setGender(request.getGender().trim().isEmpty() ? null : request.getGender().trim().toUpperCase());
            }
            if (request.getParallelBookingsMax() != null) {
                s.setParallelBookingsMax(Math.min(50, Math.max(1, request.getParallelBookingsMax())));
            }
            if (request.getLoginPassword() != null && !request.getLoginPassword().isBlank()) {
                linkOrCreateStaffLogin(clinic, s, request.getLoginPassword());
            }
            assertUniqueStaffContact(clinicId, staffId, s.getEmail(), s.getMobile());
        }

        // Owners and the staff member themselves can update availability
        if (request.getWorkingHoursJson() != null) {
            s.setWorkingHoursJson(request.getWorkingHoursJson());
        }

        staffMemberRepository.save(s);
        return toDto(s);
    }

    private void linkOrCreateStaffLogin(Clinic clinic, StaffMember s, String rawPassword) {
        if (s.getEmail() == null || s.getEmail().isBlank()) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST, "Email is required to create a staff login");
        }
        if (rawPassword.length() < 8) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Login password must be at least 8 characters");
        }
        String email = s.getEmail().trim().toLowerCase();
        UserAccount user =
                userAccountRepository
                        .findByEmailIgnoreCase(email)
                        .orElseGet(
                                () -> {
                                    UserAccount u = new UserAccount();
                                    u.setEmail(email);
                                    u.setName(s.getDisplayName());
                                    u.setPasswordHash(passwordEncoder.encode(rawPassword));
                                    u.setRole(UserRole.STAFF);
                                    u.setStatus(UserStatus.ACTIVE);
                                    u.setMobile(s.getMobile());
                                    return userAccountRepository.save(u);
                                });
        if (user.getRole() != UserRole.STAFF && user.getRole() != UserRole.TENANT_ADMIN) {
            throw new BusinessException(
                    HttpStatus.CONFLICT, "That email belongs to a different account type");
        }
        // Refresh password when owner re-issues login for existing STAFF
        if (user.getRole() == UserRole.STAFF) {
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            if (user.getName() == null || user.getName().isBlank()) {
                user.setName(s.getDisplayName());
            }
            userAccountRepository.save(user);
        }
        if (!clinicMembershipRepository.existsByUser_IdAndClinic_Id(user.getId(), clinic.getId())) {
            ClinicMembership m = new ClinicMembership();
            m.setClinic(clinic);
            m.setUser(user);
            m.setClinicRole(ClinicMembershipRole.STAFF);
            clinicMembershipRepository.save(m);
        }
        s.setUser(user);
    }

    private static String normalizeEmail(String raw) {
        if (raw == null) {
            return null;
        }
        String t = raw.trim();
        return t.isEmpty() ? null : t.toLowerCase();
    }

    private static String resolveMobileOrNull(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return PhoneUtils.normalizeIndianMobile(raw)
                .orElseThrow(
                        () ->
                                new BusinessException(
                                        HttpStatus.BAD_REQUEST,
                                        "Mobile must be a valid 10-digit Indian number (or leave blank)."));
    }

    private void assertUniqueStaffContact(UUID clinicId, UUID excludeStaffId, String email, String mobileDigits) {
        if (email != null && !email.isBlank()) {
            boolean dup =
                    excludeStaffId == null
                            ? staffMemberRepository.existsByClinic_IdAndEmailIgnoreCase(clinicId, email)
                            : staffMemberRepository.existsByClinic_IdAndEmailIgnoreCaseAndIdNot(
                                    clinicId, email, excludeStaffId);
            if (dup) {
                throw new BusinessException(
                        HttpStatus.CONFLICT,
                        "Another team member already uses this email for your business.");
            }
        }
        if (mobileDigits != null && !mobileDigits.isBlank()) {
            boolean dup =
                    excludeStaffId == null
                            ? staffMemberRepository.existsByClinic_IdAndMobile(clinicId, mobileDigits)
                            : staffMemberRepository.existsByClinic_IdAndMobileAndIdNot(
                                    clinicId, mobileDigits, excludeStaffId);
            if (dup) {
                throw new BusinessException(
                        HttpStatus.CONFLICT,
                        "Another team member already uses this mobile number for your business.");
            }
        }
    }

    private Clinic loadClinic(UUID clinicId) {
        return clinicRepository.findById(clinicId).orElseThrow(() -> new ResourceNotFoundException("Clinic not found"));
    }

    private StaffMemberResponseDto toDto(StaffMember s) {
        return StaffMemberResponseDto.builder()
                .id(s.getId())
                .displayName(s.getDisplayName())
                .specialization(s.getSpecialization())
                .workingHoursJson(s.getWorkingHoursJson())
                .email(s.getEmail())
                .mobile(s.getMobile())
                .gender(s.getGender())
                .parallelBookingsMax(s.getParallelBookingsMax())
                .photoUrl(s.getPhotoUrl())
                .active(s.isActive())
                .hasLogin(s.getUser() != null)
                .linkedUserId(s.getUser() != null ? s.getUser().getId() : null)
                .build();
    }
}
