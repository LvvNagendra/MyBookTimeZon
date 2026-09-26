package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class SectorWriteRequest {

    @NotBlank
    @Size(max = 32)
    private String code;

    @NotBlank
    @Size(max = 120)
    private String label;

    @Size(max = 500)
    private String description;

    private Boolean active;

    private Integer sortOrder;

    /** Module codes to attach (enabled by default). Null = leave unchanged on update. */
    private List<String> moduleCodes;
}
