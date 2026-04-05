package com.mybooktimezon.web.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ProfileResponse {
    UserResponseDto user;
    ClinicResponseDto clinic;
}
