package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;
import lombok.Data;

@Data
public class PublicBookAppointmentRequest {

    @NotNull private UUID serviceId;
    @NotNull private UUID staffId;
    @NotNull private Instant startAt;

    @NotBlank
    @Size(max = 200)
    private String customerName;

    @NotBlank
    @Email
    @Size(max = 255)
    private String customerEmail;

    @Size(max = 32)
    private String customerMobile;

    private String customerNotes;
}
