package com.mybooktimezon.service;

import com.mybooktimezon.web.dto.response.ClinicPublicSummaryDto;
import java.util.List;

public interface PublicDiscoveryService {

    /**
     * Search published businesses by structured geography and optional keyword (name, address, specialties).
     */
    List<ClinicPublicSummaryDto> searchClinics(String country, String state, String city, String village, String q);
}
