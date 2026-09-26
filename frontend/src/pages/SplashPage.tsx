import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BrandLogo, BRAND_NAME, BRAND_STORAGE, BRAND_TAGLINE, readStorageKey } from "../components/BrandLogo";

type SplashState = { pauseAuto?: boolean } | null;

export default function SplashPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pauseAuto = Boolean((location.state as SplashState)?.pauseAuto);

  useEffect(() => {
    if (typeof localStorage !== "undefined" && readStorageKey(BRAND_STORAGE.intro, BRAND_STORAGE.legacyIntro)) {
      navigate("/", { replace: true });
      return;
    }
    if (pauseAuto) return;
    const t = window.setTimeout(() => navigate("/onboarding", { replace: true }), 2200);
    return () => window.clearTimeout(t);
  }, [navigate, pauseAuto]);

  return (
    <main className="splash">
      <div className="splash__logo">
        <BrandLogo size="lg" markOnly className="splash__mark-logo" />
      </div>
      <h1 className="splash__title">{BRAND_NAME}</h1>
      <p className="splash__tagline">{BRAND_TAGLINE}</p>
      <p className="splash__hint">Salons &amp; clinics — book the next open slot</p>
      {pauseAuto && (
        <div className="splash__actions">
          <p className="splash__hint splash__hint--narrow">You can review the intro again, or continue the tour.</p>
          <button type="button" className="btn btn--gold btn--wide splash__btn" onClick={() => navigate("/onboarding", { replace: true })}>
            Continue tour
          </button>
        </div>
      )}
    </main>
  );
}
