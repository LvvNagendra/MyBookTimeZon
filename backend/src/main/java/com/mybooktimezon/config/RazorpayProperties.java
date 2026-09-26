package com.mybooktimezon.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Razorpay keys for subscription (platform → super admin) and appointment checkout (customer → tenant).
 * Use env vars in production; leave empty for local mock checkout responses.
 */
@Data
@ConfigurationProperties(prefix = "razorpay")
public class RazorpayProperties {

    private String keyId = "";
    private String keySecret = "";
    private String webhookSecret = "";

    /**
     * When true (default), SaaS checkout returns mockMode and tenants can call confirm-mock.
     * Set false once live Checkout.js + webhooks are wired.
     */
    private boolean mockCheckoutEnabled = true;

    public boolean isConfigured() {
        return keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank();
    }

    public boolean isMockMode() {
        return mockCheckoutEnabled || !isConfigured();
    }
}
