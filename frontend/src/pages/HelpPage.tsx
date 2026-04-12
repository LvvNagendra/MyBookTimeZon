import { Link } from "react-router-dom";
import { PageBackBar } from "../components/PageBackBar";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const faq = [
  {
    q: "How do I book without a salon account?",
    a: "Open Nearby, pick a salon, open its page, then Book. Choose service, stylist, date, and an available time slot. Checkout uses your email and Indian mobile so the salon can reach you.",
  },
  {
    q: "How does AI hairstyle match work?",
    a: "On AI hair, upload a photo or use the camera — styles overlay in the browser (MediaPipe). It is a visual guide, not a guarantee of how a cut will look in the chair. Bring references to your stylist.",
  },
  {
    q: "I’m a salon owner — where do I manage services?",
    a: "After sign-in, open Salon hub (Dashboard) → Services, Staff, and Bookings. Your data is scoped to your clinic only.",
  },
  {
    q: "How do salon staff log in and where is their app?",
    a: "Staff use the same Sign in page as other roles. Their account must have the STAFF role and membership in your clinic (provisioned via backend / admin). After login they land on Staff schedule at /staff/schedule — Schedule, Style requests, Portfolio, Earnings, and Availability in the sidebar.",
  },
  {
    q: "Why was my new service rejected?",
    a: "Service names must be unique for your salon (case-insensitive). Each price must be at least ₹100 (10,000 paise). Pick a different name or edit the existing row.",
  },
  {
    q: "How do I access platform admin?",
    a: "Users with the super admin role see Admin in the header. Tenant and staff roles do not see the platform console.",
  },
  {
    q: "Mock API vs live API?",
    a: USE_MOCK
      ? "This build uses VITE_USE_MOCK=true — data is local demo only. Set VITE_USE_MOCK=false and point VITE_API_BASE_URL at your deployed Java API for production."
      : "This build calls the real API (Vite proxy to the backend in dev, or VITE_API_BASE_URL in production).",
  },
];

export default function HelpPage() {
  return (
    <main id="main" className="section page-pad help-page">
      <div className="page-narrow">
        <PageBackBar to="/home" label="Home" />
        <h1 className="page-title">Help &amp; support</h1>
        <p className="page-subtitle">
          SalonGo — customers, salon teams, staff, and platform operators. Use the sections below for launch planning and
          policies.
        </p>

        <section id="go-live" className="surface-card glass-card help-highlight">
          <h2 className="section-heading">Go-live checklist</h2>
          <ol className="help-checklist text-muted">
            <li>
              <strong>Frontend:</strong> build with <code>npm run build</code>; host the <code>dist/</code> folder over HTTPS; set{" "}
              <code>VITE_API_BASE_URL</code> to your API origin (no trailing slash); keep <code>VITE_USE_MOCK=false</code>.
            </li>
            <li>
              <strong>Backend:</strong> PostgreSQL, Flyway migrations, <code>SPRING_PROFILES_ACTIVE=prod</code>, strong{" "}
              <code>JWT</code> secret, CORS origins matching your web app, Razorpay keys if you take online payments.
            </li>
            <li>
              <strong>Email:</strong> configure SMTP (<code>spring.mail.*</code>), then enable{" "}
              <code>BOOKING_CONFIRM_EMAIL</code> / <code>BOOKING_REMINDER_EMAIL</code> as needed. Catalog:{" "}
              <code>GET /api/v1/meta/notifications</code>.
            </li>
            <li>
              <strong>Ops:</strong> use <code>GET /api/v1/health</code> for liveness and <code>GET /api/v1/health/ready</code> for
              DB readiness behind your load balancer.
            </li>
            <li>
              <strong>Legal:</strong> replace placeholder privacy/terms below with counsel-approved pages before marketing to consumers.
            </li>
          </ol>
        </section>

        <section className="section-block">
          <h2 className="section-heading">FAQ</h2>
          <div className="faq-list">
            {faq.map((item) => (
              <details key={item.q} className="surface-card faq-item">
                <summary>{item.q}</summary>
                <p className="text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="privacy" className="surface-card section-block">
          <h2 className="section-heading">Privacy &amp; data (summary)</h2>
          <p className="text-muted">
            Profile photos and booking details are stored to run your salon operations. AI hair processing runs in your
            browser by default; the beauty coach sends your typed messages to the server LLM when configured — not your
            camera stream. For GDPR or India DPDP compliance, publish a full privacy policy and data retention schedule before
            go-live.
          </p>
        </section>

        <section id="terms" className="surface-card section-block">
          <h2 className="section-heading">Terms of use (placeholder)</h2>
          <p className="text-muted">
            Replace this block with your terms: cancellation rules, no-show fees, liability limits for beauty services, and
            dispute resolution. Until then, treat this app as a preview environment.
          </p>
        </section>

        <section className="surface-card glass-card">
          <h2 className="section-heading">Contact</h2>
          <p className="text-muted">support@salongo.app (placeholder — wire to your helpdesk).</p>
          <p className="text-muted small">
            Product map: <Link to="/nearby">Explore</Link> · <Link to="/ai-hair">AI hair</Link> · <Link to="/coach">Coach</Link> ·{" "}
            <Link to="/my-bookings">My bookings</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
