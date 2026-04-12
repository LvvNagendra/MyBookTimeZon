package com.mybooktimezon.web.dto.response;

import com.mybooktimezon.domain.enums.AppointmentStatus;
import com.mybooktimezon.domain.enums.PaymentStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AppointmentResponseDto {
    UUID id;
    UUID clinicId;
    UUID customerId;
    String customerName;
    String customerEmail;
    UUID staffId;
    String staffName;
    UUID serviceId;
    String serviceName;
    Instant startAt;
    Instant endAt;
    AppointmentStatus status;
    PaymentStatus paymentStatus;
    String customerNotes;
    /** Internal salon notes (reassign reasons, etc.). Null for customer/public APIs. */
    String staffNotes;
}
