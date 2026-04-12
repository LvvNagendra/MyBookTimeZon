package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ServiceOfferingWriteRequest {

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 100)
    private String category;

    @Positive
    private int durationMinutes;

    /** Stored in paise (INR ×100). Minimum ₹100 per bookable service. */
    @Min(10_000)
    private long priceCents;

    private Integer taxRateBps;

    private String description;

    private Boolean active;
}
