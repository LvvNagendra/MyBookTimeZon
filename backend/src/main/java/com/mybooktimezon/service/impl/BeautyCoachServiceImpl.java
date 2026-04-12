package com.mybooktimezon.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mybooktimezon.common.exception.BusinessException;
import com.mybooktimezon.config.BeautyCoachProperties;
import com.mybooktimezon.service.BeautyCoachService;
import com.mybooktimezon.web.dto.request.BeautyCoachChatRequest;
import com.mybooktimezon.web.dto.request.BeautyCoachPersonalizeRequest;
import com.mybooktimezon.web.dto.response.BeautyCoachChatResponseDto;
import com.mybooktimezon.web.dto.response.BeautyCoachPersonalizeResponseDto;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.StreamSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
public class BeautyCoachServiceImpl implements BeautyCoachService {

    private static final String SYSTEM_PROMPT =
            """
            You are a professional beauty and grooming coach for SalonGo, a salon booking app. \
            Cover haircuts and styling suggestions by face shape (when the user describes their face), \
            hair damage / frizz / thinning care routines (non-medical), beard grooming, scalp comfort, \
            basic skincare and makeup for everyday or events, and facial framing (e.g. brows, contour) as style tips only. \
            You cannot see the user's photo unless they paste a link or describe themselves — ask for a short description if needed. \
            Never prescribe drugs or diagnose disease; suggest seeing a dermatologist or trichologist for persistent symptoms. \
            Prefer gentle, evidence-informed product categories (e.g. sulfate-free, SPF, ceramides) not brand mandates. \
            Keep answers under about 400 words unless the user asks for more. Encourage patch-testing new products and booking \
            licensed professionals for chemical services.""";

    private static final String PERSONALIZE_SYSTEM_PROMPT =
            """
            You are SalonGo's personalization coach. The client sends ONLY coarse face-shape labels derived locally \
            (not medical imaging). Reply with a single JSON object and no markdown fences, keys exactly: \
            suggestedHaircuts (array of 4 short strings), hairHealthTips (array of 3 strings), productCategories \
            (array of 4 generic product category hints, no brand names), facialTips (array of 3 strings for makeup/skin \
            framing only), disclaimer (one string stating this is general wellness/education, not a diagnosis, and to \
            see a dermatologist or trichologist for persistent issues). Non-prescription, non-drug. Keep language practical \
            and inclusive.""";

    private final BeautyCoachProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient beautyCoachRestClient;

    @Override
    public BeautyCoachChatResponseDto chat(BeautyCoachChatRequest request) {
        assertCoachConfigured();
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));

        List<BeautyCoachChatRequest.ChatTurn> history =
                request.getHistory() != null ? request.getHistory() : List.of();
        int start = Math.max(0, history.size() - 24);
        for (int i = start; i < history.size(); i++) {
            BeautyCoachChatRequest.ChatTurn t = history.get(i);
            messages.add(Map.of("role", t.getRole().trim(), "content", t.getContent().trim()));
        }
        messages.add(Map.of("role", "user", "content", request.getMessage().trim()));

        String reply = completeChat(messages);
        return BeautyCoachChatResponseDto.builder().reply(reply.trim()).build();
    }

    @Override
    public BeautyCoachPersonalizeResponseDto personalize(BeautyCoachPersonalizeRequest request) {
        assertCoachConfigured();
        StringBuilder user = new StringBuilder();
        user.append("Face shape category (hint): ")
                .append(blankToDash(request.getFaceShapeCategory()))
                .append("\nDetail: ")
                .append(blankToDash(request.getFaceShapeDetail()))
                .append("\nApprox. faces in frame: ")
                .append(request.getFaceCount() != null ? request.getFaceCount() : "unknown")
                .append("\nHair / scalp concern (user words): ")
                .append(blankToDash(request.getHairConcern()))
                .append("\nSkin or makeup notes: ")
                .append(blankToDash(request.getSkinOrMakeupNotes()));

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", PERSONALIZE_SYSTEM_PROMPT));
        messages.add(Map.of("role", "user", "content", user.toString()));

        String reply = completeChat(messages);
        return parsePersonalizeJson(reply);
    }

    private void assertCoachConfigured() {
        if (!properties.isEnabled()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "Beauty coach is disabled on this server.");
        }
        String key = properties.getEffectiveApiKey();
        if (key == null || key.isBlank()) {
            throw new BusinessException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Beauty coach is not configured. Set OPENAI_API_KEY and/or GEMINI_API_KEY (or app.beauty-coach.openai-api-key / "
                            + "gemini-api-key) on the server. Use BEAUTY_COACH_LLM=OPENAI|GEMINI|AUTO to choose.");
        }
    }

    private static String blankToDash(String s) {
        return s == null || s.isBlank() ? "—" : s.trim();
    }

    private String completeChat(List<Map<String, String>> messages) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.getEffectiveModel());
        body.put("messages", messages);
        body.put("max_tokens", properties.getMaxTokens());
        body.put("temperature", properties.getTemperature());

        String rawJson;
        try {
            rawJson =
                    beautyCoachRestClient
                            .post()
                            .uri("/chat/completions")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getEffectiveApiKey().trim())
                            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .body(objectMapper.writeValueAsString(body))
                            .retrieve()
                            .body(String.class);
        } catch (RestClientException e) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "AI provider request failed: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not complete beauty coach request.", e);
        }

        if (rawJson == null || rawJson.isBlank()) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "Empty response from AI provider.");
        }

        try {
            JsonNode root = objectMapper.readTree(rawJson);
            if (root.hasNonNull("error")) {
                String errMsg = root.path("error").path("message").asText("Unknown provider error");
                throw new BusinessException(HttpStatus.BAD_GATEWAY, "AI provider: " + errMsg);
            }
            String reply =
                    root.path("choices")
                            .path(0)
                            .path("message")
                            .path("content")
                            .asText(null);
            if (reply == null || reply.isBlank()) {
                throw new BusinessException(HttpStatus.BAD_GATEWAY, "Unexpected AI response shape.");
            }
            return reply;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "Could not parse AI response.", e);
        }
    }

    private BeautyCoachPersonalizeResponseDto parsePersonalizeJson(String reply) {
        String json = extractJsonObject(reply);
        if (json != null) {
            try {
                JsonNode n = objectMapper.readTree(json);
                return BeautyCoachPersonalizeResponseDto.builder()
                        .suggestedHaircuts(readStringArray(n.path("suggestedHaircuts")))
                        .hairHealthTips(readStringArray(n.path("hairHealthTips")))
                        .productCategories(readStringArray(n.path("productCategories")))
                        .facialTips(readStringArray(n.path("facialTips")))
                        .disclaimer(
                                n.path("disclaimer").asText(
                                        "General ideas only — not medical advice. See a professional for persistent concerns."))
                        .build();
            } catch (Exception ignored) {
                /* fall through */
            }
        }
        return BeautyCoachPersonalizeResponseDto.builder()
                .suggestedHaircuts(List.of("Soft layers", "Side-swept fringe", "Textured lob", "Blunt cut with movement"))
                .hairHealthTips(List.of("Use lukewarm water", "Wide-tooth comb on wet hair", "Deep condition weekly"))
                .productCategories(List.of("Sulfate-free shampoo", "Lightweight leave-in", "Heat protectant", "Scalp-friendly serum"))
                .facialTips(List.of("SPF daily", "Soft blush placement", "Brow grooming to frame eyes"))
                .disclaimer(
                        "We could not parse the AI reply as JSON; showing safe defaults. "
                                + "This is not a diagnosis — consult a licensed professional for medical concerns.")
                .build();
    }

    private static String extractJsonObject(String reply) {
        String t = reply.trim();
        int start = t.indexOf('{');
        int end = t.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return t.substring(start, end + 1);
        }
        return null;
    }

    private static List<String> readStringArray(JsonNode arr) {
        if (!arr.isArray()) {
            return List.of();
        }
        return StreamSupport.stream(arr.spliterator(), false)
                .map(JsonNode::asText)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
