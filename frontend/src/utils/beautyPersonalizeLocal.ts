import type { BeautyCoachPersonalizeResult } from "../api/client";

/** Structured tips when the LLM proxy is unavailable (no API key / mock). */
export function localPersonalize(input: {
  faceShapeCategory?: string | null;
  faceShapeDetail?: string | null;
  hairConcern?: string | null;
  skinOrMakeupNotes?: string | null;
}): BeautyCoachPersonalizeResult & { offline?: boolean } {
  const shape = (input.faceShapeCategory || input.faceShapeDetail || "Oval").toLowerCase();
  const hair = (input.hairConcern || "").toLowerCase();
  const skin = (input.skinOrMakeupNotes || "").toLowerCase();

  let suggestedHaircuts = ["Soft layers", "Side fringe", "Textured bob", "Long curtain bangs"];
  if (shape.includes("round") || shape.includes("soft")) {
    suggestedHaircuts = ["Long layers with height", "Side part + soft fringe", "Angled bob", "Face-framing pieces"];
  } else if (shape.includes("narrow") || shape.includes("heart") || shape.includes("elong")) {
    suggestedHaircuts = ["Chin-length bob", "Soft waves at cheekbones", "Blunt fringe (if preferred)", "Shoulder layers"];
  } else if (shape.includes("square") || shape.includes("angular")) {
    suggestedHaircuts = ["Soft waves", "Rounded fringe", "Layered mid-length", "Side-swept style"];
  }

  const hairHealthTips = [
    hair.includes("frizz")
      ? "Use a leave-in or light serum on damp hair; avoid rough towel-drying."
      : "Limit hot tools; apply heat protectant when you do style.",
    hair.includes("thin")
      ? "Avoid tight ponytails; ask about volumizing cuts at the crown."
      : "Trim ends regularly to reduce split-end travel.",
    "Wide-tooth comb on wet hair; silk or satin pillowcases can reduce friction.",
  ];

  const productCategories = [
    "Sulfate-free shampoo",
    hair.includes("colour") || hair.includes("color") ? "Bond-repair / colour-safe mask" : "Weekly hydrating mask",
    "Heat protectant spray",
    skin.includes("oily") ? "Oil-control gel moisturizer" : "Barrier cream / ceramide moisturizer",
  ];

  const facialTips = [
    "SPF 30+ every morning — non-negotiable for tone evenness.",
    skin.includes("acne")
      ? "Keep makeup non-comedogenic; patch-test actives like salicylic acid."
      : "Cream blush on the apples of cheeks softens most face shapes.",
    "Brow gel or soft fill lifts the frame without heavy contour.",
    skin.includes("dry") ? "Layer hydrating serum under moisturizer before makeup." : "Blot T-zone midday if shiny — skip full powder re-do.",
  ];

  return {
    suggestedHaircuts,
    hairHealthTips,
    productCategories,
    facialTips,
    disclaimer:
      "Offline / local coach tips — general beauty education only, not a medical diagnosis. See a dermatologist or trichologist for persistent issues.",
    offline: true,
  };
}
