package com.mybooktimezon.domain.entity;

import com.mybooktimezon.domain.enums.BusinessType;
import com.mybooktimezon.domain.enums.SubscriptionPlan;
import com.mybooktimezon.domain.enums.SubscriptionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.ColumnDefault;
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

    @Column(length = 120)
    private String country;

    @Column(length = 120)
    private String state;

    @Column(length = 120)
    private String village;

    /** Short label for UI, e.g. "Indiranagar, Bengaluru". */
    @Column(name = "display_location", length = 200)
    private String displayLocation;

    /** WGS-84 — optional pin for Google Maps (set by tenant). */
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(columnDefinition = "TEXT")
    private String specialties;

    @Column(name = "salon_phone", length = 32)
    private String salonPhone;

    @Column(name = "owner_mobile", length = 32)
    private String ownerMobile;

    @Column(name = "owner_email", length = 255)
    private String ownerEmail;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(nullable = false, length = 64)
    private String timezone = "Asia/Kolkata";

    @Column(name = "working_hours_json", columnDefinition = "TEXT")
    private String workingHoursJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_plan", nullable = false, length = 32)
    private SubscriptionPlan subscriptionPlan = SubscriptionPlan.BASIC;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_status", nullable = false, length = 32)
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.TRIAL;

    @Column(name = "razorpay_customer_id", length = 128)
    private String razorpayCustomerId;

    /** When SaaS trial ends; after this, tenant must subscribe (platform payment). */
    @Column(name = "trial_ends_at")
    private Instant trialEndsAt;

    @ColumnDefault("false")
    @Column(name = "tenant_suspended", nullable = false)
    private boolean tenantSuspended = false;

    /** If true, customers can pay for appointments online (Razorpay → tenant account). */
    @ColumnDefault("false")
    @Column(name = "online_payments_enabled", nullable = false)
    private boolean onlinePaymentsEnabled = false;

    /** Public brand logo — HTTPS URL or compressed data URL. */
    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;
}
