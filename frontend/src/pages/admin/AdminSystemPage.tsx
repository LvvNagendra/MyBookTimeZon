import { Link } from "react-router-dom";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanel, AdminStatusBadge } from "../../components/admin/AdminUi";
import { USE_MOCK_API } from "../../api/client";

export default function AdminSystemPage() {
  return (
    <main id="main" className="sa-page">
      <AdminPageHeader
        title="System & AI"
        subtitle="Hairstyle suggest and skin analysis run MediaPipe in the browser. Coach tips use your server LLM when keys are set, otherwise heuristic fallbacks."
      />

      <div className="sa-grid-2">
        <AdminPanel title="AI models" subtitle="Open customer tools to verify end-to-end">
          <ul className="sa-list">
            <li className="sa-list__item">
              <div>
                <strong>Hairstyle suggest</strong>
                <p className="sa-note">v2.1 · MediaPipe Face Landmarker + hair overlay + coach tips</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <AdminStatusBadge status="Live" />
                <Link to="/ai-hair" className="btn btn--gold btn--small">
                  Open &amp; test
                </Link>
              </div>
            </li>
            <li className="sa-list__item">
              <div>
                <strong>Skin analysis</strong>
                <p className="sa-note">v1.4 · on-device cheek sampling + coach facial tips</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <AdminStatusBadge status="Live" />
                <Link to="/skin" className="btn btn--gold btn--small">
                  Open &amp; test
                </Link>
              </div>
            </li>
            <li className="sa-list__item">
              <div>
                <strong>Beauty coach LLM</strong>
                <p className="sa-note">
                  Chat + personalize · {USE_MOCK_API ? "mock UI mode" : "calls /api/v1/beauty-coach"} · falls back if no key
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <AdminStatusBadge status="Ready" />
                <Link to="/coach" className="btn btn--ghost btn--small">
                  Open chat
                </Link>
              </div>
            </li>
          </ul>
          <p className="sa-note">
            For live LLM replies set <code>OPENAI_API_KEY</code> and/or <code>GEMINI_API_KEY</code> on the Spring Boot
            server. Hairstyle overlay and skin score work without any key.
          </p>
        </AdminPanel>

        <AdminPanel title="Feature flags" subtitle="Read-only placeholders until ops API ships">
          <label className="sa-check">
            <input type="checkbox" defaultChecked disabled /> Live slot WebSocket
          </label>
          <label className="sa-check" style={{ display: "flex", marginTop: "0.75rem" }}>
            <input type="checkbox" defaultChecked disabled /> Razorpay live mode
          </label>
          <label className="sa-check" style={{ display: "flex", marginTop: "0.75rem" }}>
            <input type="checkbox" disabled /> Maintenance mode
          </label>
          <p className="sa-note">Flags stay disabled here so stub controls cannot flip production settings by accident.</p>
        </AdminPanel>
      </div>

      <div style={{ height: "1rem" }} />

      <AdminPanel title="Quick test checklist" subtitle="Confirm each step on a phone or laptop with a camera">
        <ol className="help-checklist text-muted" style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.6 }}>
          <li>
            Open <Link to="/ai-hair">/ai-hair</Link> → allow camera or upload a selfie → confirm hair overlay tracks the face →
            tap <strong>Get personalized suggestions</strong>.
          </li>
          <li>
            Open <Link to="/skin">/skin</Link> → scan face → tap <strong>Run skin analysis</strong> → score, routine, and coach
            tips appear.
          </li>
          <li>
            Optional: set an LLM key on the backend and re-run personalize — badge should switch from heuristic to live.
          </li>
        </ol>
      </AdminPanel>
    </main>
  );
}
