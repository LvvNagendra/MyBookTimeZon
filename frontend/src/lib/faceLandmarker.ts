import {
  FaceLandmarker,
  FilesetResolver,
  type BoundingBox,
  type Category,
  type Detection,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import type { InferredFaceAttributes } from "./faceDetection";

const MP_VERSION = "0.10.14";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;
let landmarkerVideoPromise: Promise<FaceLandmarker> | null = null;

function createLandmarkerOptions(runningMode: "IMAGE" | "VIDEO") {
  return {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: "GPU" as const,
    },
    runningMode,
    numFaces: 4,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };
}

async function createLandmarkerWithFallback(runningMode: "IMAGE" | "VIDEO"): Promise<FaceLandmarker> {
  const wasm = await FilesetResolver.forVisionTasks(WASM_BASE);
  const opts = createLandmarkerOptions(runningMode);
  try {
    return await FaceLandmarker.createFromOptions(wasm, opts);
  } catch {
    return FaceLandmarker.createFromOptions(wasm, {
      ...opts,
      baseOptions: { ...opts.baseOptions, delegate: "CPU" },
    });
  }
}

/** Single-frame / upload detection (`detect`). */
export async function loadFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = createLandmarkerWithFallback("IMAGE");
  }
  return landmarkerPromise;
}

/** Webcam path: `detectForVideo` for temporal smoothing (same model, VIDEO running mode). */
export async function loadFaceLandmarkerVideo(): Promise<FaceLandmarker> {
  if (!landmarkerVideoPromise) {
    landmarkerVideoPromise = createLandmarkerWithFallback("VIDEO");
  }
  return landmarkerVideoPromise;
}

/**
 * MediaPipe VIDEO mode expects `detectForVideo` on **every** (or nearly every) frame with a timestamp that never
 * decreases. Throttling to ~15fps causes jumpy overlays; async gaps let timestamps stall — both feel “not live”.
 */
let videoLandmarkerTimestampMs = 0;

export function nextVideoLandmarkerTimestamp(): number {
  const t = Math.round(performance.now());
  videoLandmarkerTimestampMs = Math.max(videoLandmarkerTimestampMs + 1, t);
  return videoLandmarkerTimestampMs;
}

export type VideoFaceLandmarkResult = {
  all: NormalizedLandmark[][];
  primary: NormalizedLandmark[] | null;
};

/** One synchronous video frame — prefer `HTMLVideoElement` (no extra canvas copy). */
export function detectVideoFrame(
  landmarker: FaceLandmarker,
  frame: HTMLVideoElement | HTMLCanvasElement,
): VideoFaceLandmarkResult {
  const ts = nextVideoLandmarkerTimestamp();
  const { faceLandmarks } = landmarker.detectForVideo(frame, ts);
  return {
    all: faceLandmarks,
    primary: pickPrimaryLandmarks(faceLandmarks),
  };
}

/** Tight axis-aligned box around all landmarks (pixels). */
export function boundingBoxFromLandmarks(landmarks: NormalizedLandmark[], canvasW: number, canvasH: number): BoundingBox {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const l of landmarks) {
    minX = Math.min(minX, l.x);
    minY = Math.min(minY, l.y);
    maxX = Math.max(maxX, l.x);
    maxY = Math.max(maxY, l.y);
  }
  const originX = minX * canvasW;
  const originY = minY * canvasH;
  const width = (maxX - minX) * canvasW;
  const height = (maxY - minY) * canvasH;
  return { originX, originY, width, height, angle: 0 };
}

const faceCat: Category = {
  score: 0.92,
  index: 0,
  categoryName: "face",
  displayName: "Face",
};

export function detectionsFromLandmarks(
  faceLandmarks: NormalizedLandmark[][],
  canvasW: number,
  canvasH: number,
): Detection[] {
  return faceLandmarks.map((lm) => ({
    categories: [{ ...faceCat, score: 0.9 }],
    boundingBox: boundingBoxFromLandmarks(lm, canvasW, canvasH),
    keypoints: [],
  }));
}

/** Largest face by normalized bounding area (stable primary subject in group shots). */
export function pickPrimaryLandmarks(faces: NormalizedLandmark[][]): NormalizedLandmark[] | null {
  if (!faces.length) return null;
  if (faces.length === 1) return faces[0];
  let bestIdx = 0;
  let bestArea = -1;
  const W = 1000;
  faces.forEach((lm, i) => {
    const b = boundingBoxFromLandmarks(lm, W, W);
    const area = b.width * b.height;
    if (area > bestArea) {
      bestArea = area;
      bestIdx = i;
    }
  });
  return faces[bestIdx] ?? null;
}

export function inferFaceAttributesFromLandmarks(
  faceLandmarks: NormalizedLandmark[][],
  canvasW: number,
  canvasH: number,
): InferredFaceAttributes {
  if (!faceLandmarks.length) {
    return {
      faceShape: "—",
      hairThickness: "—",
      forehead: "—",
      hairVolume: "—",
      faceCount: 0,
      confidence: 0,
    };
  }

  const primary = pickPrimaryLandmarks(faceLandmarks);
  const box = primary ? boundingBoxFromLandmarks(primary, canvasW, canvasH) : boundingBoxFromLandmarks(faceLandmarks[0], canvasW, canvasH);
  const ratio = box.width / Math.max(box.height, 1e-6);
  let faceShape = "Oval / balanced";
  if (ratio > 0.82) faceShape = "Softer / rounder";
  else if (ratio < 0.64) faceShape = "Narrower / elongated";
  else if (ratio >= 0.72 && ratio <= 0.82) faceShape = "Angular / square balance";

  const forehead =
    box.originY < box.height * 0.12 ? "Forehead visible in frame" : "Face centered — good for fringe ideas";

  return {
    faceShape,
    hairThickness: "Landmark-aligned preview (MediaPipe Face Landmarker)",
    forehead,
    hairVolume:
      faceLandmarks.length > 1 ? `${faceLandmarks.length} faces — preview uses the primary face` : "Style follows your facial contour",
    faceCount: faceLandmarks.length,
    confidence: 0.9,
  };
}
