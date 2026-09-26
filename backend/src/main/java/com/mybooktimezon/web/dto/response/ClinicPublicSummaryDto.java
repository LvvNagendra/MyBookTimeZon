package com.mybooktimezon.web.dto.response;

import com.mybooktimezon.domain.enums.BusinessType;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

/** Public discovery card — no internal admin fields. */
@Value
@Builder
public class ClinicPublicSummaryDto {
    UUID id;
    String businessName;
    String slug;
    BusinessType businessType;
    String address;
    String city;
    String country;
    String state;
    String village;
    String displayLocation;
    Double latitude;
    Double longitude;
}
