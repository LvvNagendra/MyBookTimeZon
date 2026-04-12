/** Offline fallback when the LLM API is unavailable (demo / no server key). */

const KEYWORD_REPLIES: Record<string, string> = {
  "hair fall":
    "For seasonal shedding: gentle shampoo, scalp massage, and a salon treatment every 4–6 weeks. Sulfate-free shampoos can help — patch-test new products.",
  dandruff: "Try a zinc or tea-tree shampoo 2× weekly, avoid very hot water, and book a scalp treatment if flakes persist.",
  beard: "For oval faces, a medium fade with defined cheek lines balances well. Bring reference photos to your stylist.",
  cream: "For combination skin, a light gel moisturizer AM and a barrier cream PM works well — patch-test new actives.",
  frizz: "Layer a leave-in conditioner or light serum on damp hair; avoid rubbing with a rough towel; a keratin-style salon smoothing treatment can help if you want longer-lasting control.",
  makeup:
    "For everyday: even base, soft blush on apples of cheeks, mascara, and a tinted lip. Match undertone (warm/cool) to foundation. For events, add a defined brow and a slightly deeper lip — blend into the jawline to avoid lines.",
  facial:
    "Double-cleanse after heavy sunscreen, exfoliate gently 1–2× weekly, and use SPF daily. For salon facials, tell your therapist about sensitivities first.",
  acne: "Use a mild cleanser and non-comedogenic moisturizer; benzoyl peroxide or salicylic acid can help some people — start slowly and patch-test. See a dermatologist if cystic or painful.",
  thinning:
    "Avoid tight hairstyles that pull; consider volumizing products and scalp-friendly routines. A trichologist or dermatologist can assess persistent thinning — this is general care, not a diagnosis.",
};

export function localFallbackReply(text: string): string {
  const lower = text.toLowerCase();
  for (const key of Object.keys(KEYWORD_REPLIES)) {
    if (lower.includes(key)) return KEYWORD_REPLIES[key];
  }
  return "Quick local tip (no server LLM on this reply). If your app uses VITE_USE_MOCK=true, set it to false and restart Vite so requests reach Spring Boot. If you’re already on the live API, configure OPENAI_API_KEY and/or GEMINI_API_KEY (server only — never in the browser). Try keywords: hair fall, dandruff, frizz, beard, makeup, facial, acne, thinning, moisturizer.";
}
