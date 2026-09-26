package com.mybooktimezon.web.dto.request;

import com.mybooktimezon.domain.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AppointmentMarkPaidRequest {
    /** How money was collected. Defaults to CASH when omitted by clients that send empty body fields carefully. */
    @NotNull private PaymentMethod method = PaymentMethod.CASH;

    /** Optional note (UPI ref, bank last-4, etc.). */
    private String note;
}
