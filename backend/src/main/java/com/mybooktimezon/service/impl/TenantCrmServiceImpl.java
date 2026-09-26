package com.mybooktimezon.service.impl;

import com.mybooktimezon.domain.entity.Appointment;
import com.mybooktimezon.domain.entity.UserAccount;
import com.mybooktimezon.domain.enums.AppointmentStatus;
import com.mybooktimezon.repository.AppointmentRepository;
import com.mybooktimezon.security.SecurityUserPrincipal;
import com.mybooktimezon.service.TenantCrmService;
import com.mybooktimezon.service.TenantPolicyService;
import com.mybooktimezon.web.dto.response.TenantCustomerDto;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TenantCrmServiceImpl implements TenantCrmService {

    private final AppointmentRepository appointmentRepository;
    private final TenantPolicyService tenantPolicyService;

    @Override
    @Transactional(readOnly = true)
    public List<TenantCustomerDto> listCustomers(UUID clinicId, SecurityUserPrincipal principal) {
        tenantPolicyService.requirePermission(principal, clinicId, "tenant.crm.read");
        List<Appointment> appts = appointmentRepository.findByClinicIdWithCustomerAndService(clinicId);
        Map<UUID, Agg> byCustomer = new HashMap<>();
        for (Appointment a : appts) {
            if (a.getStatus() == AppointmentStatus.CANCELLED) {
                continue;
            }
            UserAccount cu = a.getCustomer();
            if (cu == null) {
                continue;
            }
            Agg agg = byCustomer.computeIfAbsent(cu.getId(), id -> new Agg(cu));
            agg.visitCount++;
            if (agg.lastVisitAt == null || a.getStartAt().isAfter(agg.lastVisitAt)) {
                agg.lastVisitAt = a.getStartAt();
                agg.lastServiceName = a.getService() != null ? a.getService().getName() : null;
                agg.lastStatus = a.getStatus() != null ? a.getStatus().name() : null;
                String note = firstNonBlank(a.getCustomerNotes(), a.getNotes());
                if (note != null) {
                    agg.notes = note;
                }
            }
        }
        List<TenantCustomerDto> out = new ArrayList<>();
        for (Agg agg : byCustomer.values()) {
            out.add(
                    TenantCustomerDto.builder()
                            .customerId(agg.user.getId())
                            .name(agg.user.getName())
                            .email(agg.user.getEmail())
                            .mobile(agg.user.getMobile())
                            .visitCount(agg.visitCount)
                            .lastVisitAt(agg.lastVisitAt)
                            .lastServiceName(agg.lastServiceName)
                            .lastStatus(agg.lastStatus)
                            .notes(agg.notes)
                            .build());
        }
        out.sort(
                Comparator.comparing(
                                (TenantCustomerDto c) -> c.getLastVisitAt() != null ? c.getLastVisitAt() : Instant.EPOCH)
                        .reversed());
        return out;
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a.trim();
        if (b != null && !b.isBlank()) return b.trim();
        return null;
    }

    private static final class Agg {
        final UserAccount user;
        long visitCount;
        Instant lastVisitAt;
        String lastServiceName;
        String lastStatus;
        String notes;

        Agg(UserAccount user) {
            this.user = user;
        }
    }
}
