package com.mybooktimezon.service.impl;

import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.common.exception.ResourceNotFoundException;
import com.mybooktimezon.domain.entity.Appointment;
import com.mybooktimezon.domain.entity.StaffMember;
import com.mybooktimezon.domain.enums.AppointmentStatus;
import com.mybooktimezon.domain.enums.PaymentMethod;
import com.mybooktimezon.domain.enums.PaymentStatus;
import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.realtime.SlotEventsPublisher;
import com.mybooktimezon.repository.AppointmentRepository;
import com.mybooktimezon.repository.StaffMemberRepository;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.AppointmentService;
import com.mybooktimezon.service.TenantPolicyService;
import com.mybooktimezon.web.dto.response.AppointmentResponseDto;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private static final DateTimeFormatter REASSIGN_TS = DateTimeFormatter.ISO_INSTANT;

    private final AppointmentRepository appointmentRepository;
    private final StaffMemberRepository staffMemberRepository;
    private final TenantPolicyService tenantPolicyService;
    private final SlotEventsPublisher slotEventsPublisher;

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponseDto> listForTenant(UUID clinicId, SecurityUserPrincipal principal) {
        tenantPolicyService.requireTenantMembership(principal, clinicId);
        List<Appointment> rows;
        if (principal.getRole() == UserRole.STAFF) {
            UUID staffId =
                    staffMemberRepository
                            .findByUser_IdAndClinic_Id(principal.getUserId(), clinicId)
                            .map(s -> s.getId())
                            .orElse(null);
            if (staffId == null) {
                return List.of();
            }
            rows = appointmentRepository.findByClinic_IdAndStaff_IdOrderByStartAtDesc(clinicId, staffId);
        } else {
            rows = appointmentRepository.findByClinic_IdOrderByStartAtDesc(clinicId);
        }
        return rows.stream().map(this::toDto).toList();
    }

    @Override
    @Transactional
    public AppointmentResponseDto cancelForTenant(
            UUID clinicId, UUID appointmentId, SecurityUserPrincipal principal) {
        tenantPolicyService.requireTenantMembership(principal, clinicId);
        Appointment a =
                appointmentRepository
                        .findByIdAndClinic_Id(appointmentId, clinicId)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        assertTenantStaffMayManageAppointment(clinicId, a, principal);
        if (a.getStatus() == AppointmentStatus.CANCELLED) {
            return toDto(a);
        }
        if (a.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cannot cancel a completed appointment");
        }
        a.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(a);
        slotEventsPublisher.publishSlotsChanged(clinicId);
        return toDto(a);
    }

    @Override
    @Transactional
    public AppointmentResponseDto reassignStaff(
            UUID clinicId,
            UUID appointmentId,
            UUID newStaffId,
            String reason,
            SecurityUserPrincipal principal) {
        tenantPolicyService.requireTenantMembership(principal, clinicId);
        Appointment a =
                appointmentRepository
                        .findByIdAndClinic_Id(appointmentId, clinicId)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        assertTenantStaffMayManageAppointment(clinicId, a, principal);
        if (a.getStatus() == AppointmentStatus.CANCELLED || a.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cannot reassign this appointment");
        }
        if (a.getStatus() == AppointmentStatus.NO_SHOW) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cannot reassign a no-show");
        }
        StaffMember newStaff =
                staffMemberRepository
                        .findByIdAndClinic_Id(newStaffId, clinicId)
                        .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        if (!newStaff.isActive()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Staff member is inactive");
        }
        if (!newStaffId.equals(a.getStaff().getId())
                && appointmentRepository.existsOverlapping(
                        newStaffId, a.getStartAt(), a.getEndAt(), AppointmentStatus.CANCELLED)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Selected staff is not available at this time");
        }
        String oldName = a.getStaff().getDisplayName();
        a.setStaff(newStaff);
        appendStaffNote(
                a,
                "Reassigned from "
                        + oldName
                        + " to "
                        + newStaff.getDisplayName()
                        + (reason != null && !reason.isBlank() ? (": " + reason.trim()) : ""));
        appointmentRepository.save(a);
        slotEventsPublisher.publishSlotsChanged(clinicId);
        return toDto(a);
    }

    @Override
    @Transactional
    public AppointmentResponseDto completeForTenant(
            UUID clinicId, UUID appointmentId, SecurityUserPrincipal principal) {
        tenantPolicyService.requireTenantMembership(principal, clinicId);
        Appointment a =
                appointmentRepository
                        .findByIdAndClinic_Id(appointmentId, clinicId)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        assertTenantStaffMayManageAppointment(clinicId, a, principal);
        if (a.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cannot complete a cancelled appointment");
        }
        if (a.getStatus() == AppointmentStatus.COMPLETED) {
            return toDto(a);
        }
        if (a.getStatus() == AppointmentStatus.NO_SHOW) {
            throw new BusinessException(HttpStatus.CONFLICT, "Already marked no-show");
        }
        a.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(a);
        slotEventsPublisher.publishSlotsChanged(clinicId);
        return toDto(a);
    }

    @Override
    @Transactional
    public AppointmentResponseDto markNoShowForTenant(
            UUID clinicId, UUID appointmentId, SecurityUserPrincipal principal) {
        tenantPolicyService.requireTenantMembership(principal, clinicId);
        Appointment a =
                appointmentRepository
                        .findByIdAndClinic_Id(appointmentId, clinicId)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        assertTenantStaffMayManageAppointment(clinicId, a, principal);
        if (a.getStatus() == AppointmentStatus.CANCELLED || a.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cannot mark no-show for this appointment");
        }
        if (a.getStatus() == AppointmentStatus.NO_SHOW) {
            return toDto(a);
        }
        a.setStatus(AppointmentStatus.NO_SHOW);
        appointmentRepository.save(a);
        slotEventsPublisher.publishSlotsChanged(clinicId);
        return toDto(a);
    }

    @Override
    @Transactional
    public AppointmentResponseDto markPaidForTenant(
            UUID clinicId,
            UUID appointmentId,
            com.mybooktimezon.web.dto.request.AppointmentMarkPaidRequest request,
            SecurityUserPrincipal principal) {
        tenantPolicyService.requireTenantMembership(principal, clinicId);
        Appointment a =
                appointmentRepository
                        .findByIdAndClinic_Id(appointmentId, clinicId)
                        .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        assertTenantStaffMayManageAppointment(clinicId, a, principal);
        if (a.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cannot mark a cancelled appointment as paid");
        }
        PaymentMethod method = request.getMethod() != null ? request.getMethod() : PaymentMethod.CASH;
        a.setPaymentStatus(PaymentStatus.PAID);
        a.setPaymentMethod(method);
        String note = request.getNote() != null ? request.getNote().trim() : "";
        appendStaffNote(
                a,
                "Marked PAID via "
                        + method
                        + (note.isEmpty() ? "" : (" — " + note))
                        + " (manual / no gateway)");
        appointmentRepository.save(a);
        return toDto(a);
    }

    private void appendStaffNote(Appointment a, String line) {
        String stamp = REASSIGN_TS.format(Instant.now());
        String entry = "[" + stamp + "] " + line;
        String existing = a.getNotes();
        a.setNotes(existing == null || existing.isBlank() ? entry : existing + "\n" + entry);
    }

    /**
     * Owners and clinic admins manage any booking; staff users only their own assigned rows.
     */
    private void assertTenantStaffMayManageAppointment(
            UUID clinicId, Appointment appointment, SecurityUserPrincipal principal) {
        if (principal.getRole() == UserRole.SUPER_ADMIN) {
            return;
        }
        if (tenantPolicyService.isTenantOwnerInClinic(principal, clinicId)) {
            return;
        }
        if (principal.getRole() == UserRole.TENANT_ADMIN || principal.getRole() == UserRole.CLINIC_ADMIN) {
            return;
        }
        if (principal.getRole() == UserRole.STAFF) {
            StaffMember staff =
                    staffMemberRepository
                            .findByUser_IdAndClinic_Id(principal.getUserId(), clinicId)
                            .orElseThrow(() -> new BusinessException(HttpStatus.FORBIDDEN, "No staff profile"));
            if (!appointment.getStaff().getId().equals(staff.getId())) {
                throw new BusinessException(HttpStatus.FORBIDDEN, "You can only manage your own appointments");
            }
            return;
        }
        throw new BusinessException(HttpStatus.FORBIDDEN, "Not allowed");
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
                .paymentMethod(a.getPaymentMethod())
                .customerNotes(a.getCustomerNotes())
                .staffNotes(a.getNotes())
                .build();
    }
}
