package com.mybooktimezon.web.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ProfileResponse {
    UserResponseDto user;
    ClinicResponseDto clinic;
    /** Effective permission codes from platform_roles (dynamic RBAC). */
    List<String> permissions;
    /** Feature modules enabled for the user's clinic sector (empty for customers without clinic). */
    List<ModuleDto> modules;
}
