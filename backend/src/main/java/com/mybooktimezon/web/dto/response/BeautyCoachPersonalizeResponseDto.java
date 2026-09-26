package com.mybooktimezon.web.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class BeautyCoachPersonalizeResponseDto {
    List<String> suggestedHaircuts;
    List<String> hairHealthTips;
    List<String> productCategories;
    List<String> facialTips;
    String disclaimer;
}
