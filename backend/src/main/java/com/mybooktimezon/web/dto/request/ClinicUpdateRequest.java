package com.mybooktimezon.web.dto.request;

import com.mybooktimezon.domain.enums.BusinessType;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClinicUpdateRequest {

    @Size(max = 255)
    private String businessName;

    @Size(max = 500)
    private String address;

    @Size(max = 120)
    private String city;

    @Size(max = 120)
    private String country;

    @Size(max = 120)
    private String state;

    @Size(max = 120)
    private String village;

    @Size(max = 200)
    private String displayLocation;

    /** WGS-84 — optional map pin. */
    private Double latitude;

    private Double longitude;

    @Size(max = 64)
    private String timezone;

    private String workingHoursJson;

    private BusinessType businessType;

    /** When true, customers may pay online for appointments (Razorpay to tenant). */
    private Boolean onlinePaymentsEnabled;
}
