package com.mybooktimezon.common.util;

import java.util.Optional;
import java.util.regex.Pattern;

/** Normalizes Indian mobile numbers to 10 digits (no country code). */
public final class PhoneUtils {

    private static final Pattern DIGITS = Pattern.compile("\\D");
    /** 10-digit Indian mobile starting with 6–9. */
    public static final Pattern IN_MOBILE_10 = Pattern.compile("^[6-9]\\d{9}$");

    private PhoneUtils() {}

    /** Strips non-digits; returns empty if not exactly 10 valid IN mobile digits. */
    public static Optional<String> normalizeIndianMobile(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String digits = DIGITS.matcher(raw.trim()).replaceAll("");
        if (digits.length() == 12 && digits.startsWith("91")) {
            digits = digits.substring(2);
        }
        if (digits.length() == 11 && digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        if (IN_MOBILE_10.matcher(digits).matches()) {
            return Optional.of(digits);
        }
        return Optional.empty();
    }
}
