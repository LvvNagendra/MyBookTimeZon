/**
 * @deprecated Import from `lib/hairstyle/HairRenderer` for new code.
 * Re-exports contour renderer with legacy `styleId` string signature for existing callers.
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { drawHairComposite as drawHairCompositeImpl, optionsFromStyleId } from "./hairstyle/HairRenderer";
import type { HairBBox } from "./hairstyle/types";

export type { HairBBox };

export function drawHairComposite(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[] | null | undefined,
  canvasW: number,
  canvasH: number,
  fallbackBox: HairBBox | null | undefined,
  styleId: string,
  faceCategory: string | null,
  renderOpts?: { opacity?: number; tintHex?: string | null; applyHeadRotation?: boolean },
): void {
  const opacity = renderOpts?.opacity ?? 0.85;
  const tintHex = renderOpts?.tintHex ?? null;
  const applyHeadRotation = renderOpts?.applyHeadRotation ?? true;
  drawHairCompositeImpl(
    ctx,
    landmarks,
    canvasW,
    canvasH,
    fallbackBox,
    optionsFromStyleId(styleId, faceCategory, opacity, tintHex, applyHeadRotation),
  );
}
