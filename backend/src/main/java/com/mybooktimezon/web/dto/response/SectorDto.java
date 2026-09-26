package com.mybooktimezon.web.dto.response;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SectorDto {
    UUID id;
    String code;
    String label;
    String description;
    boolean active;
    int sortOrder;
    List<ModuleDto> modules;
}
