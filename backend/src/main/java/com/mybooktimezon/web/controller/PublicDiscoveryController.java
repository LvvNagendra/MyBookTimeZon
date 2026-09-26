package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.service.PublicDiscoveryService;
import com.mybooktimezon.web.dto.response.ClinicPublicSummaryDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/public/clinics")
@Tag(name = "Public discovery", description = "Search salons by country, state, city, area, or keyword.")
@RequiredArgsConstructor
public class PublicDiscoveryController {

    private final PublicDiscoveryService publicDiscoveryService;

    @GetMapping("/search")
    public ResponseEntity<ResponseMessage<List<ClinicPublicSummaryDto>>> search(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String village,
            @RequestParam(required = false) String q) {
        List<ClinicPublicSummaryDto> data =
                publicDiscoveryService.searchClinics(country, state, city, village, q);
        return ResponseEntity.ok(
                ResponseMessageFactory.success(HttpStatus.OK, "Clinics", data, data.size()));
    }
}
