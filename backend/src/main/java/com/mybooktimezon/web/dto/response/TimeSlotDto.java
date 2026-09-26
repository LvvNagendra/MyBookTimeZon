package com.mybooktimezon.web.dto.response;

import java.time.Instant;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class TimeSlotDto {
    Instant startAt;
    Instant endAt;
    boolean available;
}
