import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PageBackBar } from "../components/PageBackBar";
import {
  BEFORE_AFTER_PREVIEWS,
  MAKEUP_TRENDING,
  NEARBY_SALONS,
  PEOPLE_ALSO_BOOKED,
  SALON_GALLERY,
  TRENDING_AT_SALON,
  getPublicBusinessPage,
} from "../data/dummy";
import { ApiError, USE_MOCK_API, apiPublicBusiness, type PublicBusinessPage } from "../api/client";
import { GoogleMapEmbed } from "../components/GoogleMapEmbed";
import { buildLocationAddressQuery } from "../utils/googleMapsEmbed";

function moneyPaise(p: number) {
  return (p / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

export default function SalonDetailPage() {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const businessType = (searchParams.get("businessType") || "SALON").toUpperCase();

  const [page, setPage] = useState<PublicBusinessPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    if (USE_MOCK_API) {
      setPage(getPublicBusinessPage(businessType, slug) as PublicBusinessPage);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void apiPublicBusiness(businessType, slug)
      .then((p) => {
        if (!cancelled) setPage(p);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Could not load salon.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, businessType]);

  const mockSalon = NEARBY_SALONS.find((s) => s.slug === slug);

  const title = page?.businessName ?? mockSalon?.name ?? "Salon";
  const heroUrl =
    mockSalon?.imageUrl ?? (page?.staff?.[0] as { photoUrl?: string } | undefined)?.photoUrl ?? undefined;
  const heroTone = mockSalon?.imageTone ?? "linear-gradient(145deg, #e8e4dc, #d4cfc4)";
  const ratingLine =
    mockSalon != null ? (
      <>
        ★ {mockSalon.rating} · {mockSalon.distanceKm} km · {mockSalon.openNow ? "Open now" : "Closed"}
      </>
    ) : page ? (
      <span className="text-muted">
        {page.businessType}
        {(page.displayLocation ?? page.city) && ` · ${page.displayLocation ?? page.city}`}
      </span>
    ) : null;

  const locationLineFromApi =
    page != null
      ? [page.country, page.state, page.displayLocation ?? page.city].filter(Boolean).join(" · ")
      : "";
  const locationLine =
    locationLineFromApi ||
    (mockSalon
      ? `${mockSalon.country} · ${mockSalon.state} · ${mockSalon.displayLocation} · ~${mockSalon.distanceKm} km away`
      : "");

  const mapAddressQuery =
    page != null
      ? buildLocationAddressQuery({
          address: page.address,
          village: page.village,
          displayLocation: page.displayLocation,
          city: page.city,
          state: page.state,
          country: page.country,
        })
      : "";

  const tagList = mockSalon?.tags ?? [];

  const bookType = page?.businessType ?? businessType;
  const bookSlug = page?.slug ?? slug;

  if (!loading && error && !page) {
    return (
      <main id="main" className="section page-pad salon-detail">
        <div className="page-narrow">
          <PageBackBar to="/nearby" label="Explore" />
          <div className="alert alert--error" role="alert">
            {error}
          </div>
          <Link to="/nearby" className="btn btn--customer">
            Back to explore
          </Link>
        </div>
      </main>
    );
  }

  if (loading || !page) {
    return (
      <main id="main" className="section page-pad salon-detail">
        <div className="page-wide">
          <PageBackBar to="/nearby" label="Explore" />
          <p className="text-muted">{loading ? "Loading salon…" : "Salon not found."}</p>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="section page-pad salon-detail">
      <div className="page-wide">
        <PageBackBar to="/nearby" label="Explore" />
        <p className="text-muted salon-detail__crumb">
          <Link to="/">Home</Link> · <Link to="/nearby">Nearby</Link>
        </p>

        <div className="salon-hero surface-card glass-card">
          <div
            className="salon-hero__visual salon-hero__visual--photo"
            style={
              heroUrl ? { backgroundImage: `url(${heroUrl})` } : { background: heroTone }
            }
          />
          <div className="salon-hero__body">
            {page.logoUrl ? (
              <img
                src={page.logoUrl}
                alt=""
                width={56}
                height={56}
                style={{ borderRadius: 14, objectFit: "cover", marginBottom: 10 }}
              />
            ) : null}
            <h1 className="page-title">{title}</h1>
            <p className="text-muted">{ratingLine}</p>
            {tagList.length > 0 && (
              <p className="salon-tags">
                {tagList.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        <section className="section-block">
          <h2 className="section-heading">Photos</h2>
          <div className="gallery-grid">
            {SALON_GALLERY.map((g) => (
              <div key={g.id} className="gallery-cell" style={{ background: g.tone }} />
            ))}
          </div>
        </section>

        <section className="section-block">
          <h2 className="section-heading">Location</h2>
          <div className="surface-card salon-map-card" role="region" aria-label="Map">
            <GoogleMapEmbed
              latitude={page.latitude ?? null}
              longitude={page.longitude ?? null}
              addressQuery={mapAddressQuery || locationLineFromApi || locationLine}
              caption={
                [page.address, locationLineFromApi || locationLine].filter(Boolean).join(" · ") || undefined
              }
              height="min(360px, 52vh)"
            />
          </div>
        </section>

        <section className="section-block">
          <h2 className="section-heading">AI match for you</h2>
          <p className="surface-card ai-blurb glass-card">
            Strong match for <strong>textured cuts</strong> and <strong>beard sculpt</strong>. Recommended stylist:{" "}
            <strong>{page.staff[0]?.displayName ?? "Your stylist"}</strong> when you book.
          </p>
        </section>

        <section className="section-block">
          <h2 className="section-heading">Trending at this salon</h2>
          {page.trendingStyles && page.trendingStyles.length > 0 ? (
            <ul className="trending-list">
              {page.trendingStyles.map((row) => (
                <li key={row.id} className="surface-card trending-row">
                  <div>
                    <strong>{row.title}</strong>
                    {row.tagline && <p className="text-muted small">{row.tagline}</p>}
                  </div>
                  {row.imageUrl ? (
                    <a href={row.imageUrl} className="btn btn--ghost btn--small" target="_blank" rel="noreferrer">
                      Reference
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="trending-list">
              {TRENDING_AT_SALON.map((row) => (
                <li key={row.label} className="surface-card trending-row">
                  <span>{row.label}</span>
                  <span className="text-muted">{row.bookings} bookings</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted small">
            Salon owners curate the first list in the dashboard; the second list is demo data when none are published yet.
          </p>
        </section>

        <section className="section-block">
          <h2 className="section-heading">Popular makeup</h2>
          <ul className="trending-list">
            {MAKEUP_TRENDING.map((row) => (
              <li key={row.label} className="surface-card trending-row">
                <span>{row.label}</span>
                <span className="text-muted">{row.bookings} bookings</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section-block">
          <h2 className="section-heading">Before / after</h2>
          <div className="before-after-row">
            {BEFORE_AFTER_PREVIEWS.map((b) => (
              <div key={b.id} className="surface-card before-after-card">
                <div className="before-after-card__img" style={{ background: b.tone }} />
                <p className="small text-center">{b.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block">
          <h2 className="section-heading">People also booked</h2>
          <ul className="simple-list">
            {PEOPLE_ALSO_BOOKED.map((p) => (
              <li key={p.style}>
                <strong>{p.style}</strong> — {p.count} times
              </li>
            ))}
          </ul>
        </section>

        <section className="section-block">
          <h2 className="section-heading">Services & staff</h2>
          {page.services.length === 0 ? (
            <p className="text-muted">No services listed yet — the business may still be onboarding.</p>
          ) : (
            <ul className="simple-list text-muted">
              {page.services.map((svc) => (
                <li key={svc.id}>
                  <strong>{svc.name}</strong>
                  {svc.category ? ` · ${svc.category}` : ""} — from {moneyPaise(svc.priceCents)} · {svc.durationMinutes}{" "}
                  min
                </li>
              ))}
            </ul>
          )}
          {page.staff.length > 0 && (
            <ul className="simple-list" style={{ marginTop: "0.75rem" }}>
              {page.staff.map((st) => (
                <li key={st.id} className="text-muted">
                  <strong>{st.displayName}</strong>
                  {st.specialization ? ` — ${st.specialization}` : ""}
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted small" style={{ marginTop: "0.5rem" }}>
            Pick a slot on the booking page after you choose service and staff.
          </p>
        </section>

        <Link className="btn btn--gradient btn--wide" to={`/book/${bookType}/${bookSlug}`}>
          Book appointment
        </Link>
      </div>
    </main>
  );
}
