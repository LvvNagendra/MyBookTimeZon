import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo, BRAND_NAME, BRAND_STORAGE, readStorageKey } from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";
import { USE_MOCK_API, apiDiscoverClinics, type ClinicPublicSummary } from "../api/client";
import { NEARBY_SALONS } from "../data/dummy";
import { salonDetailPath } from "../utils/salonRoutes";

export type HomeSector = "SALON" | "CLINIC";

type SectorCopy = {
  id: HomeSector;
  label: string;
  short: string;
  headline: string;
  support: string;
  heroImage: string;
  exploreLabel: string;
  prosLabel: string;
  features: { title: string; text: string }[];
};

const SECTORS: SectorCopy[] = [
  {
    id: "SALON",
    label: "Salon & beauty",
    short: "Hair · Spa · Grooming",
    headline: "Book stylists you trust",
    support: "Pick a salon, choose your pro, lock a live slot — same flow on web and mobile.",
    heroImage:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=85&auto=format&fit=crop",
    exploreLabel: "Find salons near you",
    prosLabel: "Stylists",
    features: [
      { title: "Live slots", text: "See open times for each stylist before you book." },
      { title: "AI style try-on", text: "Preview cuts on your photo, then book the look." },
      { title: "Reminders", text: "Confirmations that cut no-shows for you and the salon." },
    ],
  },
  {
    id: "CLINIC",
    label: "Doctor & clinic",
    short: "Dermatology · GP · Consults",
    headline: "Book doctors with clear availability",
    support: "Choose a clinic, see who is on duty, and reserve a visit without phone tag.",
    heroImage:
      "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1600&q=85&auto=format&fit=crop",
    exploreLabel: "Find clinics near you",
    prosLabel: "Doctors",
    features: [
      { title: "Doctor hours", text: "Availability set by each clinician — book what is open." },
      { title: "Specialty search", text: "Filter clinics by care type and location." },
      { title: "Visit history", text: "Signed-in patients keep bookings in one place." },
    ],
  },
];

function readStoredSector(): HomeSector {
  const v = readStorageKey(BRAND_STORAGE.sector, BRAND_STORAGE.legacySector);
  if (v === "CLINIC" || v === "SALON") return v;
  return "SALON";
}

function moneyFromZero() {
  return "Book online";
}

export default function HomePage() {
  const { token, profile } = useAuth();
  const navigate = useNavigate();
  const signedIn = Boolean(token);
  const [sector, setSector] = useState<HomeSector>(() => readStoredSector());
  const [live, setLive] = useState<ClinicPublicSummary[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);

  const copy = useMemo(() => SECTORS.find((s) => s.id === sector) ?? SECTORS[0]!, [sector]);

  const selectSector = useCallback((id: HomeSector) => {
    setSector(id);
    try {
      localStorage.setItem(BRAND_STORAGE.sector, id);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let alive = true;
    setLoadingLive(true);
    if (USE_MOCK_API) {
      const mock = NEARBY_SALONS.filter((s) =>
        sector === "CLINIC"
          ? String(s.businessType).toUpperCase() === "CLINIC"
          : String(s.businessType || "SALON").toUpperCase() !== "CLINIC",
      ).map(
        (s) =>
          ({
            id: s.id,
            slug: s.slug,
            businessName: s.name,
            businessType: s.businessType,
            city: s.city,
            displayLocation: s.displayLocation,
            address: s.address,
          }) as ClinicPublicSummary,
      );
      // If no clinic mocks, still show salon list for clinic tab empty state handling below
      setLive(mock);
      setLoadingLive(false);
      return;
    }
    void apiDiscoverClinics({})
      .then((rows) => {
        if (!alive) return;
        setLive(rows.filter((r) => String(r.businessType).toUpperCase() === sector));
      })
      .catch(() => {
        if (alive) setLive([]);
      })
      .finally(() => {
        if (alive) setLoadingLive(false);
      });
    return () => {
      alive = false;
    };
  }, [sector]);

  const exploreTo = `/nearby?sector=${sector}`;

  return (
    <main id="main" className="mkt">
      {/* Hero — brand first, one composition */}
      <section className="mkt-hero" aria-label={BRAND_NAME}>
        <div
          className="mkt-hero__media"
          style={{ backgroundImage: `url(${copy.heroImage})` }}
          role="img"
          aria-label={copy.label}
        />
        <div className="mkt-hero__veil" aria-hidden />
        <div className="mkt-hero__content">
          <div className="mkt-hero__brand-row">
            <BrandLogo size="lg" className="mkt-hero__logo" />
          </div>
          <h1 className="mkt-hero__title">{copy.headline}</h1>
          <p className="mkt-hero__lead">{copy.support}</p>
          <div className="mkt-hero__cta">
            <Link className="btn btn--gold" to={exploreTo}>
              {copy.exploreLabel}
            </Link>
            {!signedIn ? (
              <Link className="btn btn--ghost mkt-hero__ghost" to="/login">
                Sign in
              </Link>
            ) : (
              <Link className="btn btn--ghost mkt-hero__ghost" to="/my-bookings">
                My bookings
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Sector picker — primary interaction */}
      <section className="mkt-sector section" aria-label="Choose what to book">
        <div className="mkt-sector__inner">
          <h2 className="mkt-section-title">What do you need today?</h2>
          <p className="mkt-section-lead">
            One booking platform for beauty shops and clinics — pick a sector to see the right businesses.
          </p>
          <div className="mkt-sector__grid" role="tablist" aria-label="Sector">
            {SECTORS.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={sector === s.id}
                className={`mkt-sector__card${sector === s.id ? " mkt-sector__card--active" : ""}`}
                onClick={() => selectSector(s.id)}
              >
                <span className="mkt-sector__label">{s.label}</span>
                <span className="mkt-sector__short">{s.short}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mkt-how section" aria-labelledby="mkt-how-title">
        <div className="mkt-how__inner">
          <h2 id="mkt-how-title" className="mkt-section-title">
            Book like a top app — in three steps
          </h2>
          <ol className="mkt-steps">
            <li>
              <strong>Choose {sector === "CLINIC" ? "clinic" : "salon"}</strong>
              <span>Browse live listings for {copy.label.toLowerCase()}.</span>
            </li>
            <li>
              <strong>Pick {copy.prosLabel.toLowerCase()}</strong>
              <span>See who is available and when.</span>
            </li>
            <li>
              <strong>Confirm your slot</strong>
              <span>Instant booking — manage visits after sign-in.</span>
            </li>
          </ol>
        </div>
      </section>

      {/* Sector features */}
      <section className="mkt-features section" aria-label={`${copy.label} features`}>
        <div className="mkt-features__inner">
          <h2 className="mkt-section-title">
            {copy.label} on {BRAND_NAME}
          </h2>
          <div className="mkt-features__row">
            {copy.features.map((f) => (
              <article key={f.title} className="mkt-feature">
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
          {sector === "SALON" ? (
            <div className="mkt-features__extra">
              <Link to="/ai-hair" className="link-customer">
                Try AI hair suggest →
              </Link>
              <Link to="/coach" className="link-customer">
                Ask beauty coach →
              </Link>
            </div>
          ) : (
            <div className="mkt-features__extra">
              <Link to={exploreTo} className="link-customer">
                Search by specialty &amp; city →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Live businesses for selected sector */}
      <section className="mkt-live section" aria-labelledby="mkt-live-title">
        <div className="mkt-live__inner">
          <div className="mkt-live__head">
            <h2 id="mkt-live-title" className="mkt-section-title">
              {sector === "CLINIC" ? "Clinics open to book" : "Salons open to book"}
            </h2>
            <Link to={exploreTo} className="link-customer">
              See all
            </Link>
          </div>
          {loadingLive ? (
            <p className="text-muted">Loading live businesses…</p>
          ) : live.length === 0 ? (
            <div className="mkt-empty">
              <p>
                No {sector === "CLINIC" ? "clinics" : "salons"} listed yet in this sector.
                {signedIn ? null : " Super Admin can onboard the first tenants."}
              </p>
              <Link className="btn btn--gold" to={exploreTo}>
                Open explore
              </Link>
            </div>
          ) : (
            <ul className="mkt-live__list">
              {live.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <Link
                    to={salonDetailPath(b.slug, b.businessType)}
                    className="mkt-biz"
                  >
                    <div className="mkt-biz__body">
                      <strong>{b.businessName}</strong>
                      <span className="text-muted small">
                        {[b.displayLocation, b.city].filter(Boolean).join(" · ") || b.businessType}
                      </span>
                    </div>
                    <span className="mkt-biz__cta">{moneyFromZero()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Product / SaaS + app */}
      <section className="mkt-product section" aria-labelledby="mkt-product-title">
        <div className="mkt-product__inner">
          <h2 id="mkt-product-title" className="mkt-section-title">
            Multi-tenant appointment SaaS
          </h2>
          <p className="mkt-section-lead">
            {BRAND_NAME} powers many clinics and salons on one platform. Each business gets Admin, Employees, and
            Customers — JWT roles, tenant-scoped data, live slots, and CRM. Web today; Android-ready Progressive Web App.
          </p>
          <div className="mkt-product__actions">
            <Link className="btn btn--gold" to={exploreTo}>
              Start booking
            </Link>
            {!signedIn ? (
              <Link className="btn btn--ghost" to="/login">
                Business owner sign in
              </Link>
            ) : profile?.clinic ? (
              <Link className="btn btn--ghost" to="/dashboard">
                Open my dashboard
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {signedIn && profile ? (
        <section className="mkt-account section">
          <p className="text-muted small" style={{ textAlign: "center" }}>
            Signed in as <strong>{profile.user.name}</strong>
            {profile.clinic ? (
              <>
                {" "}
                ·{" "}
                <button type="button" className="link-customer" onClick={() => navigate("/dashboard")}>
                  Owner hub
                </button>
              </>
            ) : null}
          </p>
        </section>
      ) : null}
    </main>
  );
}
