package com.mybooktimezon.domain.entity;

import com.mybooktimezon.domain.enums.BusinessType;
import com.mybooktimezon.domain.enums.SubscriptionPlan;
import com.mybooktimezon.domain.enums.SubscriptionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "clinics")
@Getter
@Setter
public class Clinic extends AuditedEntity {

    @Column(name = "business_name", nullable = false)
    private String businessName;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", length = 32)
    private BusinessType businessType;

    @Column(length = 500)
    private String address;

    @Column(length = 120)
    private String city;

    @Column(nullable = false, length = 64)
    private String timezone = "Asia/Kolkata";

    @Column(name = "working_hours_json", columnDefinition = "CLOB")
    private String workingHoursJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_plan", nullable = false, length = 32)
    private SubscriptionPlan subscriptionPlan = SubscriptionPlan.BASIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_status", nullable = false, length = 32)
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.TRIAL;

    @Column(name = "razorpay_customer_id", length = 128)
    private String razorpayCustomerId;
}
