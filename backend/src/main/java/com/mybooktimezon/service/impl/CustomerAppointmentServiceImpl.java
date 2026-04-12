package com.mybooktimezon.service.impl;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.common.exception.ResourceNotFoundException;
import com.mybooktimezon.domain.entity.Appointment;
import com.mybooktimezon.domain.enums.AppointmentStatus;
import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.realtime.SlotEventsPublisher;
import com.mybooktimezon.repository.AppointmentRepository;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.CustomerAppointmentService;
import com.mybooktimezon.web.dto.response.AppointmentResponseDto;
import java.time.Instant;
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
        if (principal.getRole() != UserRole.CUSTOMER) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Customers only");
        }
        return appointmentRepository.findByCustomer_IdOrderByStartAtDesc(principal.getUserId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public AppointmentResponseDto cancelMyAppointment(UUID appointmentId, SecurityUserPrincipal principal) {
        if (principal.getRole() != UserRole.CUSTOMER) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Customers only");
        }
        Appointment a =
                appointmentRepository
                        .findByIdAndCustomer_Id(appointmentId, principal.getUserId())
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
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
