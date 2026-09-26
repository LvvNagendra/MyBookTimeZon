package com.mybooktimezon.domain.entity;

import com.mybooktimezon.domain.enums.LedgerPaymentPurpose;
import com.mybooktimezon.domain.enums.PaymentStatus;
import com.mybooktimezon.domain.enums.SubscriptionPlan;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "payment_ledger")
@Getter
@Setter
public class PaymentLedger extends AuditedEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private LedgerPaymentPurpose purpose;

    @Column(name = "amount_paise", nullable = false)
    private long amountPaise;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "razorpay_order_id", length = 128)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", length = 128)
    private String razorpayPaymentId;

    /** Set for PLATFORM_SUBSCRIPTION rows so activation knows which plan was purchased. */
    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_plan", length = 32)
    private SubscriptionPlan subscriptionPlan;
}
