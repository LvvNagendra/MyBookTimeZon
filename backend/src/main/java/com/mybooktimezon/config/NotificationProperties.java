package com.mybooktimezon.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.notifications")
public class NotificationProperties {

    /** Send HTML confirmation to customer email right after online booking. */
    private boolean confirmationEmailEnabled = false;

    /**
     * Send a morning reminder email in the clinic's timezone on the appointment day (see {@link #reminderHourLocal}).
     */
    private boolean dayReminderEmailEnabled = false;

    /** CC the assigned staff member when they have a roster email on file. */
    private boolean staffCcOnBooking = false;

    private String fromAddress = "bookings@example.com";

    private String fromName = "SlotNexa";

    /** Local hour (0–23) in the clinic's timezone to send the day-of reminder. */
    private int reminderHourLocal = 8;

    /** Only send if current local time is within this many minutes after the hour (scheduler runs every 10 min). */
    private int reminderWindowMinutes = 50;
}
