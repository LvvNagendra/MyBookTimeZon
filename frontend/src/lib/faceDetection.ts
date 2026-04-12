import { FaceDetector, FilesetResolver, type Detection } from "@mediapipe/tasks-vision";

const MP_VERSION = "0.10.14";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

let detectorPromise: Promise<FaceDetector> | null = null;

export type InferredFaceAttributes = {
  faceShape: string;
  hairThickness: string;
  forehead: string;
  hairVolume: string;
  faceCount: number;
  confidence: number;
};

export async function loadFaceDetector(): Promise<FaceDetector> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const wasm = await FilesetResolver.forVisionTasks(WASM_BASE);
      const opts = {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU" as const,
        },
        runningMode: "IMAGE" as const,
        minDetectionConfidence: 0.5,
        minSuppressionThreshold: 0.3,
      };
      try {
        return await FaceDetector.createFromOptions(wasm, opts);
      } catch {
        return FaceDetector.createFromOptions(wasm, {
          ...opts,
          baseOptions: { ...opts.baseOptions, delegate: "CPU" },
        });
      }
    })();
  }
  return detectorPromise;
}

export function inferFaceAttributes(detections: Detection[]): InferredFaceAttributes {
  if (!detections.length) {
    return {
      faceShape: "—",
      hairThickness: "—",
      forehead: "—",
      hairVolume: "—",
      faceCount: 0,
      confidence: 0,
    };
  }

  const d = detections[0];
  const box = d.boundingBox;
  const score = d.categories[0]?.score ?? 0;

  if (!box) {
    return {
      faceShape: "—",
      hairThickness: "—",
      forehead: "—",
      hairVolume: "—",
      faceCount: detections.length,
      confidence: score,
    };
  }

  const ratio = box.width / Math.max(box.height, 1e-6);
  let faceShape = "Oval / balanced";
  if (ratio > 0.82) faceShape = "Softer / rounder";
  else if (ratio < 0.64) faceShape = "Narrower / elongated";

  const hairThickness =
    score >= 0.85 ? "Clear face crop (high detector score)" : score >= 0.65 ? "Typical visibility" : "Low light / try clearer shot";

  const forehead =
    box.originY < box.height * 0.15 ? "Forehead visible in frame" : "Face centered — good for fringe ideas";

  const hairVolume =
    detections.length > 1 ? `${detections.length} faces — pick one in view` : "Style preview works best with one clear face";

  return {
    faceShape,
    hairThickness,
    forehead,
    hairVolume,
    faceCount: detections.length,
    confidence: score,
  };
}

/** Maps detector / landmarker hints to salon-style categories for preset tuning. */
export function salonFaceShapeCategory(attrs: InferredFaceAttributes): string | null {
  if (attrs.faceCount === 0) return null;
  const s = attrs.faceShape;
  if (s.startsWith("Softer")) return "Round";
  if (s.startsWith("Narrower")) return "Heart";
  if (s.startsWith("Angular")) return "Square";
  if (s.startsWith("Oval")) return "Oval";
  return "Oval";
}

/** Short line for drawing above the face box (primary face when multiple detected). */
export function faceOverlayLabel(attrs: InferredFaceAttributes): string | undefined {
  if (attrs.faceCount < 1) return undefined;
  const cat = salonFaceShapeCategory(attrs);
  const pct = (attrs.confidence * 100).toFixed(0);
  const suffix = attrs.faceCount > 1 ? " · primary" : "";
  return cat ? `${cat} · ${pct}%${suffix}` : `${attrs.faceShape.slice(0, 24)} · ${pct}%${suffix}`;
}

export function drawFaceBoxes(
  ctx: CanvasRenderingContext2D,
  detections: Detection[],
  options?: { color?: string; label?: string },
) {
  const color = options?.color ?? "rgba(138, 86, 226, 0.95)";
  const label = options?.label;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (const det of detections) {
    const b = det.boundingBox;
    if (!b) continue;
    ctx.strokeRect(b.originX, b.originY, b.width, b.height);
  }
  if (label && detections[0]?.boundingBox) {
    const b = detections[0].boundingBox!;
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillStyle = "rgba(20, 12, 40, 0.92)";
    const pad = 4;
    const tw = ctx.measureText(label).width;
    const lh = 18;
    const lx = b.originX;
    const ly = Math.max(0, b.originY - lh - pad);
    ctx.fillRect(lx, ly, tw + pad * 2, lh);
    ctx.fillStyle = "#f5f0ff";
    ctx.fillText(label, lx + pad, ly + lh - 5);
  }
  ctx.restore();
}
