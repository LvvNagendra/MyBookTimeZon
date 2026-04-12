import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiPublicBook, apiPublicBusiness, apiPublicSlots, type PublicBusinessPage, type TimeSlot } from "../api/client";
import { PageBackBar } from "../components/PageBackBar";
import { useAuth } from "../context/AuthContext";
import { BOOKING_SUCCESS_STORAGE_KEY } from "../data/dummy";
import { buildDayStrip } from "../utils/dateStrip";
import { isValidInMobile, normalizeInMobile } from "../utils/phone";

function moneyPaise(p: number) {
  return (p / 100).toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export default function BookPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { businessType = "", slug = "" } = useParams();
  const [page, setPage] = useState<PublicBusinessPage | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [custName, setCustName] = useState("Demo User");
  const [custEmail, setCustEmail] = useState("demo@salongo.app");
  const [custMobile, setCustMobile] = useState("");
  const [refNote, setRefNote] = useState("");
  const [coupon, setCoupon] = useState("");
  const [wallet, setWallet] = useState(false);

  const dayStrip = useMemo(() => buildDayStrip(7), []);

  useEffect(() => {
    const m = profile?.user.mobile;
    if (m) setCustMobile(m);
  }, [profile?.user.mobile]);

  const loadBusiness = useCallback(() => {
    setErr(null);
    return apiPublicBusiness(businessType, slug)
      .then((p) => {
        setPage(p);
        if (p.services[0]) setServiceId(p.services[0].id);
        if (p.staff[0]) setStaffId(p.staff[0].id);
      })
      .catch((e: Error) => setErr(e.message));
  }, [businessType, slug]);

  const loadSlots = useCallback(() => {
    if (!serviceId || !staffId || !page) return Promise.resolve();
    return apiPublicSlots(businessType, slug, { date, serviceId, staffId })
      .then((s) => {
        setSlots(s);
        setLastRefresh(new Date());
      })
      .catch((e: Error) => setErr(e.message));
  }, [businessType, slug, date, serviceId, staffId, page]);

  useEffect(() => {
    void loadBusiness();
  }, [loadBusiness]);

  useEffect(() => {
    if (!page || !serviceId || !staffId) return;
    setBusy(true);
    void loadSlots().finally(() => setBusy(false));
  }, [page, serviceId, staffId, date, loadSlots]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (page && serviceId && staffId) void loadSlots();
    }, 30000);
    return () => window.clearInterval(id);
  }, [page, serviceId, staffId, loadSlots]);

  const selectedService = useMemo(
    () => page?.services.find((s) => s.id === serviceId),
    [page, serviceId],
  );
  const selectedStaff = useMemo(() => page?.staff.find((s) => s.id === staffId), [page, staffId]);

  const discountPaise = coupon.trim().toUpperCase() === "SAVE20" ? Math.floor((selectedService?.priceCents ?? 0) * 0.2) : 0;
  const walletPaise = wallet ? Math.min(50000, (selectedService?.priceCents ?? 0) - discountPaise) : 0;
  const totalPaise = Math.max(0, (selectedService?.priceCents ?? 0) - discountPaise - walletPaise);

  function goPayment() {
    if (!selectedSlot?.available) return;
    setStep(2);
  }

  async function pay() {
    if (!selectedSlot || !page) return;
    if (!custName.trim() || !custEmail.includes("@")) return;
    if (!isValidInMobile(custMobile)) {
      setErr("Enter a valid 10-digit Indian mobile number — we send SMS/WhatsApp reminders before your visit.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const mobileNorm = normalizeInMobile(custMobile);
      const res = await apiPublicBook(businessType, slug, {
        serviceId,
        staffId,
        startAt: selectedSlot.startAt,
        customerName: custName.trim(),
        customerEmail: custEmail.trim(),
        customerMobile: mobileNorm,
        customerNotes: refNote.trim() || undefined,
      });
      const orderId = res.paymentCheckout?.orderId ?? `DEMO-${Date.now()}`;
      const amount = res.paymentCheckout?.amountPaise ?? totalPaise;
      sessionStorage.setItem(
        BOOKING_SUCCESS_STORAGE_KEY,
        JSON.stringify({
          businessName: page.businessName,
          serviceName: selectedService?.name ?? "Service",
          staffName: selectedStaff?.displayName ?? "Stylist",
          when: new Date(selectedSlot.startAt).toLocaleString(),
          orderId,
          amountPaise: amount,
          customerMobile: mobileNorm,
          customerEmail: custEmail.trim(),
        }),
      );
      navigate("/booking-success");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="section page-pad book-page book-page--customer">
      <div className="page-narrow">
        <div className="book-appt-header">
          <PageBackBar to="/nearby" variant="inline" label="Back" />
          <h1 className="book-appt-title">Appointment</h1>
          <span className="book-appt-header__spacer" aria-hidden />
        </div>
        <p className="text-muted book-appt-breadcrumb">
          <Link to="/">Home</Link>
          {" · "}
          <Link to="/nearby">Explore</Link>
        </p>

        <div className="stepper" aria-label="Booking steps">
          <span className={`stepper__step${step === 1 ? " stepper__step--on" : ""}`}>1 · Time</span>
          <span className="stepper__line" />
          <span className={`stepper__step${step === 2 ? " stepper__step--on" : ""}`}>2 · Checkout</span>
        </div>
        <p className="live-pill" aria-live="polite">
          <span className="live-dot live-dot--on" />
          Demo — slots refresh every 30s
          {lastRefresh && ` · ${lastRefresh.toLocaleTimeString()}`}
        </p>
        {err && (
          <div className="alert alert--error" role="alert">
            {err}
          </div>
        )}
        {!page && !err && <p className="text-muted">Loading…</p>}
        {page && step === 1 && (
          <>
            <p className="text-muted book-venue-line">
              {page.businessName}
              {page.displayLocation || page.city ? ` · ${page.displayLocation ?? page.city}` : ""}
            </p>

            {page.services.length === 0 && <p className="alert alert--error">No services yet.</p>}
            {page.staff.length === 0 && <p className="alert alert--error">No staff yet.</p>}

            {page.services.length > 0 && page.staff.length > 0 && (
              <>
                <h2 className="book-section-label">Upcoming professionals</h2>
                {selectedStaff && (
                  <div className="surface-card book-pro-card">
                    <div className="book-pro-card__main">
                      {selectedStaff.photoUrl ? (
                        <img
                          className="book-pro-card__photo"
                          src={selectedStaff.photoUrl}
                          alt=""
                          width={72}
                          height={72}
                        />
                      ) : (
                        <div className="book-pro-card__photo book-pro-card__photo--placeholder" aria-hidden>
                          {selectedStaff.displayName.slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <p className="book-pro-card__name">{selectedStaff.displayName}</p>
                        <p className="text-muted small">
                          {selectedStaff.shopLabel ?? page.businessName} · {selectedStaff.specialization}
                        </p>
                        <p className="book-pro-card__rating">
                          ★ {selectedStaff.rating ?? 4.9}{" "}
                          <span className="text-muted">
                            ({selectedStaff.reviews ?? 0} reviews) · {moneyPaise(selectedStaff.hourlyPaise ?? 150000)}/hr
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="book-pro-card__actions">
                      <div className="field field--inline">
                        <label htmlFor="stf" className="visually-hidden">
                          Professional
                        </label>
                        <select id="stf" value={staffId} onChange={(e) => setStaffId(e.target.value)} className="select-customer">
                          {page.staff.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button type="button" className="btn btn--ghost btn--small">
                        See more
                      </button>
                    </div>
                  </div>
                )}

                <div className="field">
                  <label htmlFor="svc">Service</label>
                  <select id="svc" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="select-customer">
                    {page.services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.durationMinutes} min · {moneyPaise(s.priceCents)}
                      </option>
                    ))}
                  </select>
                </div>

                <h2 className="book-section-label">Choose date</h2>
                <div className="day-strip" role="list">
                  {dayStrip.map((d) => (
                    <button
                      key={d.iso}
                      type="button"
                      role="listitem"
                      className={`day-strip__btn${date === d.iso ? " day-strip__btn--selected" : ""}`}
                      onClick={() => {
                        setDate(d.iso);
                        setSelectedSlot(null);
                      }}
                    >
                      <span className="day-strip__wd">{d.weekdayShort}</span>
                      <span className="day-strip__num">{d.dayNum}</span>
                      <span className="day-strip__mo">{d.monthShort}</span>
                    </button>
                  ))}
                </div>

                <h2 className="book-section-label">Choose time</h2>
                <p className="book-slot-legend text-muted small" aria-hidden>
                  <span className="slot-legend-pill slot-legend-pill--free">Open</span> times you can book ·{" "}
                  <span className="slot-legend-pill slot-legend-pill--taken">Full</span> already reserved for this stylist
                </p>
                {busy && <p className="text-muted">Updating…</p>}
                <div className="slot-grid slot-grid--dense">
                  {slots.map((sl) => (
                    <button
                      key={sl.startAt}
                      type="button"
                      className={`slot-btn ${sl.available ? "slot-btn--free" : "slot-btn--taken"}${selectedSlot?.startAt === sl.startAt ? " slot-btn--selected" : ""}`}
                      disabled={!sl.available || busy}
                      onClick={() => sl.available && setSelectedSlot(sl)}
                    >
                      {new Date(sl.startAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      {!sl.available ? " · Full" : ""}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn--customer btn--wide book-checkout-cta"
                  disabled={!selectedSlot || busy}
                  onClick={() => goPayment()}
                >
                  Checkout
                </button>
              </>
            )}
          </>
        )}

        {page && step === 2 && selectedSlot && selectedService && (
          <>
            <div className="surface-card glass-card">
              <h2 className="section-heading" style={{ marginTop: 0 }}>
                Checkout
              </h2>
              <p>
                <strong>{selectedService.name}</strong> · {moneyPaise(selectedService.priceCents)}
              </p>
              <p className="text-muted small">
                {selectedStaff?.displayName} · {new Date(selectedSlot.startAt).toLocaleString()}
              </p>
              {page.address && <p className="text-muted small">{page.address}</p>}

              <h3 className="book-section-label" style={{ marginTop: "1rem" }}>
                Your details
              </h3>
              <div className="field">
                <label htmlFor="cn">Full name</label>
                <input id="cn" value={custName} onChange={(e) => setCustName(e.target.value)} autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="ce">Email</label>
                <input id="ce" type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="cm">Mobile number *</label>
                <input
                  id="cm"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={custMobile}
                  onChange={(e) => setCustMobile(e.target.value)}
                  required
                  placeholder="10-digit Indian mobile"
                />
                <p className="hint">Required for SMS/WhatsApp reminders and salon contact.</p>
              </div>
              <div className="field">
                <label htmlFor="ref">Notes for stylist (optional)</label>
                <textarea
                  id="ref"
                  rows={2}
                  value={refNote}
                  onChange={(e) => setRefNote(e.target.value)}
                  placeholder="Inspiration or preferences"
                />
              </div>

              <div className="coupon-row">
                <input
                  className="coupon-input"
                  placeholder="Coupon code (try SAVE20)"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                />
              </div>
              <label className="wallet-row">
                <input type="checkbox" checked={wallet} onChange={(e) => setWallet(e.target.checked)} />
                <span>Use wallet balance (demo ₹500 max)</span>
              </label>
              <div className="price-breakdown">
                <div>
                  <span>Subtotal</span>
                  <span>{moneyPaise(selectedService.priceCents)}</span>
                </div>
                {discountPaise > 0 && (
                  <div className="price-discount">
                    <span>Coupon</span>
                    <span>− {moneyPaise(discountPaise)}</span>
                  </div>
                )}
                {walletPaise > 0 && (
                  <div className="price-discount">
                    <span>Wallet</span>
                    <span>− {moneyPaise(walletPaise)}</span>
                  </div>
                )}
                <div className="price-total">
                  <span>Total</span>
                  <span>{moneyPaise(totalPaise)}</span>
                </div>
              </div>
              <p className="text-muted small">Razorpay — mock checkout in demo.</p>
            </div>
            <div className="btn-row" style={{ marginTop: "1rem" }}>
              <button type="button" className="btn btn--ghost" onClick={() => setStep(1)} disabled={busy}>
                Back
              </button>
              <button type="button" className="btn btn--customer" style={{ flex: 1 }} disabled={busy} onClick={() => void pay()}>
                {busy ? "Processing…" : "Pay (demo)"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
