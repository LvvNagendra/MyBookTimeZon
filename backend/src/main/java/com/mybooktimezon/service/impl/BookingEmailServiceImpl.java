package com.mybooktimezon.service.impl;

import com.mybooktimezon.config.NotificationProperties;
import com.mybooktimezon.domain.entity.Appointment;
import com.mybooktimezon.repository.AppointmentRepository;
import com.mybooktimezon.service.BookingEmailService;
import jakarta.mail.internet.MimeMessage;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@RequiredArgsConstructor
public class BookingEmailServiceImpl implements BookingEmailService {

    private static final Logger log = LogManager.getLogger(BookingEmailServiceImpl.class);
    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("EEEE, MMM d, yyyy 'at' h:mm a z");

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final NotificationProperties notificationProperties;
    private final AppointmentRepository appointmentRepository;
    private final TransactionTemplate transactionTemplate;

    @Override
    @Async
    public void sendBookingEmailsAfterCommit(UUID appointmentId) {
        transactionTemplate.executeWithoutResult(
                status -> {
                    Appointment a = appointmentRepository.findById(appointmentId).orElse(null);
                    if (a == null || a.isConfirmationEmailSent()) {
                        return;
                    }
                    if (!notificationProperties.isConfirmationEmailEnabled()) {
                        return;
                    }
                    JavaMailSender sender = mailSenderProvider.getIfAvailable();
                    if (sender == null) {
                        log.warn("Mail not configured — skip booking confirmation for {}", appointmentId);
                        return;
                    }
                    try {
                        sendMime(
                                sender,
                                a.getCustomer().getEmail(),
                                staffCc(a),
                                "Your appointment — " + a.getClinic().getBusinessName(),
                                confirmationHtml(a));
                        a.setConfirmationEmailSent(true);
                        appointmentRepository.save(a);
                    } catch (Exception e) {
                        log.warn("Could not send booking confirmation for {}", appointmentId, e);
                    }
                });
    }

    @Override
    public void sendDayReminderIfDue(UUID appointmentId) {
        transactionTemplate.executeWithoutResult(
                status -> {
                    Appointment a = appointmentRepository.findById(appointmentId).orElse(null);
                    if (a == null || a.isReminderEmailSent()) {
                        return;
                    }
                    if (!notificationProperties.isDayReminderEmailEnabled()) {
                        return;
                    }
                    ZoneId zone = ZoneId.of(zoneId(a));
                    ZonedDateTime nowLocal = Instant.now().atZone(zone);
                    ZonedDateTime apptLocal = a.getStartAt().atZone(zone);
                    if (!apptLocal.toLocalDate().equals(nowLocal.toLocalDate())) {
                        return;
                    }
                    int hour = notificationProperties.getReminderHourLocal();
                    int minute = nowLocal.getHour() * 60 + nowLocal.getMinute();
                    int windowStart = hour * 60;
                    int windowEnd = windowStart + notificationProperties.getReminderWindowMinutes();
                    if (minute < windowStart || minute > windowEnd) {
                        return;
                    }
                    JavaMailSender sender = mailSenderProvider.getIfAvailable();
                    if (sender == null) {
                        log.warn("Mail not configured — skip reminder for {}", appointmentId);
                        return;
                    }
                    try {
                        sendMime(
                                sender,
                                a.getCustomer().getEmail(),
                                staffCc(a),
                                "Reminder: today at " + a.getClinic().getBusinessName(),
                                reminderHtml(a, apptLocal));
                        a.setReminderEmailSent(true);
                        appointmentRepository.save(a);
                    } catch (Exception e) {
                        log.warn("Could not send reminder for {}", appointmentId, e);
                    }
                });
    }

    private static String zoneId(Appointment a) {
        String tz = a.getClinic().getTimezone();
        return tz != null && !tz.isBlank() ? tz : "Asia/Kolkata";
    }

    private String staffCc(Appointment a) {
        if (!notificationProperties.isStaffCcOnBooking()) {
            return null;
        }
        String e = a.getStaff().getEmail();
        return e != null && !e.isBlank() ? e.trim() : null;
    }

    private void sendMime(JavaMailSender sender, String to, String cc, String subject, String html)
            throws Exception {
        MimeMessage msg = sender.createMimeMessage();
        MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
        h.setFrom(notificationProperties.getFromAddress(), notificationProperties.getFromName());
        h.setTo(to);
        if (cc != null) {
            h.setCc(cc);
        }
        h.setSubject(subject);
        h.setText(html, true);
        sender.send(msg);
    }

    private String confirmationHtml(Appointment a) {
        ZonedDateTime when = a.getStartAt().atZone(ZoneId.of(zoneId(a)));
        return """
                <!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;">
                <h2 style="color:#6b4f2a;">You're booked</h2>
                <p>Hi %s,</p>
                <p>Thanks for booking with <strong>%s</strong>.</p>
                <table style="border-collapse:collapse;margin:1rem 0;">
                <tr><td style="padding:4px 12px 4px 0;"><strong>Service</strong></td><td>%s</td></tr>
                <tr><td style="padding:4px 12px 4px 0;"><strong>Professional</strong></td><td>%s</td></tr>
                <tr><td style="padding:4px 12px 4px 0;"><strong>When</strong></td><td>%s</td></tr>
                </table>
                <p style="font-size:0.9rem;color:#555;">Need to change your visit? Use <em>My bookings</em> in the app or contact the salon.</p>
                </body></html>
                """
                .formatted(
                        escape(a.getCustomer().getName()),
                        escape(a.getClinic().getBusinessName()),
                        escape(a.getService().getName()),
                        escape(a.getStaff().getDisplayName()),
                        escape(FMT.format(when)));
    }

    private String reminderHtml(Appointment a, ZonedDateTime apptLocal) {
        return """
                <!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;">
                <h2 style="color:#6b4f2a;">Today is your appointment</h2>
                <p>Hi %s,</p>
                <p>This is a friendly reminder from <strong>%s</strong>.</p>
                <p><strong>%s</strong> with <strong>%s</strong><br/>%s</p>
                <p style="font-size:0.9rem;color:#555;">We look forward to seeing you.</p>
                </body></html>
                """
                .formatted(
                        escape(a.getCustomer().getName()),
                        escape(a.getClinic().getBusinessName()),
                        escape(a.getService().getName()),
                        escape(a.getStaff().getDisplayName()),
                        escape(FMT.format(apptLocal)));
    }

    private static String escape(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
