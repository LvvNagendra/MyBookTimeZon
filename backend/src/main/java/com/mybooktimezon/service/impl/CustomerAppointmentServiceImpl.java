package com.mybooktimezon.service.impl;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.common.exception.ResourceNotFoundException;
import com.mybooktimezon.common.util.WorkingHoursHelper;
import com.mybooktimezon.domain.entity.Appointment;
import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.entity.ServiceOffering;
import com.mybooktimezon.domain.entity.StaffMember;
import com.mybooktimezon.domain.enums.AppointmentStatus;
import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.realtime.SlotEventsPublisher;
import com.mybooktimezon.repository.AppointmentRepository;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.CustomerAppointmentService;
import com.mybooktimezon.web.dto.response.AppointmentResponseDto;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomerAppointmentServiceImpl implements CustomerAppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final SlotEventsPublisher slotEventsPublisher;

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponseDto> myAppointments(SecurityUserPrincipal principal) {
        requireCustomer(principal);
        return appointmentRepository.findByCustomer_IdOrderByStartAtDesc(principal.getUserId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public AppointmentResponseDto cancelMyAppointment(UUID appointmentId, SecurityUserPrincipal principal) {
        requireCustomer(principal);
        Appointment a = loadMine(appointmentId, principal.getUserId());
        if (a.getStatus() == AppointmentStatus.CANCELLED) {
            return toDto(a);
        }
        if (a.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cannot cancel a completed appointment");
        }
        if (!a.getStartAt().isAfter(Instant.now())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cannot cancel an appointment that has already started");
        }
        a.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(a);
        slotEventsPublisher.publishSlotsChanged(a.getClinic().getId());
        return toDto(a);
    }

    @Override
    @Transactional
    public AppointmentResponseDto rescheduleMyAppointment(
            UUID appointmentId, Instant newStartAt, SecurityUserPrincipal principal) {
        requireCustomer(principal);
        if (newStartAt == null || !newStartAt.isAfter(Instant.now())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Choose a future date and time");
        }
        Appointment a = loadMine(appointmentId, principal.getUserId());
        if (a.getStatus() == AppointmentStatus.CANCELLED || a.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Only upcoming bookings can be rescheduled");
        }
        if (!a.getStartAt().isAfter(Instant.now())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cannot reschedule an appointment that has already started");
        }

        Clinic clinic = a.getClinic();
        StaffMember staff = a.getStaff();
        ServiceOffering service = a.getService();
        ZoneId zone = ZoneId.of(clinic.getTimezone() != null ? clinic.getTimezone() : "Asia/Kolkata");
        Instant newEnd = newStartAt.plus(service.getDurationMinutes(), ChronoUnit.MINUTES);
        LocalDate date = newStartAt.atZone(zone).toLocalDate();
        LocalTime startLocal = newStartAt.atZone(zone).toLocalTime();
        LocalTime endLocal = newEnd.atZone(zone).toLocalTime();
        if (!newEnd.atZone(zone).toLocalDate().equals(date)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "That time does not fit in a single day for this service");
        }

        String hoursJson =
                staff.getWorkingHoursJson() != null && !staff.getWorkingHoursJson().isBlank()
                        ? staff.getWorkingHoursJson()
                        : clinic.getWorkingHoursJson();
        if (!WorkingHoursHelper.isWithinWorkingHours(hoursJson, date, startLocal, endLocal)) {
            throw new BusinessException(
                    HttpStatus.CONFLICT, "That time is outside the professional's working hours");
        }

        boolean taken =
                appointmentRepository.existsOverlappingExcluding(
                        staff.getId(), newStartAt, newEnd, AppointmentStatus.CANCELLED, a.getId());
        if (taken) {
            throw new BusinessException(HttpStatus.CONFLICT, "That slot was just taken. Pick another time.");
        }

        a.setStartAt(newStartAt);
        a.setEndAt(newEnd);
        if (a.getStatus() == AppointmentStatus.REQUESTED) {
            a.setStatus(AppointmentStatus.CONFIRMED);
        }
        appointmentRepository.save(a);
        slotEventsPublisher.publishSlotsChanged(clinic.getId());
        return toDto(a);
    }

    private static void requireCustomer(SecurityUserPrincipal principal) {
        if (principal.getRole() != UserRole.CUSTOMER) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Customers only");
        }
    }

    private Appointment loadMine(UUID appointmentId, UUID customerId) {
        return appointmentRepository
                .findByIdAndCustomer_Id(appointmentId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
    }

    private AppointmentResponseDto toDto(Appointment a) {
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
