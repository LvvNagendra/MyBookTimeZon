package com.mybooktimezon.domain.enums;

/** How the customer settled (or will settle) the visit — gateway is optional. */
public enum PaymentMethod {
    /** Pay at salon / clinic desk (cash). */
    CASH,
    /** Customer UPI / QR collected manually by staff. */
    UPI,
    /** Bank transfer / NEFT recorded by staff. */
    BANK_TRANSFER,
    /** Razorpay or other online gateway. */
    GATEWAY,
    /** Catch-all (voucher, other account, etc.). */
    OTHER
}
