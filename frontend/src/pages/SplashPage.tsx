import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const INTRO_KEY = "salongo_intro_done";

type SplashState = { pauseAuto?: boolean } | null;

export default function SplashPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pauseAuto = Boolean((location.state as SplashState)?.pauseAuto);

  useEffect(() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem(INTRO_KEY)) {
      navigate("/", { replace: true });
      return;
    }
    if (pauseAuto) return;
    const t = window.setTimeout(() => navigate("/onboarding", { replace: true }), 2200);
    return () => window.clearTimeout(t);
  }, [navigate, pauseAuto]);

  return (
    <main className="splash">
      <div className="splash__logo" aria-hidden>
        <span className="splash__mark">SG</span>
      </div>
      <h1 className="splash__title">SalonGo</h1>
      <p className="splash__tagline">Look good. Feel great.</p>
      <p className="splash__hint">Premium beauty & grooming — demo UI</p>
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
