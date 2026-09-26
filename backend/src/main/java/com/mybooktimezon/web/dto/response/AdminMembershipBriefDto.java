package com.mybooktimezon.web.dto.response;

import com.mybooktimezon.domain.enums.ClinicMembershipRole;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminMembershipBriefDto {
    String userName;
    String userEmail;
    ClinicMembershipRole clinicRole;
}
