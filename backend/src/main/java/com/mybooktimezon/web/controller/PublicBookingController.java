package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.domain.enums.BusinessType;
import com.mybooktimezon.service.PublicBookingService;
import com.mybooktimezon.web.dto.request.PublicBookAppointmentRequest;
import com.mybooktimezon.web.dto.response.BookAppointmentResultDto;
import com.mybooktimezon.web.dto.response.PublicBusinessPageDto;
import com.mybooktimezon.web.dto.response.TimeSlotDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiConstants.API_V1_PREFIX + "/public/{businessType}/{slug}")
@Tag(name = "Public booking", description = "Customer-facing booking by business category and slug.")
@RequiredArgsConstructor
public class PublicBookingController {

    private final PublicBookingService publicBookingService;

    @GetMapping
    public ResponseEntity<ResponseMessage<PublicBusinessPageDto>> businessPage(@PathVariable BusinessType businessType, @PathVariable String slug) {
        PublicBusinessPageDto data = publicBookingService.getBusinessPage(businessType, slug);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Business", data));
    }

    @GetMapping("/slots")
    public ResponseEntity<ResponseMessage<List<TimeSlotDto>>> slots(
            @PathVariable BusinessType businessType,
            @PathVariable String slug,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam UUID serviceId,
            @RequestParam UUID staffId) {
        List<TimeSlotDto> data = publicBookingService.getSlots(businessType, slug, date, serviceId, staffId);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "Slots", data));
    }

    @PostMapping("/book")
    public ResponseEntity<ResponseMessage<BookAppointmentResultDto>> book(
            @PathVariable BusinessType businessType,
            @PathVariable String slug,
            @Valid @RequestBody PublicBookAppointmentRequest request) {
        BookAppointmentResultDto data = publicBookingService.book(businessType, slug, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseMessageFactory.success(HttpStatus.CREATED, "Booked", data));
    }
}
