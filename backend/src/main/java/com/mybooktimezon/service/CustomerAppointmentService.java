package com.mybooktimezon.service;

import java.util.List;
import java.util.UUID;

import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.web.dto.response.AppointmentResponseDto;

public interface CustomerAppointmentService {

    List<AppointmentResponseDto> myAppointments(SecurityUserPrincipal principal);

    AppointmentResponseDto cancelMyAppointment(UUID appointmentId, SecurityUserPrincipal principal);
}
