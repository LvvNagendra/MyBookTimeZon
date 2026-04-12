package com.mybooktimezon.web.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminStaffBriefDto {
    UUID id;
    String displayName;
    String specialization;
    String email;
    String mobile;
    String gender;
    int parallelBookingsMax;
    boolean active;
}
