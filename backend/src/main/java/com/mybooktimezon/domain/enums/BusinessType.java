package com.mybooktimezon.domain.enums;

public enum BusinessType {
    CLINIC,
    SALON,
    SPA,
    FITNESS,
    GYM,
    WELLNESS,
    COACHING,
    BEAUTY,
    OTHER;

    /** Short label for signup and public booking URLs. */
    public String getDisplayLabel() {
        return switch (this) {
            case CLINIC -> "Clinic / medical";
            case SALON -> "Salon";
            case SPA -> "Spa";
            case FITNESS -> "Fitness / gym";
            case GYM -> "Gym";
            case WELLNESS -> "Wellness";
            case COACHING -> "Coach / trainer";
            case BEAUTY -> "Beauty studio";
            case OTHER -> "Other business";
        };
    }
}
