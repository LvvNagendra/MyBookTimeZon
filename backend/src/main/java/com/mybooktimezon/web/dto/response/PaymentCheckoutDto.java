package com.mybooktimezon.web.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PaymentCheckoutDto {
    UUID ledgerId;
    String razorpayKeyId;
    String orderId;
    long amountPaise;
    String currency;
    boolean mockMode;
    String message;
}
