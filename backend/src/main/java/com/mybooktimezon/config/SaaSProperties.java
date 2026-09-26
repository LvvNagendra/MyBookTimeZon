package com.mybooktimezon.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "saas")
public class SaaSProperties {

    /** Free trial length for new tenants (days). */
    private int trialDays = 14;

    private long basicMonthlyPaise = 49_900L;
    private long standardMonthlyPaise = 99_900L;
    private long premiumMonthlyPaise = 149_900L;

    private BootstrapSuperAdmin bootstrapSuperAdmin = new BootstrapSuperAdmin();

    @Data
    public static class BootstrapSuperAdmin {
        private boolean enabled = false;
        private String email = "superadmin@local.test";
        /** Must be quoted in YAML if it contains ! (e.g. password: "x!y"). */
        private String password = "ChangeMe!123";
        private String name = "Super Admin";
        /**
         * When true, re-encodes {@link #password} into the DB for the bootstrap email if that user already exists.
         * Use once after fixing YAML or a bad hash; then set back to false.
         */
        private boolean forceSyncPassword = false;
    }
}
