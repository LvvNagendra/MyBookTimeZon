import { Link } from "react-router-dom";
import { PageBackBar } from "../components/PageBackBar";
import { BOOKING_SUCCESS_STORAGE_KEY } from "../data/dummy";
import { formatInMobileDisplay, maskMobileLast4 } from "../utils/phone";

type Stored = {
  businessName: string;
  serviceName: string;
  staffName: string;
  when: string;
  orderId: string;
  amountPaise: number;
  customerMobile?: string;
  customerEmail?: string;
};

function readStored(): Stored | null {
  try {
    const raw = sessionStorage.getItem(BOOKING_SUCCESS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Stored;
  } catch {
    return null;
  }
}

function rupees(paise: number) {
  return (paise / 100).toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export default function BookingSuccessPage() {
  const data = readStored();

  if (!data) {
    return (
      <main id="main" className="section page-pad page-narrow">
        <PageBackBar to="/home" label="Home" />
        <h1 className="page-title">No booking found</h1>
        <p className="text-muted">Complete checkout from the booking flow first.</p>
        <Link to="/nearby" className="btn btn--gradient btn--wide">
          Find salons
        </Link>
      </main>
    );
  }

  const mobileDisplay = data.customerMobile
    ? maskMobileLast4(data.customerMobile)
    : null;
  const mobilePretty = data.customerMobile ? `+91 ${formatInMobileDisplay(data.customerMobile)}` : null;

  return (
    <main id="main" className="section page-pad success-page">
      <div className="page-narrow">
        <PageBackBar to="/home" label="Home" />
        <div className="success-hero glass-card">
          <div className="success-check" aria-hidden>
            ✓
          </div>
          <h1 className="page-title">Booking confirmed</h1>
          <p className="text-muted">Thank you — {data.businessName} will see your visit.</p>
        </div>

        <div className="surface-card section-block booking-reminder-card">
          <h2 className="section-heading" style={{ marginTop: 0, fontSize: "1.1rem" }}>
            Reminders &amp; contact
          </h2>
          <ul className="booking-reminder-list text-muted small">
            <li>
              <strong>Customer:</strong> when SMS is enabled, we will text <strong>{mobileDisplay ?? "your mobile"}</strong> a day before
              and 2 hours before your slot. WhatsApp may be used if you opted in.
            </li>
            <li>
              <strong>Salon (tenant):</strong> this booking appears in the salon hub under today&apos;s appointments — staff see your name,
              service, and {mobilePretty ?? "your mobile"} so they can call if needed.
            </li>
            <li>
              <strong>Email:</strong> when the operator enables outbound mail (<code>BOOKING_CONFIRM_EMAIL=true</code> and SMTP on
              the API), you receive a styled confirmation at the address you entered, and optionally a morning-of reminder in the
              salon&apos;s timezone (see <code>GET /api/v1/meta/notifications</code>).
            </li>
            <li>
              <strong>Demo mode:</strong> SMS/WhatsApp are not wired yet; your contact details are stored for go-live.
            </li>
          </ul>
        </div>

        <div className="surface-card section-block">
          <p>
            <strong>Service:</strong> {data.serviceName}
          </p>
          <p>
            <strong>Professional:</strong> {data.staffName}
          </p>
          <p>
            <strong>Time:</strong> {data.when}
          </p>
          {mobilePretty && (
            <p>
              <strong>Mobile on file:</strong> {mobilePretty}
            </p>
          )}
          {data.customerEmail && (
            <p>
              <strong>Email:</strong> {data.customerEmail}
            </p>
          )}
          <p>
            <strong>Total:</strong> {rupees(data.amountPaise)}
          </p>
          <p className="text-muted small">
            Reference <strong>{data.orderId}</strong>
          </p>
        </div>

        <div className="stack-gap success-actions">
          <Link to="/my-bookings" className="btn btn--gradient btn--wide">
            View in My bookings
          </Link>
          <Link to="/nearby" className="btn btn--ghost btn--wide">
            Explore more salons
          </Link>
          <button type="button" className="btn btn--ghost btn--wide" disabled>
            Add to calendar
          </button>
          <button type="button" className="btn btn--ghost btn--wide" disabled>
            Share booking
          </button>
        </div>
      </div>
    </main>
  );
}
