package com.mybooktimezon.web.dto.response;

import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.domain.enums.UserStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AdminUserSummaryDto {
    UUID id;
    String name;
    String email;
    String mobile;
    UserRole role;
    UserStatus status;
    Instant createdAt;
}
