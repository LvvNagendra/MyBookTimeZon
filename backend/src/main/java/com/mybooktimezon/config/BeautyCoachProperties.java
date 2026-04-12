package com.mybooktimezon.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.beauty-coach")
public class BeautyCoachProperties {

    /** When false, chat returns 503 without calling the provider. */
    private boolean enabled = true;

    /**
     * Which backend to use. {@link BeautyCoachLlmMode#AUTO}: if {@code gemini-api-key} is set, use Gemini; else if the
     * only configured key looks like a Google key ({@code AIza…}), use Gemini; else use OpenAI when an OpenAI-style
     * key is set.
     */
    private BeautyCoachLlmMode llm = BeautyCoachLlmMode.AUTO;

    // --- OpenAI-compatible (application.yml: openai-*) + legacy names (application-dev: api-key, base-url, model) ---

    /** Env {@code OPENAI_API_KEY} via YAML {@code openai-api-key}. */
    private String openaiApiKey = "";

    /** Legacy alias; dev profile may set {@code api-key}. */
    private String apiKey = "";

    private String openaiBaseUrl = "https://api.openai.com/v1";

    /** Legacy alias for OpenAI base URL. */
    private String baseUrl = "";

    private String openaiModel = "gpt-4o-mini";

    /** Legacy alias for OpenAI model id. */
    private String model = "";

    // --- Gemini (OpenAI-compatible Google host) ---

    private String geminiBaseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";

    /** Model id for Gemini OpenAI-compatible API (e.g. gemini-2.0-flash). Never fall back to {@link #openaiModel}. */
    private String geminiModel = "gemini-2.0-flash";

    private String geminiApiKey = "";

    private int maxTokens = 700;

    private double temperature = 0.65;

    private String openaiKeyResolved() {
        return firstNonBlank(openaiApiKey, apiKey);
    }

    private String openaiBaseResolved() {
        return firstNonBlank(openaiBaseUrl, baseUrl, "https://api.openai.com/v1");
    }

    private String openaiModelResolved() {
        return firstNonBlank(openaiModel, model, "gpt-4o-mini");
    }

    /** Resolved vendor after applying {@link #llm} and which keys are set. */
    public BeautyCoachLlmMode resolvedVendor() {
        if (llm == BeautyCoachLlmMode.GEMINI) {
            return BeautyCoachLlmMode.GEMINI;
        }
        if (llm == BeautyCoachLlmMode.OPENAI) {
            return BeautyCoachLlmMode.OPENAI;
        }
        // AUTO: prefer Gemini when that key is set, or Google-shaped key in OpenAI slots
        if (isNotBlank(geminiApiKey)) {
            return BeautyCoachLlmMode.GEMINI;
        }
        String o = openaiKeyResolved();
        if (isNotBlank(o) && looksLikeGoogleApiKey(o)) {
            return BeautyCoachLlmMode.GEMINI;
        }
        if (isNotBlank(o)) {
            return BeautyCoachLlmMode.OPENAI;
        }
        return BeautyCoachLlmMode.OPENAI;
    }

    public String getEffectiveApiKey() {
        if (resolvedVendor() == BeautyCoachLlmMode.GEMINI) {
            if (isNotBlank(geminiApiKey)) {
                return trimToEmpty(geminiApiKey);
            }
            String o = openaiKeyResolved();
            if (isNotBlank(o) && looksLikeGoogleApiKey(o)) {
                return trimToEmpty(o);
            }
            return trimToEmpty(geminiApiKey);
        }
        return trimToEmpty(openaiKeyResolved());
    }

    public String getEffectiveBaseUrl() {
        String raw =
                resolvedVendor() == BeautyCoachLlmMode.GEMINI
                        ? firstNonBlank(
                                geminiBaseUrl, "https://generativelanguage.googleapis.com/v1beta/openai")
                        : openaiBaseResolved();
        return raw == null ? "" : raw.replaceAll("/$", "");
    }

    public String getEffectiveModel() {
        if (resolvedVendor() == BeautyCoachLlmMode.GEMINI) {
            return firstNonBlank(geminiModel, "gemini-2.0-flash");
        }
        return openaiModelResolved();
    }

    private static boolean isNotBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String trimToEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    private static String firstNonBlank(String... parts) {
        if (parts == null) {
            return "";
        }
        for (String p : parts) {
            if (p != null && !p.isBlank()) {
                return p.trim();
            }
        }
        return "";
    }

    /** Google AI Studio keys typically start with {@code AIza}; they must not be sent to api.openai.com. */
    private static boolean looksLikeGoogleApiKey(String s) {
        return s != null && s.trim().startsWith("AIza");
    }
}
