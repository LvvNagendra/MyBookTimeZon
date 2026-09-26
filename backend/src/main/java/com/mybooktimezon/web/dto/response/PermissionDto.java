package com.mybooktimezon.web.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PermissionDto {
    UUID id;
    String code;
    String label;
    String description;
    String moduleCode;
    String scope;
}
