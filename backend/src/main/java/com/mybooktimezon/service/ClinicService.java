package com.mybooktimezon.service;

import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.web.dto.request.ClinicUpdateRequest;
import com.mybooktimezon.web.dto.response.ClinicResponseDto;
import java.util.UUID;

public interface ClinicService {

    ClinicResponseDto getBySlug(String slug);

    ClinicResponseDto getByIdForUser(UUID clinicId, SecurityUserPrincipal principal);

    ClinicResponseDto updateForUser(UUID clinicId, SecurityUserPrincipal principal, ClinicUpdateRequest request);

    ClinicResponseDto getMyClinic(SecurityUserPrincipal principal);
}
