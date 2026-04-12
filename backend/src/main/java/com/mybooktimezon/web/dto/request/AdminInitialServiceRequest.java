package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Optional bookable service created with the tenant — always bound to that clinic only
 * (never references another tenant's rows).
 */
@Data
public class AdminInitialServiceRequest {

    @NotBlank(message = "Service name is required when an initial service is sent")
    @Size(max = 255)
    private String name;

    @Size(max = 100)
    private String category;

    @Min(5)
    @Max(480)
    private Integer durationMinutes = 45;

    @Min(0)
    @Max(50000000)
    private Long priceCents = 0L;
}
