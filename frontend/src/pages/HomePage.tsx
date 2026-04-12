import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HOME_CATEGORIES,
  HOME_FEATURED,
  HOME_OFFERS,
  NEARBY_SALONS,
  RECOMMENDED_PROFESSIONALS,
} from "../data/dummy";
import {
  IconArrowRightCircle,
  IconBell,
  IconScissors,
  IconSearch,
  IconSliders,
  IconSparkle,
} from "../components/CustomerIcons";
import { IconUser } from "../components/Icons";
import { salonDetailPath } from "../utils/salonRoutes";

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function moneyPaise(p: number) {
  return (p / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

export default function HomePage() {
  const { token, profile } = useAuth();
  const navigate = useNavigate();
  const signedIn = Boolean(token);
  const displayName = profile?.user.name ?? "there";
  const [activeCat, setActiveCat] = useState(HOME_CATEGORIES[0]?.id ?? "c1");

  return (
    <main id="main" className="salon-home customer-surface">
      {!signedIn && (
        <section className="customer-trust-strip surface-card glass-card" aria-label="Why SalonGo">
          <div className="customer-trust-strip__item">
            <strong>Book in minutes</strong>
            <span className="text-muted small">Real-time slots · demo checkout</span>
          </div>
          <div className="customer-trust-strip__item">
            <strong>Top-rated pros</strong>
            <span className="text-muted small">Reviews &amp; clear pricing</span>
          </div>
          <div className="customer-trust-strip__item">
            <strong>AI try-on</strong>
            <span className="text-muted small">Hair, beard &amp; skin picks</span>
          </div>
        </section>
      )}

      <section className="salon-home__hero">
        <div className="home-greeting-row">
          <div className="home-greeting-row__left">
            <Link to={signedIn ? "/profile" : "/login"} className="home-avatar" aria-label="Profile">
              {signedIn ? (
                profile?.user.profilePhotoDataUrl ? (
                  <img
                    src={profile.user.profilePhotoDataUrl}
                    alt=""
                    className="home-avatar__img"
                    width={40}
                    height={40}
                  />
                ) : (
                  <span className="home-avatar__letter">{displayName.slice(0, 1).toUpperCase()}</span>
                )
              ) : (
                <IconUser />
              )}
            </Link>
            <div>
              <p className="home-greeting__hello">
                Hello {displayName}! <span className="text-muted">{timeGreeting()}!</span>
              </p>
              <h1 className="salon-home__title salon-home__title--compact">Find your perfect style</h1>
            </div>
          </div>
          <button type="button" className="icon-btn icon-btn--ghost" aria-label="Notifications (demo)">
            <IconBell width={22} height={22} />
          </button>
        </div>

        <div className="search-pill customer-search-pill">
          <span className="search-pill__icon" aria-hidden>
            <IconSearch width={20} height={20} />
          </span>
          <input
            type="search"
            placeholder="Search salons, cuts, spa…"
            autoComplete="off"
            readOnly
            onFocus={() => navigate("/nearby")}
          />
          <button type="button" className="search-pill__filter" aria-label="Filters" onClick={() => navigate("/nearby")}>
            <IconSliders width={20} height={20} />
          </button>
        </div>

        <div className="offers-scroll" role="region" aria-label="Offers">
          {HOME_OFFERS.map((o) => (
            <div key={o.id} className={`offer-card glass-card offer-card--${o.accent}`}>
              <strong>{o.title}</strong>
              <p className="text-muted small">{o.sub}</p>
            </div>
          ))}
        </div>

        <article className="home-featured surface-card">
          <div
            className="home-featured__visual"
            style={{ backgroundImage: `url(${HOME_FEATURED.imageUrl})` }}
            role="img"
            aria-label={HOME_FEATURED.salonName}
          >
            <span className="home-featured__badge">{HOME_FEATURED.badge}</span>
            <span className="home-featured__price">{moneyPaise(HOME_FEATURED.pricePaise)}/hr</span>
          </div>
          <div className="home-featured__footer">
            <div>
              <h2 className="home-featured__title">{HOME_FEATURED.salonName}</h2>
              <p className="text-muted small">{HOME_FEATURED.address}</p>
            </div>
            <Link to={`/book/SALON/${HOME_FEATURED.slug}`} className="home-featured__cta" aria-label="Book this offer">
              <IconArrowRightCircle width={44} height={44} />
            </Link>
          </div>
        </article>

        <div className="ai-banner surface-card glass-card">
          <div>
            <h2 className="ai-banner__title">Face match &amp; AI style picks</h2>
            <p className="text-muted">Upload once — see cuts, beard, and skin suggestions.</p>
            <p className="text-muted small" style={{ marginTop: "0.5rem" }}>
              <Link to="/coach">Beauty coach</Link> — live hair &amp; skincare Q&amp;A
            </p>
          </div>
          <div className="ai-banner__actions">
            <Link to="/ai-hair" className="btn btn--customer btn--small">
              Style picks
            </Link>
            <Link to="/coach" className="btn btn--ghost btn--small">
              Ask coach
            </Link>
          </div>
        </div>
      </section>

      <section className="salon-home__section">
        <h2 className="section-heading">Categories</h2>
        <div className="category-scroll category-scroll--horizontal">
          {HOME_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`customer-chip${activeCat === c.id ? " customer-chip--active" : ""}`}
              onClick={() => {
                setActiveCat(c.id);
                navigate(c.to);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="salon-home__section">
        <div className="section-row">
          <h2 className="section-heading">Special offers</h2>
          <Link to="/nearby" className="link-customer">
            See all
          </Link>
        </div>
        <div className="salon-scroll">
          {NEARBY_SALONS.map((s) => (
            <Link key={s.id} to={salonDetailPath(s.slug, s.businessType)} className="salon-card surface-card">
              <div
                className="salon-card__img salon-card__img--photo"
                style={{ backgroundImage: `url(${s.imageUrl})` }}
              />
              <div className="salon-card__body">
                <h3>{s.name}</h3>
                <p className="text-muted small">
                  ★ {s.rating} ({s.reviewsCount}) · {s.distanceKm} km · {s.openNow ? "Open" : "Closed"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="salon-home__section">
        <div className="section-row">
          <h2 className="section-heading">Recommended</h2>
          <Link to="/nearby" className="link-customer">
            See all
          </Link>
        </div>
        <div className="recommended-scroll">
          {RECOMMENDED_PROFESSIONALS.map((p) => (
            <article key={p.id} className="surface-card pro-card-mini">
              <div className="pro-avatar pro-avatar--img">
                <img src={p.avatarUrl} alt="" width={56} height={56} loading="lazy" />
              </div>
              <strong>{p.name}</strong>
              <p className="text-muted small">{p.salon}</p>
              <p className="pro-rating customer-accent">
                ★ {p.rating} · {p.reviews} reviews
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="salon-home__section">
        <h2 className="section-heading">Quick actions</h2>
        <div className="quick-grid">
          <Link to="/ai-hair" className="quick-card surface-card">
            <span className="quick-card__icon customer-accent" aria-hidden>
              <IconScissors width={26} height={26} />
            </span>
            <span>Haircut</span>
          </Link>
          <Link to="/skin" className="quick-card surface-card">
            <span className="quick-card__icon customer-accent" aria-hidden>
              <IconSparkle width={26} height={26} />
            </span>
            <span>Facial</span>
          </Link>
          <Link to="/hair-health" className="quick-card surface-card">
            <span className="quick-card__icon" aria-hidden>
              💧
            </span>
            <span>Hair health</span>
          </Link>
        </div>
      </section>

      <section className="salon-home__section">
        <h2 className="section-heading">More</h2>
        <div className="more-grid">
          <Link to="/nearby" className="surface-card more-tile">
            <strong>Explore map &amp; list</strong>
            <p className="text-muted small">Filters &amp; distance (demo)</p>
          </Link>
          <Link to="/coach" className="surface-card more-tile">
            <strong>Beauty coach</strong>
            <p className="text-muted small">Tips &amp; routines</p>
          </Link>
          <Link to="/book/SALON/urban-trim" className="surface-card more-tile">
            <strong>Book appointment</strong>
            <p className="text-muted small">Slots + checkout (demo)</p>
          </Link>
        </div>
      </section>

      {signedIn && profile && (
        <section className="salon-home__section surface-card account-snippet">
          <p>
            Signed in as <strong>{profile.user.name}</strong> ({profile.user.role})
          </p>
          {profile.clinic && (
            <p className="text-muted small">
              Business: {profile.clinic.businessName} —{" "}
              <Link to={`/book/${profile.clinic.businessType}/${profile.clinic.slug}`}>Booking link</Link>
            </p>
          )}
        </section>
      )}
    </main>
  );
}
