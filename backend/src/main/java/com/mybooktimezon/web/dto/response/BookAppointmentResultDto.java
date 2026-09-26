package com.mybooktimezon.web.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class BookAppointmentResultDto {
    AppointmentResponseDto appointment;
    PaymentCheckoutDto paymentCheckout;
}
