import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { InferredFaceAttributes } from "./faceDetection";

export type SkinProductIdea = { name: string; rating: number };

export type SkinAnalysisResult = {
  score: number;
  skinType: string;
  concerns: string[];
  routine: string;
  dietTips: string;
  products: SkinProductIdea[];
  facialSuggestion: string;
  /** How the result was produced */
  source: "local-vision" | "coach";
  /** Mean cheek luminance 0–255 (debug / UI) */
  cheekBrightness?: number;
  /** Cheek channel variance proxy */
  toneEvenness?: number;
};

type SampleStats = { meanL: number; variance: number; warmBias: number };

function sampleRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): SampleStats {
  const sx = Math.max(0, Math.floor(x));
  const sy = Math.max(0, Math.floor(y));
  const sw = Math.max(1, Math.floor(w));
  const sh = Math.max(1, Math.floor(h));
  const { data, width, height } = ctx.getImageData(sx, sy, sw, sh);
  let sum = 0;
  let sumSq = 0;
  let warm = 0;
  let n = 0;
  // stride sample for speed
  for (let py = 0; py < height; py += 2) {
    for (let px = 0; px < width; px += 2) {
      const i = (py * width + px) * 4;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sum += l;
      sumSq += l * l;
      warm += r - b;
      n++;
    }
  }
  if (n === 0) return { meanL: 128, variance: 0, warmBias: 0 };
  const meanL = sum / n;
  const variance = Math.max(0, sumSq / n - meanL * meanL);
  return { meanL, variance, warmBias: warm / n };
}

function cheekBoxes(landmarks: NormalizedLandmark[], W: number, H: number) {
  // MediaPipe mesh: 50 left cheek-ish, 280 right cheek-ish; 10 forehead, 152 chin
  const left = landmarks[50] ?? landmarks[234];
  const right = landmarks[280] ?? landmarks[454];
  const size = Math.min(W, H) * 0.08;
  const boxes: { x: number; y: number; w: number; h: number }[] = [];
  if (left) {
    boxes.push({ x: left.x * W - size / 2, y: left.y * H - size / 2, w: size, h: size });
  }
  if (right) {
    boxes.push({ x: right.x * W - size / 2, y: right.y * H - size / 2, w: size, h: size });
  }
  return boxes;
}

/**
 * On-device skin heuristic from face crop pixels + MediaPipe landmarks.
 * No photo leaves the browser. Not a medical diagnosis.
 */
export function analyzeSkinFromCanvas(
  canvas: HTMLCanvasElement,
  landmarks: NormalizedLandmark[] | null,
  attrs: InferredFaceAttributes,
): SkinAnalysisResult {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || attrs.faceCount < 1) {
    return {
      score: 0,
      skinType: "—",
      concerns: ["No face detected"],
      routine: "Upload a clear front-facing photo or start the camera, then run analysis again.",
      dietTips: "Hydration and sleep support overall skin comfort — general wellness only.",
      products: [],
      facialSuggestion: "Detect a face first, then book a facial when ready.",
      source: "local-vision",
    };
  }

  const W = canvas.width;
  const H = canvas.height;
  const boxes =
    landmarks && landmarks.length > 50
      ? cheekBoxes(landmarks, W, H)
      : [
          { x: W * 0.28, y: H * 0.42, w: W * 0.12, h: H * 0.1 },
          { x: W * 0.6, y: H * 0.42, w: W * 0.12, h: H * 0.1 },
        ];

  const samples = boxes.map((b) => sampleRegion(ctx, b.x, b.y, b.w, b.h));
  const meanL = samples.reduce((s, x) => s + x.meanL, 0) / samples.length;
  const variance = samples.reduce((s, x) => s + x.variance, 0) / samples.length;
  const warmBias = samples.reduce((s, x) => s + x.warmBias, 0) / samples.length;

  let skinType = "Combination";
  if (meanL > 175 && variance < 280) skinType = "Normal / balanced";
  else if (meanL > 160 && variance >= 280) skinType = "Combination";
  else if (meanL <= 140) skinType = "Deeper tone · focus on barrier + SPF";
  else if (variance > 500) skinType = "Uneven texture (lighting-sensitive)";
  else if (warmBias > 18) skinType = "Warm / oily T-zone lean";
  else if (warmBias < -8) skinType = "Cool / dry lean";

  const concerns: string[] = [];
  if (variance > 450) concerns.push("Uneven tone or texture in cheek samples");
  if (meanL < 95) concerns.push("Low light — re-scan in brighter light for a clearer read");
  if (meanL > 200) concerns.push("Hot spots / shine — possible oiliness or flash reflection");
  if (attrs.forehead.toLowerCase().includes("forehead")) concerns.push("Forehead visible — good for T-zone checks");
  if (attrs.faceCount > 1) concerns.push("Multiple faces — analysis used the primary face");
  if (!concerns.length) concerns.push("Mild everyday fatigue markers only (demo heuristic)");

  // Score 5.5–9.2 from evenness + clarity
  const evenScore = Math.max(0, 1 - variance / 900);
  const lightScore = meanL > 70 && meanL < 210 ? 1 : 0.55;
  const confBoost = Math.min(1, attrs.confidence);
  const score = Math.round((5.5 + evenScore * 2.8 + lightScore * 0.7 + confBoost * 0.2) * 10) / 10;

  const routine =
    skinType.includes("oily") || warmBias > 18
      ? "AM: gel cleanser → niacinamide → oil-control moisturizer → SPF 30+. PM: double cleanse → lightweight barrier cream. Skip heavy oils this week."
      : skinType.includes("dry") || meanL < 130
        ? "AM: cream cleanser → hydrating serum → rich moisturizer → SPF 30+. PM: cleanse → ceramide cream. Avoid harsh scrubs."
        : "AM: gentle cleanser → vitamin C (optional) → moisturizer → SPF 30+. PM: cleanse → niacinamide → moisturizer. Patch-test new actives.";

  const dietTips =
    "Water through the day, colourful vegetables, and fewer late-night sugary snacks support barrier comfort. This is general wellness — not medical advice.";

  const products: SkinProductIdea[] =
    warmBias > 18
      ? [
          { name: "Oil-control gel moisturizer", rating: 4.6 },
          { name: "Niacinamide 5–10%", rating: 4.7 },
          { name: "SPF 30+ matte", rating: 4.8 },
        ]
      : [
          { name: "SPF 30 gel / cream", rating: 4.8 },
          { name: "Ceramide moisturizer", rating: 4.7 },
          { name: "Gentle cream cleanser", rating: 4.5 },
        ];

  const facialSuggestion =
    score >= 8
      ? "Hydrating facial + LED calm — good maintenance pick at a partner salon or clinic."
      : "Brightening or barrier-repair facial after a short consult — tell the therapist about sensitivities first.";

  return {
    score: Math.min(9.5, Math.max(5, score)),
    skinType,
    concerns,
    routine,
    dietTips,
    products,
    facialSuggestion,
    source: "local-vision",
    cheekBrightness: Math.round(meanL),
    toneEvenness: Math.round(variance),
  };
}
