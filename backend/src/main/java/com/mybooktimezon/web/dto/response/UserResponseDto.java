package com.mybooktimezon.web.dto.response;

import com.mybooktimezon.domain.enums.UserRole;
import com.mybooktimezon.domain.enums.UserStatus;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserResponseDto {
    UUID id;
    String email;
    String mobile;
    String name;
    UserRole role;
    UserStatus status;
}
