package com.mybooktimezon.web.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ModuleDto {
    UUID id;
    String code;
    String label;
    String description;
    boolean active;
}
