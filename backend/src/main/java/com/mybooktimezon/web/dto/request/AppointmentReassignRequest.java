package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.Data;

@Data
public class AppointmentReassignRequest {

    @NotNull
    private UUID staffId;

    @Size(max = 500)
    private String reason;
}
