package com.mybooktimezon.web.dto.response;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PlatformRoleDto {
    UUID id;
    String code;
    String label;
    String description;
    String scope;
    boolean systemRole;
    boolean active;
    List<String> permissionCodes;
}
