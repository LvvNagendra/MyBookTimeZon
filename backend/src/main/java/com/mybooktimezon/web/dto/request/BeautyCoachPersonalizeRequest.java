package com.mybooktimezon.web.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Face context is derived client-side (e.g. MediaPipe) — never raw landmark arrays. Optional free-text concerns.
 */
@Data
public class BeautyCoachPersonalizeRequest {

    /** Coarse bucket, e.g. Round / Oval / Heart / Square from your UI. */
    @Size(max = 64)
    private String faceShapeCategory;

    /** Longer hint, e.g. detector ratio label. */
    @Size(max = 200)
    private String faceShapeDetail;

    @Min(0)
    @Max(8)
    private Integer faceCount;

    /** User-typed hair or scalp concern (non-diagnostic). */
    @Size(max = 800)
    private String hairConcern;

    /** Optional skin / makeup context (non-medical). */
    @Size(max = 800)
    private String skinOrMakeupNotes;
}
