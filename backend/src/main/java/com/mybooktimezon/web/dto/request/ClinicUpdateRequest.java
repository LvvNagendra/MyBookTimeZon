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

    @Size(max = 64)
    private String timezone;

    private String workingHoursJson;

    private BusinessType businessType;
}
