package com.mybooktimezon.web.dto.response;

import com.mybooktimezon.domain.enums.BusinessType;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PublicBusinessPageDto {
    UUID clinicId;
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
    List<ServiceOfferingResponseDto> services;
    List<StaffMemberResponseDto> staff;
    /** Curated “trending at this salon” rows (active only). */
    List<TrendingStyleResponseDto> trendingStyles;
}
