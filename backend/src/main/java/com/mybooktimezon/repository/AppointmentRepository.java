package com.mybooktimezon.repository;

import com.mybooktimezon.domain.entity.Appointment;
import com.mybooktimezon.domain.enums.AppointmentStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    @Query(
            """
            select distinct a from Appointment a
            join fetch a.clinic c
            join fetch a.customer cu
            join fetch a.staff st
            join fetch a.service sv
            where a.status in :statuses
            and a.reminderEmailSent = false
            and a.startAt > :from
            and a.startAt < :to
            """)
    List<Appointment> findReminderCandidates(
            @Param("statuses") List<AppointmentStatus> statuses,
            @Param("from") Instant from,
            @Param("to") Instant to);

    List<Appointment> findByClinic_IdOrderByStartAtDesc(UUID clinicId);

    List<Appointment> findByClinic_IdAndStaff_IdOrderByStartAtDesc(UUID clinicId, UUID staffId);

    List<Appointment> findByCustomer_IdOrderByStartAtDesc(UUID customerId);

    Optional<Appointment> findByIdAndClinic_Id(UUID id, UUID clinicId);

    Optional<Appointment> findByIdAndCustomer_Id(UUID id, UUID customerId);

    long countByStartAtGreaterThanEqual(Instant since);

    long countByClinic_IdAndStartAtGreaterThanEqual(UUID clinicId, Instant since);

    @Query(
            """
            SELECT COUNT(a) > 0 FROM Appointment a
            WHERE a.staff.id = :staffId
            AND a.status <> :cancelled
            AND a.startAt < :end
            AND a.endAt > :start
            """)
    boolean existsOverlapping(
            @Param("staffId") UUID staffId,
            @Param("start") Instant start,
            @Param("end") Instant end,
            @Param("cancelled") AppointmentStatus cancelled);
}
