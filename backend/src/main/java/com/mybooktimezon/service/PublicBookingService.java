package com.mybooktimezon.service;

import com.mybooktimezon.domain.enums.BusinessType;
import com.mybooktimezon.web.dto.request.PublicBookAppointmentRequest;
import com.mybooktimezon.web.dto.response.BookAppointmentResultDto;
import com.mybooktimezon.web.dto.response.PublicBusinessPageDto;
import com.mybooktimezon.web.dto.response.TimeSlotDto;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PublicBookingService {

    PublicBusinessPageDto getBusinessPage(BusinessType businessType, String slug);

    List<TimeSlotDto> getSlots(BusinessType businessType, String slug, LocalDate date, UUID serviceId, UUID staffId);

    BookAppointmentResultDto book(BusinessType businessType, String slug, PublicBookAppointmentRequest request);
}
