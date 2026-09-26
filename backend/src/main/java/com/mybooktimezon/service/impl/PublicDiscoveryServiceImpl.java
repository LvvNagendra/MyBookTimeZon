package com.mybooktimezon.service.impl;

import com.mybooktimezon.common.util.ClinicGeoHelper;
import com.mybooktimezon.domain.entity.Clinic;
import com.mybooktimezon.domain.enums.SubscriptionStatus;
import com.mybooktimezon.repository.ClinicRepository;
import com.mybooktimezon.service.PublicDiscoveryService;
import com.mybooktimezon.web.dto.response.ClinicPublicSummaryDto;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.mybooktimezon.common.exception.BusinessException;

@Service
@RequiredArgsConstructor
public class PublicDiscoveryServiceImpl implements PublicDiscoveryService {

    private static final Logger log = LogManager.getLogger(PublicDiscoveryServiceImpl.class);

    private final ClinicRepository clinicRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ClinicPublicSummaryDto> searchClinics(
            String country, String state, String city, String village, String q) {
        try {
            String qn = q != null ? q.trim().toLowerCase(Locale.ROOT) : "";
            return clinicRepository.findAll().stream()
                    .filter(c -> c.getBusinessType() != null)
                    .filter(c -> !c.isTenantSuspended())
                    .filter(c -> c.getSubscriptionStatus() != SubscriptionStatus.SUSPENDED)
                    .filter(c -> matchesGeo(country, c.getCountry()))
                    .filter(c -> matchesGeo(state, c.getState()))
                    .filter(c -> matchesGeo(city, c.getCity()))
                    .filter(c -> matchesGeo(village, c.getVillage()))
                    .filter(c -> qn.isEmpty() || matchesKeyword(c, qn))
                    .map(this::toSummary)
                    .collect(Collectors.toList());
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Discovery search failed", ex);
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Search could not be completed", ex);
        }
    }

    private static boolean matchesGeo(String filter, String field) {
        if (filter == null || filter.isBlank()) {
            return true;
        }
        return field != null && field.trim().equalsIgnoreCase(filter.trim());
    }

    private static boolean matchesKeyword(Clinic c, String qn) {
        String blob =
                String.join(
                                " ",
                                nullToEmpty(c.getBusinessName()),
                                nullToEmpty(c.getSlug()),
                                nullToEmpty(c.getAddress()),
                                nullToEmpty(c.getCity()),
                                nullToEmpty(c.getCountry()),
                                nullToEmpty(c.getState()),
                                nullToEmpty(c.getVillage()),
                                nullToEmpty(c.getDisplayLocation()),
                                nullToEmpty(c.getSpecialties()))
                        .toLowerCase(Locale.ROOT);
        return blob.contains(qn);
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private ClinicPublicSummaryDto toSummary(Clinic c) {
        return ClinicPublicSummaryDto.builder()
                .id(c.getId())
                .businessName(c.getBusinessName())
                .slug(c.getSlug())
                .businessType(c.getBusinessType())
                .address(c.getAddress())
                .city(c.getCity())
                .country(c.getCountry())
                .state(c.getState())
                .village(c.getVillage())
                .displayLocation(ClinicGeoHelper.resolveDisplayLocation(c))
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .build();
    }
}
