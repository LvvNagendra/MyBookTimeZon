/**
 * Contour-aligned hair preview on canvas (NOT a static rectangle).
 * Builds a closed path: upper boundary = lifted hairline arc; lower boundary = original hairline arc.
 * Transform stack: translate to pivot → rotate by head roll → scale width/volume from preset + face shape.
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { HairBBox } from "./types";
import { getHairPreset, shapeTuning, type HairPreset } from "./PresetConfig";
import { earToEarWidthPx, headPivotPx, headRollRadians } from "./facePose";

/** Upper face / hairline arc — left temple → crown → right temple (MediaPipe topology subset). */
export const HAIRLINE_LANDMARK_IDX = [234, 127, 162, 21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 356, 454];

export type HairRenderOptions = {
  preset: HairPreset;
  /** Salon coarse category: Round | Oval | Heart | Square */
  faceCategory: string | null;
  /** User blend strength 0.25–1 */
  opacity: number;
  /** Optional tint #RRGGBB — blended into brown hair gradient */
  tintHex: string | null;
  /** Apply head-roll alignment from eye line */
  applyHeadRotation: boolean;
};

function toPx(l: NormalizedLandmark, W: number, H: number) {
  return { x: l.x * W, y: l.y * H };
}

function parseTint(hex: string | null): { r: number; g: number; b: number } | null {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/** Build a warm brown gradient; mid stops lean toward tint when provided. */
function hairGradient(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  bottom: number,
  halfW: number,
  tint: { r: number; g: number; b: number } | null,
) {
  const g = ctx.createLinearGradient(cx - halfW, top, cx + halfW, bottom);
  const t = tint ? 0.22 : 0;
  const m0 = tint ? `rgb(${mix(42, tint.r, t)},${mix(28, tint.g, t)},${mix(22, tint.b, t)})` : "#2a1c16";
  const m1 = tint ? `rgb(${mix(92, tint.r, t)},${mix(64, tint.g, t)},${mix(48, tint.b, t)})` : "#5c4030";
  const m2 = tint ? `rgb(${mix(122, tint.r, t)},${mix(86, tint.g, t)},${mix(68, tint.b, t)})` : "#7a5644";
  g.addColorStop(0, m0);
  g.addColorStop(0.35, m1);
  g.addColorStop(0.55, m2);
  g.addColorStop(1, "#241812");
  return g;
}

function mix(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

/**
 * Draw hair mask from landmarks. Returns false if mesh indices missing.
 * Math: for each hairline sample i, vertical lift L(i) = liftBase * (0.32 + 0.68*sin(π*i/(n-1)))
 * so crown is highest; sides taper. widthScale widens the arc; asymmetry shifts x by side * fh.
 */
export function drawHairFromLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  W: number,
  H: number,
  options: HairRenderOptions,
): boolean {
  const maxIdx = Math.max(...HAIRLINE_LANDMARK_IDX);
  if (landmarks.length <= maxIdx || !landmarks[152] || !landmarks[10]) return false;

  const preset = options.preset;
  const tune = shapeTuning(options.faceCategory);
  const fh = Math.abs(landmarks[152].y - landmarks[10].y) * H;
  if (fh < 10) return false;

  const earW = earToEarWidthPx(landmarks, W, H);
  const widthNorm = Math.min(1.15, earW / Math.max(fh * 1.1, 1));

  let liftBase = preset.liftFactor * fh * preset.volumeScaleY * tune.volumeMul;
  const ws = preset.widthScale * widthNorm * tune.widthMul;
  const n = HAIRLINE_LANDMARK_IDX.length;
  const pts = HAIRLINE_LANDMARK_IDX.map((i) => toPx(landmarks[i], W, H));
  const cxArc = (pts[0].x + pts[n - 1].x) / 2;

  let topPts = pts.map((p, i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1);
    const bell = Math.sin(Math.PI * t);
    let lift = liftBase * (0.32 + 0.68 * bell);
    let x = cxArc + (p.x - cxArc) * (1 + (ws - 1) * bell);
    let y = p.y - lift;
    const side = t - 0.5;
    x += preset.asymmetry * fh * (0.35 + side * side);
    if (preset.waveAmplitude > 0) {
      y -= Math.sin(t * Math.PI * preset.waveFrequency) * fh * preset.waveAmplitude;
    }
    if (preset.cut === "fade" || preset.length === "short") {
      y += liftBase * 0.28 * (1 - bell);
    }
    return { x, y };
  });

  const minTopY = Math.min(...topPts.map((p) => p.y));
  const maxLowY = Math.max(...pts.map((p) => p.y));
  let halfW = Math.max(...topPts.map((p) => Math.abs(p.x - cxArc))) * 1.12;

  const pivot = options.applyHeadRotation ? headPivotPx(landmarks, W, H) : { x: cxArc, y: (minTopY + maxLowY) / 2 };
  const roll = options.applyHeadRotation ? headRollRadians(landmarks, W, H) : 0;

  const tint = parseTint(options.tintHex);
  const alphaMain = Math.min(0.92, Math.max(0.22, options.opacity * 0.62));
  const alphaSoft = Math.min(0.5, alphaMain * 0.48);

  ctx.save();
  ctx.translate(pivot.x, pivot.y);
  ctx.rotate(roll);
  ctx.translate(-pivot.x, -pivot.y);

  ctx.beginPath();
  ctx.moveTo(topPts[0].x, topPts[0].y);
  for (let i = 1; i < n; i++) {
    ctx.lineTo(topPts[i].x, topPts[i].y);
  }
  for (let i = n - 1; i >= 0; i--) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();

  ctx.fillStyle = hairGradient(ctx, cxArc, minTopY, maxLowY, halfW, tint);
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = alphaMain;
  ctx.fill();

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = alphaSoft;
  ctx.fillStyle = hairGradient(ctx, cxArc, minTopY, maxLowY, halfW * 0.9, tint);
  ctx.fill();

  ctx.restore();
  return true;
}

/** Try contour hair; fall back to soft blob in bounding box (still curved, not axis-aligned rectangle). */
export function drawHairComposite(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[] | null | undefined,
  canvasW: number,
  canvasH: number,
  fallbackBox: HairBBox | null | undefined,
  options: HairRenderOptions,
): void {
  if (landmarks?.length && drawHairFromLandmarks(ctx, landmarks, canvasW, canvasH, options)) {
    return;
  }
  if (fallbackBox) {
    drawHairStyleOverlay(ctx, fallbackBox, options);
  }
}

/* —— legacy-style blob fallback (Bezier “cap”, not a plain rect) —— */

function faceWidthScale(faceCategory: string | null): number {
  const t = shapeTuning(faceCategory);
  return t.widthMul;
}

function pathSoftLayers(ctx: CanvasRenderingContext2D, b: HairBBox, ws: number, preset: HairPreset) {
  const { originX: ox, originY: oy, width: w, height: h } = b;
  const cx = ox + w / 2 + preset.asymmetry * w * 0.08;
  const hw = w * 0.72 * ws * preset.widthScale;
  const top = oy - h * (0.42 + preset.liftFactor * 0.35);
  const bottom = oy + h * 0.12;
  ctx.moveTo(cx - hw, bottom);
  ctx.bezierCurveTo(cx - hw * 0.9, oy - h * 0.05, cx - hw * 0.5, top + h * 0.08, cx, top);
  ctx.bezierCurveTo(cx + hw * 0.5, top + h * 0.08, cx + hw * 0.9, oy - h * 0.05, cx + hw, bottom);
  ctx.bezierCurveTo(cx + hw * 0.75, oy + h * 0.08, cx + hw * 0.35, oy + h * 0.1, cx, oy + h * 0.08);
  ctx.bezierCurveTo(cx - hw * 0.35, oy + h * 0.1, cx - hw * 0.75, oy + h * 0.08, cx - hw, bottom);
  ctx.closePath();
}

function pathCrop(ctx: CanvasRenderingContext2D, b: HairBBox, ws: number, preset: HairPreset) {
  const { originX: ox, originY: oy, width: w, height: h } = b;
  const cx = ox + w / 2;
  const hw = w * 0.58 * ws * preset.widthScale;
  const top = oy - h * (0.18 + preset.liftFactor * 0.2);
  const bottom = oy + h * 0.1;
  ctx.moveTo(cx - hw, bottom);
  ctx.quadraticCurveTo(cx - hw * 0.95, top + h * 0.05, cx - hw * 0.4, top);
  ctx.quadraticCurveTo(cx, top - h * 0.04, cx + hw * 0.4, top);
  ctx.quadraticCurveTo(cx + hw * 0.95, top + h * 0.05, cx + hw, bottom);
  ctx.quadraticCurveTo(cx, oy + h * 0.06, cx - hw, bottom);
  ctx.closePath();
}

function pathSidePart(ctx: CanvasRenderingContext2D, b: HairBBox, ws: number, preset: HairPreset) {
  const { originX: ox, originY: oy, width: w, height: h } = b;
  const cx = ox + w / 2 - w * 0.06;
  const hw = w * 0.68 * ws * preset.widthScale;
  const top = oy - h * (0.32 + preset.liftFactor * 0.28);
  const bottom = oy + h * 0.11;
  ctx.moveTo(cx - hw * 0.85, bottom);
  ctx.bezierCurveTo(cx - hw, oy - h * 0.02, cx - hw * 0.3, top, cx + hw * 0.15, top - h * 0.02);
  ctx.bezierCurveTo(cx + hw * 0.85, top + h * 0.06, cx + hw, oy, cx + hw * 0.95, bottom);
  ctx.bezierCurveTo(cx + hw * 0.4, oy + h * 0.1, cx, oy + h * 0.08, cx - hw * 0.5, oy + h * 0.06);
  ctx.closePath();
}

function pathLongWaves(ctx: CanvasRenderingContext2D, b: HairBBox, ws: number, preset: HairPreset) {
  const { originX: ox, originY: oy, width: w, height: h } = b;
  const cx = ox + w / 2;
  const hw = w * 0.78 * ws * preset.widthScale;
  const top = oy - h * (0.48 + preset.liftFactor * 0.35);
  const bottom = oy + h * 0.14;
  ctx.moveTo(cx - hw, bottom);
  ctx.bezierCurveTo(cx - hw * 0.95, oy + h * 0.02, cx - hw * 0.55, top + h * 0.15, cx - hw * 0.25, top);
  ctx.bezierCurveTo(cx - hw * 0.1, top - h * 0.04, cx + hw * 0.1, top - h * 0.04, cx + hw * 0.25, top);
  ctx.bezierCurveTo(cx + hw * 0.55, top + h * 0.15, cx + hw * 0.95, oy + h * 0.02, cx + hw, bottom);
  ctx.bezierCurveTo(cx + hw * 0.55, oy + h * 0.12, cx, oy + h * 0.1, cx - hw * 0.55, oy + h * 0.12);
  ctx.closePath();
}

function drawHairStyleOverlay(ctx: CanvasRenderingContext2D, box: HairBBox, options: HairRenderOptions): void {
  const ws = faceWidthScale(options.faceCategory) * options.preset.widthScale;
  const { originY: oy, height: h, originX: ox, width: w } = box;
  const cx = ox + w / 2;
  const top = oy - h * 0.65;
  const bottom = oy + h * 0.15;
  const halfW = box.width * 0.85 * ws;
  const preset = options.preset;
  const tint = parseTint(options.tintHex);
  const alphaMain = Math.min(0.85, Math.max(0.2, options.opacity * 0.55));

  ctx.save();
  ctx.beginPath();
  switch (preset.cut) {
    case "fade":
      pathCrop(ctx, box, ws, preset);
      break;
    case "parted":
      pathSidePart(ctx, box, ws, preset);
      break;
    case "waves":
      pathLongWaves(ctx, box, ws, preset);
      break;
    case "layered":
    default:
      pathSoftLayers(ctx, box, ws, preset);
      break;
  }
  ctx.fillStyle = hairGradient(ctx, cx, top, bottom, halfW, tint);
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = alphaMain;
  ctx.fill();
  ctx.restore();
}

/** Adapter: legacy string style id → HairRenderOptions. */
export function optionsFromStyleId(
  styleId: string,
  faceCategory: string | null,
  opacity: number,
  tintHex: string | null,
  applyHeadRotation: boolean,
): HairRenderOptions {
  return {
    preset: getHairPreset(styleId),
    faceCategory,
    opacity,
    tintHex,
    applyHeadRotation,
  };
}
