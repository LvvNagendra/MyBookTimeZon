package com.mybooktimezon.service;

import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.web.dto.request.StaffMemberWriteRequest;
import com.mybooktimezon.web.dto.response.StaffMemberResponseDto;
import java.util.List;
import java.util.UUID;

public interface StaffMemberService {

    List<StaffMemberResponseDto> list(UUID clinicId, SecurityUserPrincipal principal);

    StaffMemberResponseDto create(UUID clinicId, SecurityUserPrincipal principal, StaffMemberWriteRequest request);

    StaffMemberResponseDto update(
            UUID clinicId, UUID staffId, SecurityUserPrincipal principal, StaffMemberWriteRequest request);
}
