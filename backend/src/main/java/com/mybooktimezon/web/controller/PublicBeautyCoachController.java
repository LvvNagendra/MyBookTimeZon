package com.mybooktimezon.web.controller;

import com.mybooktimezon.common.response.ResponseMessage;
import com.mybooktimezon.common.response.ResponseMessageFactory;
import com.mybooktimezon.config.ApiConstants;
import com.mybooktimezon.service.BeautyCoachService;
import com.mybooktimezon.web.dto.request.BeautyCoachChatRequest;
import com.mybooktimezon.web.dto.request.BeautyCoachPersonalizeRequest;
import com.mybooktimezon.web.dto.response.BeautyCoachChatResponseDto;
import com.mybooktimezon.web.dto.response.BeautyCoachPersonalizeResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
/**
 * Not under {@code /public/{businessType}/{slug}} — that pattern is used by public booking and would match
 * {@code POST /public/beauty-coach/chat} as GET-only, causing HTTP 405.
 */
@RequestMapping(ApiConstants.API_V1_PREFIX + "/beauty-coach")
@Tag(name = "Beauty coach", description = "LLM-backed hair, beard, and skincare tips (OpenAI-compatible API).")
@RequiredArgsConstructor
public class PublicBeautyCoachController {

    private final BeautyCoachService beautyCoachService;

    @PostMapping("/chat")
    @Operation(summary = "Chat with the beauty coach")
    public ResponseEntity<ResponseMessage<BeautyCoachChatResponseDto>> chat(
            @Valid @RequestBody BeautyCoachChatRequest request) {
        BeautyCoachChatResponseDto data = beautyCoachService.chat(request);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "OK", data));
    }

    @PostMapping("/personalize")
    @Operation(summary = "Structured hair & skin suggestions from coarse face context (no photo upload)")
    public ResponseEntity<ResponseMessage<BeautyCoachPersonalizeResponseDto>> personalize(
            @Valid @RequestBody BeautyCoachPersonalizeRequest request) {
        BeautyCoachPersonalizeResponseDto data = beautyCoachService.personalize(request);
        return ResponseEntity.ok(ResponseMessageFactory.success(HttpStatus.OK, "OK", data));
    }
}
