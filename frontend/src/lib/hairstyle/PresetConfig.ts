/**
 * Hairstyle presets: length / texture / cut labels drive numeric tuning for the contour renderer.
 * Each preset maps to lift (vertical shell), width spread, optional waves, and asymmetry (side-part feel).
 */

export type HairLength = "short" | "medium" | "long";
export type HairTexture = "straight" | "curly";
export type HairCut = "fade" | "layered" | "parted" | "waves";

export type HairPreset = {
  id: string;
  name: string;
  tagline: string;
  faceShapeHint: "Oval" | "Round" | "Heart" | "Square";
  length: HairLength;
  texture: HairTexture;
  cut: HairCut;
  /** Base lift as fraction of face height (forehead–chin). */
  liftFactor: number;
  /** Extra horizontal spread vs neutral hair arc (1 = default). */
  widthScale: number;
  /** Stretches the lifted shell vertically (round faces → often >1). */
  volumeScaleY: number;
  /** -1…1 shifts the right side of the arc for parted / asymmetric cuts. */
  asymmetry: number;
  /** Wiggle amplitude along the arc in units of face height (curly / waves). */
  waveAmplitude: number;
  /** Extra frequency for wave wiggle (higher = tighter ripples). */
  waveFrequency: number;
};

export const HAIR_PRESETS: HairPreset[] = [
  {
    id: "h1",
    name: "Soft Layer Cut",
    tagline: "Balanced volume · everyday",
    faceShapeHint: "Oval",
    length: "medium",
    texture: "straight",
    cut: "layered",
    liftFactor: 0.48,
    widthScale: 1.03,
    volumeScaleY: 1.0,
    asymmetry: 0,
    waveAmplitude: 0,
    waveFrequency: 0,
  },
  {
    id: "h2",
    name: "Textured Crop",
    tagline: "Short fade · clean sides",
    faceShapeHint: "Round",
    length: "short",
    texture: "straight",
    cut: "fade",
    liftFactor: 0.22,
    widthScale: 1.08,
    volumeScaleY: 1.12,
    asymmetry: 0.02,
    waveAmplitude: 0.015,
    waveFrequency: 2.4,
  },
  {
    id: "h3",
    name: "Classic Side Part",
    tagline: "Asymmetric sweep",
    faceShapeHint: "Oval",
    length: "medium",
    texture: "straight",
    cut: "parted",
    liftFactor: 0.4,
    widthScale: 0.98,
    volumeScaleY: 0.96,
    asymmetry: 0.38,
    waveAmplitude: 0.01,
    waveFrequency: 1.5,
  },
  {
    id: "h4",
    name: "Long Waves",
    tagline: "Length + movement",
    faceShapeHint: "Heart",
    length: "long",
    texture: "curly",
    cut: "waves",
    liftFactor: 0.66,
    widthScale: 1.05,
    volumeScaleY: 1.08,
    asymmetry: 0.06,
    waveAmplitude: 0.055,
    waveFrequency: 3.2,
  },
];

export function getHairPreset(id: string): HairPreset {
  return HAIR_PRESETS.find((p) => p.id === id) ?? HAIR_PRESETS[0];
}

/** Face-shape group from salon hints → width / volume tweaks on top of preset. */
export function shapeTuning(faceCategory: string | null): { widthMul: number; volumeMul: number } {
  if (faceCategory === "Round") return { widthMul: 1.06, volumeMul: 1.1 };
  if (faceCategory === "Heart") return { widthMul: 0.94, volumeMul: 0.92 };
  if (faceCategory === "Square") return { widthMul: 1.04, volumeMul: 0.88 };
  return { widthMul: 1, volumeMul: 1 };
}
