package com.mybooktimezon.config;

/**
 * Which LLM vendor the beauty coach calls (OpenAI-compatible HTTP only).
 *
 * <p>Gemini uses Google's OpenAI-compatible base URL ({@code .../v1beta/openai}).
 */
public enum BeautyCoachLlmMode {
    /**
     * Prefer {@code GEMINI_API_KEY}; else if the OpenAI slot holds a Google ({@code AIza}) key, use Gemini; else use
     * OpenAI when a non-Google key is set.
     */
    AUTO,
    /** Force OpenAI-compatible host at {@code base-url} with {@code api-key}. */
    OPENAI,
    /** Force Gemini OpenAI-compatible host at {@code gemini-base-url} with {@code gemini-api-key}. */
    GEMINI
}
