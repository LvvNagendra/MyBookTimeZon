package com.mybooktimezon.web.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class StaffMemberResponseDto {
    UUID id;
    String displayName;
    String specialization;
    String workingHoursJson;
    String email;
    String mobile;
    String gender;
    int parallelBookingsMax;
    String photoUrl;
    boolean active;
    /** True when linked to a UserAccount that can sign in. */
    boolean hasLogin;
    UUID linkedUserId;
}
