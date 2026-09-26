package com.mybooktimezon.service.impl;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.common.exception.ResourceNotFoundException;
import com.mybooktimezon.common.util.PhoneUtils;
import com.mybooktimezon.config.SaaSProperties;
import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.entity.ClinicMembership;
import com.mybooktimezon.domain.entity.ServiceOffering;
import com.mybooktimezon.domain.entity.StaffMember;
import com.mybooktimezon.domain.entity.UserAccount;
import com.mybooktimezon.domain.enums.ClinicMembershipRole;
import com.mybooktimezon.domain.enums.LedgerPaymentPurpose;
import com.mybooktimezon.domain.enums.PaymentStatus;
import com.mybooktimezon.domain.enums.SubscriptionPlan;
import com.mybooktimezon.domain.enums.SubscriptionStatus;
import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.domain.enums.UserStatus;
import com.mybooktimezon.repository.AppointmentRepository;
import com.mybooktimezon.repository.ClinicMembershipRepository;
import com.mybooktimezon.repository.ClinicRepository;
import com.mybooktimezon.repository.PaymentLedgerRepository;
import com.mybooktimezon.repository.ServiceOfferingRepository;
import com.mybooktimezon.repository.StaffMemberRepository;
import com.mybooktimezon.repository.UserAccountRepository;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.AdminPlatformService;
import com.mybooktimezon.service.TenantPolicyService;
import com.mybooktimezon.web.dto.request.AdminCreateTenantRequest;
import com.mybooktimezon.web.dto.request.AdminInitialServiceRequest;
import com.mybooktimezon.web.dto.request.AdminInitialStaffRequest;
import com.mybooktimezon.web.dto.response.AdminDashboardDto;
import com.mybooktimezon.web.dto.response.AdminMembershipBriefDto;
import com.mybooktimezon.web.dto.response.AdminMetricPointDto;
import com.mybooktimezon.web.dto.response.AdminServiceBriefDto;
import com.mybooktimezon.web.dto.response.AdminStaffBriefDto;
import com.mybooktimezon.web.dto.response.AdminTenantSnapshotDto;
import com.mybooktimezon.web.dto.response.ClinicResponseDto;
import com.mybooktimezon.web.mapper.ClinicMapper;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminPlatformServiceImpl implements AdminPlatformService {

    private static final Logger log = LogManager.getLogger(AdminPlatformServiceImpl.class);

    private final TenantPolicyService tenantPolicyService;
    private final ClinicRepository clinicRepository;
    private final UserAccountRepository userAccountRepository;
    private final ClinicMembershipRepository clinicMembershipRepository;
    private final PaymentLedgerRepository paymentLedgerRepository;
    private final StaffMemberRepository staffMemberRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final AppointmentRepository appointmentRepository;
    private final ClinicMapper clinicMapper;
    private final SaaSProperties saaSProperties;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardDto dashboard(SecurityUserPrincipal principal) {
        tenantPolicyService.requireSuperAdmin(principal);
        long totalTenants = clinicRepository.count();
        long trial = clinicRepository.countBySubscriptionStatus(SubscriptionStatus.TRIAL);
        long active = clinicRepository.countBySubscriptionStatus(SubscriptionStatus.ACTIVE);
        long suspended =
                clinicRepository.findAll().stream().filter(Clinic::isTenantSuspended).count();
        long owners = userAccountRepository.countByRole(UserRole.TENANT_ADMIN);
        long pendingPlatform =
                paymentLedgerRepository.countByPurposeAndStatus(
                        LedgerPaymentPurpose.PLATFORM_SUBSCRIPTION, PaymentStatus.PENDING);
        long mrrPaise =
                clinicRepository.findAll().stream()
                        .filter(c -> c.getSubscriptionStatus() == SubscriptionStatus.ACTIVE && !c.isTenantSuspended())
                        .mapToLong(this::planToPaise)
                        .sum();
        long totalCustomers = userAccountRepository.countByRole(UserRole.CUSTOMER);
        long totalStaff = staffMemberRepository.count();
        long totalActiveServices = serviceOfferingRepository.countByActiveTrue();
        Instant since7d = Instant.now().minus(7, ChronoUnit.DAYS);
        long appt7d = appointmentRepository.countByStartAtGreaterThanEqual(since7d);
        List<Clinic> allClinics = clinicRepository.findAll();
        long onMap =
                allClinics.stream()
                        .filter(c -> c.getLatitude() != null && c.getLongitude() != null)
                        .count();
        long missingGeo = Math.max(0, totalTenants - onMap);
        long noActiveSvc =
                allClinics.stream()
                        .filter(c -> !c.isTenantSuspended())
                        .filter(c -> serviceOfferingRepository.countByClinic_IdAndActiveTrue(c.getId()) == 0)
                        .count();
        String pulse = buildPlatformPulseNote(missingGeo, noActiveSvc, pendingPlatform, totalTenants);

        List<AdminMetricPointDto> subscriptionMix = List.of(
                point("TRIAL", "Trial", trial),
                point("ACTIVE", "Active", active),
                point("SUSPENDED", "Suspended", suspended),
                point(
                        "OTHER",
                        "Other",
                        Math.max(0, totalTenants - trial - active - suspended)));

        Map<String, Long> typeCounts = new LinkedHashMap<>();
        for (Clinic c : allClinics) {
            String key = c.getBusinessType() != null ? c.getBusinessType().name() : "UNKNOWN";
            typeCounts.merge(key, 1L, Long::sum);
        }
        List<AdminMetricPointDto> businessTypeMix = new ArrayList<>();
        for (Map.Entry<String, Long> e : typeCounts.entrySet()) {
            businessTypeMix.add(point(e.getKey(), titleCase(e.getKey()), e.getValue()));
        }
        if (businessTypeMix.isEmpty()) {
            businessTypeMix.add(point("NONE", "No tenants", 0));
        }

        List<AdminMetricPointDto> appointmentsByDay = buildAppointmentsByDay();

        long geoHealthy = totalTenants == 0 ? 0 : Math.round((onMap * 100.0) / totalTenants);
        long svcHealthy =
                totalTenants == 0
                        ? 0
                        : Math.round(((totalTenants - noActiveSvc) * 100.0) / totalTenants);
        List<AdminMetricPointDto> opsHealth = List.of(
                point("GEO", "Map coverage %", geoHealthy),
                point("SERVICES", "Have services %", svcHealthy),
                point("MRR_K", "Est. MRR (₹k)", Math.round(mrrPaise / 100_000.0)),
                point("APPT7", "Appts (7d)", appt7d));

        return AdminDashboardDto.builder()
                .totalTenants(totalTenants)
                .tenantsInTrial(trial)
                .tenantsActiveSubscription(active)
                .suspendedTenants(suspended)
                .tenantOwnerAccounts(owners)
                .pendingPlatformPayments(pendingPlatform)
                .estimatedMonthlyRecurringPaise(mrrPaise)
                .revenueNote(
                        "MRR is estimated from active tenants × catalog price (Basic ₹"
                                + (saaSProperties.getBasicMonthlyPaise() / 100)
                                + ", Standard ₹"
                                + (saaSProperties.getStandardMonthlyPaise() / 100)
                                + ", Premium ₹"
                                + (saaSProperties.getPremiumMonthlyPaise() / 100)
                                + "). Real Razorpay settlement lives in the gateway dashboard.")
                .totalCustomerAccounts(totalCustomers)
                .totalStaffMembers(totalStaff)
                .totalActiveServiceOfferings(totalActiveServices)
                .appointmentsLast7Days(appt7d)
                .tenantsWithGeoMapped(onMap)
                .tenantsMissingGeo(missingGeo)
                .tenantsWithNoActiveServices(noActiveSvc)
                .platformPulseNote(pulse)
                .subscriptionMix(subscriptionMix)
                .businessTypeMix(businessTypeMix)
                .appointmentsByDay(appointmentsByDay)
                .opsHealth(opsHealth)
                .build();
    }

    private List<AdminMetricPointDto> buildAppointmentsByDay() {
        List<AdminMetricPointDto> days = new ArrayList<>(7);
        var today = Instant.now().atZone(ZoneOffset.UTC).toLocalDate();
        for (int i = 6; i >= 0; i--) {
            var day = today.minusDays(i);
            Instant from = day.atStartOfDay(ZoneOffset.UTC).toInstant();
            Instant to = day.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            long count = appointmentRepository.countByStartAtGreaterThanEqualAndStartAtLessThan(from, to);
            String label = day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            days.add(point(day.toString(), label, count));
        }
        return days;
    }

    private static AdminMetricPointDto point(String key, String label, long value) {
        return AdminMetricPointDto.builder().key(key).label(label).value(value).build();
    }

    private static String titleCase(String raw) {
        if (raw == null || raw.isBlank()) return "Unknown";
        String lower = raw.replace('_', ' ').toLowerCase(Locale.ENGLISH);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }

    private static String buildPlatformPulseNote(
            long missingGeo, long noActiveServices, long pendingPayments, long totalTenants) {
        List<String> parts = new ArrayList<>();
        if (totalTenants > 0 && missingGeo > 0) {
            parts.add(
                    missingGeo
                            + " tenant(s) are not on the discovery map yet — add coordinates in tenant settings for Nearby search.");
        }
        if (noActiveServices > 0) {
            parts.add(
                    noActiveServices
                            + " active tenant(s) still have no bookable services — onboard them with at least one active offering.");
        }
        if (pendingPayments > 0) {
            parts.add(pendingPayments + " SaaS payment(s) pending in the ledger — reconcile in Razorpay when ready.");
        }
        if (parts.isEmpty()) {
            return "Discovery is strongest when salons publish geo pins, services, and staff. Keep trials warm with check-ins from Tenants.";
        }
        return String.join(" ", parts);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClinicResponseDto> listTenants(SecurityUserPrincipal principal) {
        tenantPolicyService.requireSuperAdmin(principal);
        return clinicRepository.findAll().stream().map(clinicMapper::toDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.mybooktimezon.web.dto.response.AdminUserSummaryDto> listUsers(SecurityUserPrincipal principal) {
        tenantPolicyService.requireSuperAdmin(principal);
        return userAccountRepository.findAll().stream()
                .sorted((a, b) -> {
                    Instant ca = a.getCreatedAt();
                    Instant cb = b.getCreatedAt();
                    if (ca == null && cb == null) return 0;
                    if (ca == null) return 1;
                    if (cb == null) return -1;
                    return cb.compareTo(ca);
                })
                .map(
                        u ->
                                com.mybooktimezon.web.dto.response.AdminUserSummaryDto.builder()
                                        .id(u.getId())
                                        .name(u.getName())
                                        .email(u.getEmail())
                                        .mobile(u.getMobile())
                                        .role(u.getRole())
                                        .status(u.getStatus())
                                        .createdAt(u.getCreatedAt())
                                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminTenantSnapshotDto getTenantSnapshot(SecurityUserPrincipal principal, UUID clinicId) {
        tenantPolicyService.requireSuperAdmin(principal);
        Clinic clinic =
                clinicRepository.findById(clinicId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        Instant since30 = Instant.now().minus(30, ChronoUnit.DAYS);
        long appt30 = appointmentRepository.countByClinic_IdAndStartAtGreaterThanEqual(clinicId, since30);
        long activeSvcCount = serviceOfferingRepository.countByClinic_IdAndActiveTrue(clinicId);

        List<AdminStaffBriefDto> staff =
                staffMemberRepository.findByClinic_IdOrderByDisplayNameAsc(clinicId).stream()
                        .map(
                                s ->
                                        AdminStaffBriefDto.builder()
                                                .id(s.getId())
                                                .displayName(s.getDisplayName())
                                                .specialization(s.getSpecialization())
                                                .email(s.getEmail())
                                                .mobile(s.getMobile())
                                                .gender(s.getGender())
                                                .parallelBookingsMax(s.getParallelBookingsMax())
                                                .active(s.isActive())
                                                .build())
                        .toList();

        List<AdminMembershipBriefDto> memberships =
                clinicMembershipRepository.findByClinic_IdOrderByCreatedAtAsc(clinicId).stream()
                        .map(
                                m ->
                                        AdminMembershipBriefDto.builder()
                                                .userName(m.getUser().getName())
                                                .userEmail(m.getUser().getEmail())
                                                .clinicRole(m.getClinicRole())
                                                .build())
                        .toList();

        List<AdminServiceBriefDto> services =
                serviceOfferingRepository.findByClinic_IdOrderByNameAsc(clinicId).stream()
                        .map(
                                s ->
                                        AdminServiceBriefDto.builder()
                                                .id(s.getId())
                                                .name(s.getName())
                                                .category(s.getCategory())
                                                .durationMinutes(s.getDurationMinutes())
                                                .priceCents(s.getPriceCents())
                                                .active(s.isActive())
                                                .build())
                        .toList();

        boolean hasGeo = clinic.getLatitude() != null && clinic.getLongitude() != null;
        boolean hasDisp = clinic.getDisplayLocation() != null && !clinic.getDisplayLocation().isBlank();
        boolean hasSpec = clinic.getSpecialties() != null && !clinic.getSpecialties().isBlank();
        boolean hasSalon = clinic.getSalonPhone() != null && !clinic.getSalonPhone().isBlank();
        boolean hasWh =
                clinic.getWorkingHoursJson() != null
                        && !clinic.getWorkingHoursJson().isBlank()
                        && !"{}".equals(clinic.getWorkingHoursJson().trim());

        return AdminTenantSnapshotDto.builder()
                .clinic(clinicMapper.toDto(clinic))
                .staff(staff)
                .memberships(memberships)
                .services(services)
                .appointmentsLast30Days(appt30)
                .hasGeoPin(hasGeo)
                .hasDisplayLocation(hasDisp)
                .hasSpecialties(hasSpec)
                .hasSalonPhone(hasSalon)
                .hasWorkingHours(hasWh)
                .hasActiveServices(activeSvcCount > 0)
                .build();
    }

    @Override
    @Transactional
    public ClinicResponseDto createTenant(SecurityUserPrincipal principal, AdminCreateTenantRequest request) {
        tenantPolicyService.requireSuperAdmin(principal);
        String slug = request.getSlug().trim().toLowerCase();
        if (!slug.matches("[a-z0-9]+(-[a-z0-9]+)*")) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Slug must use lowercase letters, digits, and single hyphens only (e.g. radiance-studio)");
        }
        if (clinicRepository.existsBySlugIgnoreCase(slug)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Booking URL slug is already in use");
        }
        String ownerEmail = request.getOwnerEmail().trim().toLowerCase();
        if (userAccountRepository.existsByEmailIgnoreCase(ownerEmail)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Owner email is already registered");
        }
        String salonPhone =
                PhoneUtils.normalizeIndianMobile(request.getSalonPhone())
                        .orElseThrow(
                                () ->
                                        new BusinessException(
                                                HttpStatus.BAD_REQUEST,
                                                "Salon phone must be a valid 10-digit Indian mobile number"));
        String ownerMobile =
                PhoneUtils.normalizeIndianMobile(request.getOwnerMobile())
                        .orElseThrow(
                                () ->
                                        new BusinessException(
                                                HttpStatus.BAD_REQUEST,
                                                "Owner mobile must be a valid 10-digit Indian mobile number"));
        if (userAccountRepository.existsByMobile(ownerMobile)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Owner mobile is already registered");
        }
        try {
            UserAccount owner = new UserAccount();
            owner.setEmail(ownerEmail);
            owner.setName(request.getBusinessName().trim());
            owner.setMobile(ownerMobile);
            owner.setPasswordHash(passwordEncoder.encode(request.getOwnerPassword()));
            owner.setRole(UserRole.TENANT_ADMIN);
            owner.setStatus(UserStatus.ACTIVE);
            userAccountRepository.save(owner);

            Clinic clinic = new Clinic();
            clinic.setBusinessName(request.getBusinessName().trim());
            clinic.setSlug(slug);
            clinic.setBusinessType(request.getBusinessType());
            clinic.setSubscriptionStatus(SubscriptionStatus.TRIAL);
            clinic.setTrialEndsAt(Instant.now().plus(saaSProperties.getTrialDays(), ChronoUnit.DAYS));
            clinic.setCity(trimToNull(request.getCity()));
            clinic.setCountry(trimToNull(request.getCountry()));
            clinic.setState(trimToNull(request.getState()));
            clinic.setVillage(trimToNull(request.getVillage()));
            clinic.setDisplayLocation(trimToNull(request.getDisplayLocation()));
            clinic.setAddress(trimToNull(request.getAddress()));
            applyMapPin(clinic, request.getLatitude(), request.getLongitude());
            clinic.setSpecialties(trimToNull(request.getSpecialties()));
            clinic.setSalonPhone(salonPhone);
            clinic.setOwnerMobile(ownerMobile);
            clinic.setOwnerEmail(ownerEmail);
            clinic.setInternalNotes(trimToNull(request.getInternalNotes()));
            clinicRepository.save(clinic);

            ClinicMembership membership = new ClinicMembership();
            membership.setClinic(clinic);
            membership.setUser(owner);
            membership.setClinicRole(ClinicMembershipRole.TENANT_ADMIN);
            clinicMembershipRepository.save(membership);

            if (request.getInitialStaff() != null) {
                createInitialStaffMember(clinic, request.getInitialStaff());
            }
            if (request.getInitialServices() != null) {
                for (AdminInitialServiceRequest svc : request.getInitialServices()) {
                    createInitialServiceOffering(clinic, svc);
                }
            }

            log.info("Admin {} created tenant {} owner {}", principal.getUserId(), slug, ownerEmail);
            return clinicMapper.toDto(clinic);
        } catch (BusinessException ex) {
            throw ex;
        } catch (DataIntegrityViolationException ex) {
            log.warn("Integrity violation creating tenant: {}", ex.getMessage());
            throw new BusinessException(HttpStatus.CONFLICT, "Email, slug, or phone already in use", ex);
        } catch (Exception ex) {
            log.error("Failed to create tenant {}", slug, ex);
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create tenant", ex);
        }
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static void applyMapPin(Clinic clinic, Double latitude, Double longitude) {
        if (latitude == null && longitude == null) {
            return;
        }
        if (latitude == null || longitude == null) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST, "Provide both latitude and longitude for the map pin (or leave both empty)");
        }
        if (!Double.isFinite(latitude) || latitude < -90 || latitude > 90) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Latitude must be between -90 and 90");
        }
        if (!Double.isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Longitude must be between -180 and 180");
        }
        clinic.setLatitude(latitude);
        clinic.setLongitude(longitude);
    }

    private void createInitialStaffMember(Clinic clinic, AdminInitialStaffRequest is) {
        String mobileNorm = null;
        if (is.getMobile() != null && !is.getMobile().isBlank()) {
            mobileNorm =
                    PhoneUtils.normalizeIndianMobile(is.getMobile())
                            .orElseThrow(
                                    () ->
                                            new BusinessException(
                                                    HttpStatus.BAD_REQUEST,
                                                    "Initial staff mobile must be a valid 10-digit Indian mobile number"));
        }
        StaffMember sm = new StaffMember();
        sm.setClinic(clinic);
        sm.setDisplayName(is.getDisplayName().trim());
        sm.setSpecialization(trimToNull(is.getSpecialization()));
        sm.setEmail(trimToNull(is.getEmail()));
        sm.setMobile(mobileNorm);
        String g = trimToNull(is.getGender());
        sm.setGender(g != null ? g.toUpperCase() : null);
        int parallel =
                is.getParallelBookingsMax() != null ? Math.min(50, Math.max(1, is.getParallelBookingsMax())) : 1;
        sm.setParallelBookingsMax(parallel);
        sm.setWorkingHoursJson(
                is.getWorkingHoursJson() != null && !is.getWorkingHoursJson().isBlank()
                        ? is.getWorkingHoursJson()
                        : null);
        sm.setActive(true);
        staffMemberRepository.save(sm);
    }

    private void createInitialServiceOffering(Clinic clinic, AdminInitialServiceRequest req) {
        ServiceOffering s = new ServiceOffering();
        s.setClinic(clinic);
        s.setName(req.getName().trim());
        s.setCategory(trimToNull(req.getCategory()));
        int mins = req.getDurationMinutes() != null ? req.getDurationMinutes() : 45;
        s.setDurationMinutes(Math.min(480, Math.max(5, mins)));
        long cents = req.getPriceCents() != null ? req.getPriceCents() : 0L;
        // Align with tenant rule: bookable services at least ₹100 (10000 paise).
        s.setPriceCents(Math.min(50_000_000L, Math.max(10_000L, cents)));
        s.setActive(true);
        serviceOfferingRepository.save(s);
    }

    @Override
    @Transactional
    public ClinicResponseDto setTenantSuspended(SecurityUserPrincipal principal, UUID clinicId, boolean suspended) {
        tenantPolicyService.requireSuperAdmin(principal);
        Clinic clinic =
                clinicRepository.findById(clinicId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        clinic.setTenantSuspended(suspended);
        if (suspended) {
            clinic.setSubscriptionStatus(SubscriptionStatus.SUSPENDED);
        } else if (clinic.getSubscriptionStatus() == SubscriptionStatus.SUSPENDED) {
            clinic.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        }
        clinicRepository.save(clinic);
        return clinicMapper.toDto(clinic);
    }

    @Override
    @Transactional
    public ClinicResponseDto assignSubscription(
            SecurityUserPrincipal principal,
            UUID clinicId,
            com.mybooktimezon.web.dto.request.AdminAssignSubscriptionRequest request) {
        tenantPolicyService.requireSuperAdmin(principal);
        Clinic clinic =
                clinicRepository.findById(clinicId).orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
        clinic.setSubscriptionPlan(request.getPlan());
        if (request.isActivate()) {
            clinic.setTenantSuspended(false);
            clinic.setSubscriptionStatus(
                    request.getStatus() != null ? request.getStatus() : SubscriptionStatus.ACTIVE);
        } else if (request.getStatus() != null) {
            clinic.setSubscriptionStatus(request.getStatus());
        }
        clinicRepository.save(clinic);
        log.info(
                "Super admin assigned plan {} status {} to tenant {}",
                request.getPlan(),
                clinic.getSubscriptionStatus(),
                clinicId);
        return clinicMapper.toDto(clinic);
    }

    private long planToPaise(Clinic c) {
        SubscriptionPlan p = c.getSubscriptionPlan() != null ? c.getSubscriptionPlan() : SubscriptionPlan.BASIC;
        return switch (p) {
            case BASIC -> saaSProperties.getBasicMonthlyPaise();
            case STANDARD -> saaSProperties.getStandardMonthlyPaise();
            case PREMIUM -> saaSProperties.getPremiumMonthlyPaise();
        };
    }
}
