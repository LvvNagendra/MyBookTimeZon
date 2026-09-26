package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import lombok.Data;

@Data
public class AppointmentRescheduleRequest {

    @NotNull
    private Instant startAt;
}
