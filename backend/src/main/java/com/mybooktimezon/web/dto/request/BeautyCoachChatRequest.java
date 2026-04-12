package com.mybooktimezon.web.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class BeautyCoachChatRequest {

    @NotBlank
    @Size(max = 4000)
    private String message;

    /** Nested type keeps Jackson + Bean Validation on a single class (avoids classpath edge cases). */
    @Valid
    @Size(max = 40)
    private List<ChatTurn> history = new ArrayList<>();

    @Data
    public static class ChatTurn {
        @NotBlank
        @Pattern(regexp = "user|assistant", message = "role must be user or assistant")
        private String role;

        @NotBlank
        @Size(max = 8000)
        private String content;
    }
}
