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
    /** Product label: Platform Admin / Business Admin / Employee / Customer. */
    String roleLabel;
    UserStatus status;
    /** Optional avatar (URL or data URL). */
    String profilePhotoDataUrl;
}
