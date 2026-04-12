package com.mybooktimezon.service.impl;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.common.exception.ResourceNotFoundException;
import com.mybooktimezon.common.util.ClinicGeoHelper;
import com.mybooktimezon.config.RazorpayProperties;
import com.mybooktimezon.domain.entity.Appointment;
import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.entity.PaymentLedger;
import com.mybooktimezon.domain.entity.ServiceOffering;
import com.mybooktimezon.domain.entity.StaffMember;
import com.mybooktimezon.domain.entity.UserAccount;
import com.mybooktimezon.domain.enums.AppointmentStatus;
import com.mybooktimezon.domain.enums.BusinessType;
import com.mybooktimezon.domain.enums.LedgerPaymentPurpose;
import com.mybooktimezon.domain.enums.PaymentStatus;
import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.domain.enums.UserStatus;
import com.mybooktimezon.realtime.SlotEventsPublisher;
import com.mybooktimezon.repository.AppointmentRepository;
import com.mybooktimezon.repository.ClinicRepository;
import com.mybooktimezon.repository.PaymentLedgerRepository;
import com.mybooktimezon.repository.ServiceOfferingRepository;
import com.mybooktimezon.repository.StaffMemberRepository;
import com.mybooktimezon.repository.UserAccountRepository;
import com.mybooktimezon.service.BookingEmailService;
import com.mybooktimezon.service.PublicBookingService;
import com.mybooktimezon.service.TenantPolicyService;
import com.mybooktimezon.service.TrendingStyleService;
import com.mybooktimezon.web.dto.request.PublicBookAppointmentRequest;
import com.mybooktimezon.web.dto.response.AppointmentResponseDto;
import com.mybooktimezon.web.dto.response.BookAppointmentResultDto;
import com.mybooktimezon.web.dto.response.PaymentCheckoutDto;
import com.mybooktimezon.web.dto.response.PublicBusinessPageDto;
import com.mybooktimezon.web.dto.response.ServiceOfferingResponseDto;
import com.mybooktimezon.web.dto.response.StaffMemberResponseDto;
import com.mybooktimezon.web.dto.response.TimeSlotDto;
import com.mybooktimezon.web.dto.response.TrendingStyleResponseDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PublicBookingServiceImpl implements PublicBookingService {

    private final ClinicRepository clinicRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final StaffMemberRepository staffMemberRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserAccountRepository userAccountRepository;
    private final PaymentLedgerRepository paymentLedgerRepository;
    private final TenantPolicyService tenantPolicyService;
    private final PasswordEncoder passwordEncoder;
    private final RazorpayProperties razorpayProperties;
    private final SlotEventsPublisher slotEventsPublisher;
    private final BookingEmailService bookingEmailService;
    private final TrendingStyleService trendingStyleService;

    @Override
    @Transactional(readOnly = true)
    public PublicBusinessPageDto getBusinessPage(BusinessType businessType, String slug) {
        Clinic clinic = resolvePublicClinic(businessType, slug);
        List<ServiceOfferingResponseDto> services =
                serviceOfferingRepository.findByClinic_IdAndActiveTrueOrderByNameAsc(clinic.getId()).stream()
                        .map(
                                s ->
                                        ServiceOfferingResponseDto.builder()
                                                .id(s.getId())
                                                .name(s.getName())
                                                .category(s.getCategory())
                                                .durationMinutes(s.getDurationMinutes())
                                                .priceCents(s.getPriceCents())
                                                .taxRateBps(s.getTaxRateBps())
                                                .description(s.getDescription())
                                                .active(s.isActive())
                                                .build())
                        .toList();
        List<StaffMemberResponseDto> staff =
                staffMemberRepository.findByClinic_IdAndActiveTrueOrderByDisplayNameAsc(clinic.getId()).stream()
                        .map(
                                st ->
                                        StaffMemberResponseDto.builder()
                                                .id(st.getId())
                                                .displayName(st.getDisplayName())
                                                .specialization(st.getSpecialization())
                                                .workingHoursJson(st.getWorkingHoursJson())
                                                .email(st.getEmail())
                                                .mobile(st.getMobile())
                                                .photoUrl(st.getPhotoUrl())
                                                .active(st.isActive())
                                                .build())
                        .toList();
        List<TrendingStyleResponseDto> trending = trendingStyleService.listPublicForClinic(clinic.getId());
        return PublicBusinessPageDto.builder()
                .clinicId(clinic.getId())
                .businessName(clinic.getBusinessName())
                .slug(clinic.getSlug())
                .businessType(clinic.getBusinessType())
                .address(clinic.getAddress())
                .city(clinic.getCity())
                .country(clinic.getCountry())
                .state(clinic.getState())
                .village(clinic.getVillage())
                .displayLocation(ClinicGeoHelper.resolveDisplayLocation(clinic))
                .latitude(clinic.getLatitude())
                .longitude(clinic.getLongitude())
                .services(services)
                .staff(staff)
                .trendingStyles(trending)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeSlotDto> getSlots(
            BusinessType businessType, String slug, LocalDate date, UUID serviceId, UUID staffId) {
        Clinic clinic = resolvePublicClinic(businessType, slug);
        ServiceOffering service =
                serviceOfferingRepository
                        .findByIdAndClinic_Id(serviceId, clinic.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        staffMemberRepository
                .findByIdAndClinic_Id(staffId, clinic.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        ZoneId zone = ZoneId.of(clinic.getTimezone() != null ? clinic.getTimezone() : "Asia/Kolkata");
        List<TimeSlotDto> out = new ArrayList<>();
        for (int h = 9; h <= 16; h++) {
            Instant start = date.atTime(h, 0).atZone(zone).toInstant();
            Instant end = start.plus(service.getDurationMinutes(), ChronoUnit.MINUTES);
            boolean taken =
                    appointmentRepository.existsOverlapping(
                            staffId, start, end, AppointmentStatus.CANCELLED);
            out.add(TimeSlotDto.builder().startAt(start).endAt(end).available(!taken).build());
        }
        return out;
    }

    @Override
    @Transactional
    public BookAppointmentResultDto book(BusinessType businessType, String slug, PublicBookAppointmentRequest request) {
        Clinic clinic = resolvePublicClinic(businessType, slug);
        tenantPolicyService.assertTenantCanOperate(clinic);
        ServiceOffering service =
                serviceOfferingRepository
                        .findByIdAndClinic_Id(request.getServiceId(), clinic.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Service not found"));
        StaffMember staff =
                staffMemberRepository
                        .findByIdAndClinic_Id(request.getStaffId(), clinic.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        Instant start = request.getStartAt();
        Instant end = start.plus(service.getDurationMinutes(), ChronoUnit.MINUTES);
        if (appointmentRepository.existsOverlapping(
                staff.getId(), start, end, AppointmentStatus.CANCELLED)) {
            throw new BusinessException(HttpStatus.CONFLICT, "That time was just taken. Pick another slot.");
        }
        UserAccount customer = findOrCreateCustomer(request);
        Appointment a = new Appointment();
        a.setClinic(clinic);
        a.setCustomer(customer);
        a.setStaff(staff);
        a.setService(service);
        a.setStartAt(start);
        a.setEndAt(end);
        a.setStatus(AppointmentStatus.CONFIRMED);
        a.setPaymentStatus(PaymentStatus.UNPAID);
        a.setSource("ONLINE");
        a.setCustomerNotes(request.getCustomerNotes());
        appointmentRepository.save(a);
        slotEventsPublisher.publishSlotsChanged(clinic.getId());
        final UUID apptId = a.getId();
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        bookingEmailService.sendBookingEmailsAfterCommit(apptId);
                    }
                });
        AppointmentResponseDto dto = toAppointmentDto(a);
        PaymentCheckoutDto checkout = null;
        if (clinic.isOnlinePaymentsEnabled()) {
            PaymentLedger ledger = new PaymentLedger();
            ledger.setClinic(clinic);
            ledger.setAppointment(a);
            ledger.setPurpose(LedgerPaymentPurpose.APPOINTMENT);
            ledger.setAmountPaise(service.getPriceCents() * 100);
            ledger.setStatus(PaymentStatus.PENDING);
            String orderId = "appt_" + a.getId().toString().substring(0, 8);
            ledger.setRazorpayOrderId(orderId);
            paymentLedgerRepository.save(ledger);
            checkout =
                    PaymentCheckoutDto.builder()
                            .ledgerId(ledger.getId())
                            .razorpayKeyId(razorpayProperties.getKeyId())
                            .orderId(orderId)
                            .amountPaise(ledger.getAmountPaise())
                            .currency("INR")
                            .mockMode(!razorpayProperties.isConfigured())
                            .message(
                                    razorpayProperties.isConfigured()
                                            ? "Complete payment in Razorpay Checkout (integrate on frontend)."
                                            : "Mock mode: no Razorpay keys. Treat as paid in demos or call confirm endpoint.")
                            .build();
        }
        return BookAppointmentResultDto.builder().appointment(dto).paymentCheckout(checkout).build();
    }

    private Clinic resolvePublicClinic(BusinessType businessType, String slug) {
        String key = slug.trim().toLowerCase();
        Clinic clinic =
                clinicRepository
                        .findBySlugIgnoreCaseAndBusinessType(key, businessType)
                        .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
        if (clinic.isTenantSuspended()) {
            throw new ResourceNotFoundException("Business not found");
        }
        return clinic;
    }

    private UserAccount findOrCreateCustomer(PublicBookAppointmentRequest request) {
        String email = request.getCustomerEmail().trim().toLowerCase();
        return userAccountRepository
                .findByEmailIgnoreCase(email)
                .map(
                        u -> {
                            if (u.getRole() != UserRole.CUSTOMER) {
                                throw new BusinessException(
                                        HttpStatus.CONFLICT,
                                        "This email is already used for a business account. Please use a different email.");
                            }
                            return u;
                        })
                .orElseGet(
                        () -> {
                            UserAccount u = new UserAccount();
                            u.setEmail(email);
                            u.setName(request.getCustomerName().trim());
                            u.setMobile(
                                    request.getCustomerMobile() != null
                                            ? request.getCustomerMobile().trim()
                                            : null);
                            u.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
                            u.setRole(UserRole.CUSTOMER);
                            u.setStatus(UserStatus.ACTIVE);
                            return userAccountRepository.save(u);
                        });
    }

    private AppointmentResponseDto toAppointmentDto(Appointment a) {
        return AppointmentResponseDto.builder()
                .id(a.getId())
                .clinicId(a.getClinic().getId())
                .customerId(a.getCustomer().getId())
                .customerName(a.getCustomer().getName())
                .customerEmail(a.getCustomer().getEmail())
                .staffId(a.getStaff().getId())
                .staffName(a.getStaff().getDisplayName())
                .serviceId(a.getService().getId())
                .serviceName(a.getService().getName())
                .startAt(a.getStartAt())
                .endAt(a.getEndAt())
                .status(a.getStatus())
                .paymentStatus(a.getPaymentStatus())
                .customerNotes(a.getCustomerNotes())
                .staffNotes(null)
                .build();
    }
}
