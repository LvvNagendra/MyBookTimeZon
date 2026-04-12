package com.mybooktimezon.service;

import java.util.UUID;

public interface BookingEmailService {

    /** Called after DB commit; runs async. Sends confirmation (+ optional staff CC) when enabled. */
    void sendBookingEmailsAfterCommit(UUID appointmentId);

    /** Synchronous: send day-of reminder if local time matches configured window. */
    void sendDayReminderIfDue(UUID appointmentId);
}
