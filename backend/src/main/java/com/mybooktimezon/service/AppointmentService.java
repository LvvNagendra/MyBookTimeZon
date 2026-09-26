package com.mybooktimezon.service;

import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.web.dto.request.AppointmentMarkPaidRequest;
import com.mybooktimezon.web.dto.response.AppointmentResponseDto;
import java.util.List;
import java.util.UUID;

public interface AppointmentService {

    List<AppointmentResponseDto> listForTenant(UUID clinicId, SecurityUserPrincipal principal);

    AppointmentResponseDto cancelForTenant(UUID clinicId, UUID appointmentId, SecurityUserPrincipal principal);

    AppointmentResponseDto reassignStaff(
            UUID clinicId,
            UUID appointmentId,
            UUID newStaffId,
            String reason,
            SecurityUserPrincipal principal);

    AppointmentResponseDto completeForTenant(UUID clinicId, UUID appointmentId, SecurityUserPrincipal principal);

    AppointmentResponseDto markNoShowForTenant(UUID clinicId, UUID appointmentId, SecurityUserPrincipal principal);

    /** Record cash / UPI / bank / other — no payment gateway required. */
    AppointmentResponseDto markPaidForTenant(
            UUID clinicId, UUID appointmentId, AppointmentMarkPaidRequest request, SecurityUserPrincipal principal);
}
