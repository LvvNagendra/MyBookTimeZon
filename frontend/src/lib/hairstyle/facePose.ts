/**
 * Head pose from MediaPipe Face Landmarker points (468 topology).
 * Roll = in-plane rotation of the face; used to rotate the hair mask so it stays aligned with ear–ear axis.
 *
 * Indices (canonical face mesh):
 * - 33: left eye outer corner
 * - 263: right eye outer corner
 * Midpoint between eyes is a stable rotation pivot near the bridge.
 */

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

const IDX_LEFT_EYE_OUTER = 33;
const IDX_RIGHT_EYE_OUTER = 263;

function toPx(l: NormalizedLandmark, W: number, H: number) {
  return { x: l.x * W, y: l.y * H };
}

/** Roll angle (radians): positive = head tilted CCW in image coordinates. */
export function headRollRadians(landmarks: NormalizedLandmark[], canvasW: number, canvasH: number): number {
  const n = landmarks.length;
  if (n <= Math.max(IDX_LEFT_EYE_OUTER, IDX_RIGHT_EYE_OUTER)) return 0;
  const L = landmarks[IDX_LEFT_EYE_OUTER];
  const R = landmarks[IDX_RIGHT_EYE_OUTER];
  if (!L || !R) return 0;
  const a = toPx(L, canvasW, canvasH);
  const b = toPx(R, canvasW, canvasH);
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/** Pivot for rotation: midpoint between outer eye corners (pixel space). */
export function headPivotPx(landmarks: NormalizedLandmark[], canvasW: number, canvasH: number): { x: number; y: number } {
  const n = landmarks.length;
  if (n <= Math.max(IDX_LEFT_EYE_OUTER, IDX_RIGHT_EYE_OUTER)) {
    return { x: canvasW * 0.5, y: canvasH * 0.35 };
  }
  const L = landmarks[IDX_LEFT_EYE_OUTER];
  const R = landmarks[IDX_RIGHT_EYE_OUTER];
  if (!L || !R) return { x: canvasW * 0.5, y: canvasH * 0.35 };
  const a = toPx(L, canvasW, canvasH);
  const b = toPx(R, canvasW, canvasH);
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Ear-to-ear distance in pixels (proxy for head width at cheek level). */
export function earToEarWidthPx(landmarks: NormalizedLandmark[], canvasW: number, canvasH: number): number {
  const n = landmarks.length;
  const left = 234;
  const right = 454;
  if (n <= Math.max(left, right)) return canvasW * 0.35;
  const A = landmarks[left];
  const B = landmarks[right];
  if (!A || !B) return canvasW * 0.35;
  const a = toPx(A, canvasW, canvasH);
  const b = toPx(B, canvasW, canvasH);
  return Math.hypot(b.x - a.x, b.y - a.y);
}
