package com.mybooktimezon.schedule;

import com.mybooktimezon.config.NotificationProperties;
import com.mybooktimezon.domain.entity.Appointment;
import com.mybooktimezon.domain.enums.AppointmentStatus;
import com.mybooktimezon.repository.AppointmentRepository;
import com.mybooktimezon.service.BookingEmailService;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AppointmentReminderScheduler {

    private static final Logger log = LogManager.getLogger(AppointmentReminderScheduler.class);

    private final AppointmentRepository appointmentRepository;
    private final BookingEmailService bookingEmailService;
    private final NotificationProperties notificationProperties;

    @Scheduled(cron = "0 */10 * * * *")
    public void sendMorningReminders() {
        if (!notificationProperties.isDayReminderEmailEnabled()) {
            return;
        }
        Instant from = Instant.now();
        Instant to = from.plus(36, ChronoUnit.HOURS);
        List<Appointment> cands =
                appointmentRepository.findReminderCandidates(
                        List.of(AppointmentStatus.CONFIRMED, AppointmentStatus.REQUESTED), from, to);
        for (Appointment a : cands) {
            try {
                bookingEmailService.sendDayReminderIfDue(a.getId());
            } catch (Exception e) {
                log.warn("Reminder processing failed for {}", a.getId(), e);
            }
        }
    }
}
