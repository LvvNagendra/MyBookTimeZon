package com.mybooktimezon.service;

import com.mybooktimezon.web.dto.request.BeautyCoachChatRequest;
import com.mybooktimezon.web.dto.request.BeautyCoachPersonalizeRequest;
import com.mybooktimezon.web.dto.response.BeautyCoachChatResponseDto;
import com.mybooktimezon.web.dto.response.BeautyCoachPersonalizeResponseDto;

public interface BeautyCoachService {

    BeautyCoachChatResponseDto chat(BeautyCoachChatRequest request);

    /** Structured hair + skin suggestions from coarse face context (no photo stored server-side in this flow). */
    BeautyCoachPersonalizeResponseDto personalize(BeautyCoachPersonalizeRequest request);
}
