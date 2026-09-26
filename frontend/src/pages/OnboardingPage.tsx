import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BRAND_STORAGE } from "../components/BrandLogo";
import { IconChevronLeft } from "../components/CustomerIcons";

const slides = [
  {
    title: "Book the next open slot",
    text: "Salons and clinics on one platform. Pick a business, choose a pro, lock a live time.",
  },
  {
    title: "Trusted professionals",
    text: "See rated stylists and specialists with clear availability — no double-booking guesswork.",
  },
  {
    title: "Style before you book",
    text: "Try AI hair previews and beauty tips, then book the slot that fits your day.",
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);

  function finish() {
    localStorage.setItem(BRAND_STORAGE.intro, "1");
    navigate("/", { replace: true });
  }

  function goBack() {
    if (i > 0) setI((x) => x - 1);
    else navigate("/splash", { state: { pauseAuto: true } });
  }

  return (
    <main className="onboarding">
      <div className="onboarding__top">
        <button type="button" className="onboarding__back" onClick={goBack}>
          <IconChevronLeft width={22} height={22} aria-hidden />
          <span>Back</span>
        </button>
        <div className="onboarding__dots" aria-hidden>
          {slides.map((_, j) => (
            <span key={j} className={`onboarding__dot${j === i ? " onboarding__dot--on" : ""}`} />
          ))}
        </div>
        <button type="button" className="btn btn--text onboarding__skip" onClick={finish}>
          Skip
        </button>
      </div>
      <div className="onboarding__card surface-card">
        <h1 className="onboarding__title">{slides[i].title}</h1>
        <p className="onboarding__text">{slides[i].text}</p>
        <div className="onboarding__illus" aria-hidden>
          {i === 0 && <span className="onboarding__emoji">✂️</span>}
          {i === 1 && <span className="onboarding__emoji">✨</span>}
          {i === 2 && <span className="onboarding__emoji">📍</span>}
        </div>
      </div>
      <div className="onboarding__actions">
        <div className="onboarding__actions-row">
          {i > 0 && (
            <button type="button" className="btn btn--ghost btn--wide onboarding__secondary" onClick={goBack}>
              Previous
            </button>
          )}
          {i < slides.length - 1 ? (
            <button type="button" className="btn btn--gradient btn--wide onboarding__primary" onClick={() => setI((x) => x + 1)}>
              Next
            </button>
          ) : (
            <button type="button" className="btn btn--gradient btn--wide onboarding__primary" onClick={finish}>
              Get started
            </button>
          )}
        </div>
        <p className="onboarding__step-label text-muted small">
          Step {i + 1} of {slides.length}
        </p>
      </div>
    </main>
  );
}
