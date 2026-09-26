import { useCallback, useRef, useState } from "react";
import { ApiError, apiLogin, apiRegisterCustomer } from "../api/client";
import { IconCheck } from "./Icons";
import { PasswordField } from "./PasswordField";
import { compressImageFileToDataUrl, dataUrlFromVideoFrame } from "../utils/imageCompress";
import { isValidInMobile } from "../utils/phone";

type Tab = "signin" | "signup";

type Props = {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  onAuthSuccess: (token: string) => void;
};

export function AuthPanel({ activeTab, onTabChange, onAuthSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profilePhotoDataUrl, setProfilePhotoDataUrl] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setError("Could not access the camera — try gallery upload instead.");
    }
  }

  function captureFrame() {
    const v = videoRef.current;
    if (!v) return;
    const url = dataUrlFromVideoFrame(v);
    if (!url) {
      setError("Capture failed — wait for the preview to settle and try again.");
      return;
    }
    setProfilePhotoDataUrl(url);
    stopCamera();
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await apiLogin({ email: email.trim(), password });
      onAuthSuccess(res.accessToken);
      setSuccess("Signed in — taking you to the right workspace for your role.");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onRegisterCustomer(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!isValidInMobile(mobile)) {
      setError("Enter a valid 10-digit Indian mobile number (starts with 6–9). We use it for booking SMS & reminders.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiRegisterCustomer({
        name: name.trim(),
        email: email.trim(),
        password,
        mobile,
        profilePhotoDataUrl: profilePhotoDataUrl ?? undefined,
      });
      onAuthSuccess(res.accessToken);
      setSuccess("Your customer account is ready — explore salons and use My bookings.");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-panel" id="account">
      <h2 className="section__title" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
        Your account
      </h2>
      <p className="section__lead" style={{ margin: "0 auto 1.25rem", textAlign: "center", maxWidth: "28rem" }}>
        One sign-in for every role. After login you are sent to the right screen: platform admin, salon hub, staff tools,
        or customer discovery.
      </p>

      <div className="surface-card auth-salon-note glass-card">
        <strong>Who can sign in here?</strong>
        <ul className="text-muted small" style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem" }}>
          <li>
            <strong>Customer</strong> — create account, book salon/clinic, cancel or reschedule.
          </li>
          <li>
            <strong>Business Admin</strong> — provisioned by Platform Admin. Dashboard: employees, services, bookings,
            CRM.
          </li>
          <li>
            <strong>Employee</strong> — doctor/stylist login from Admin → Employees (email + password). Schedule &amp;
            availability.
          </li>
          <li>
            <strong>Platform Admin</strong> — every sector, every tenant.
          </li>
        </ul>
      </div>

      <div className="auth-tabs" role="tablist" aria-label="Sign in or create account">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "signin"}
          onClick={() => onTabChange("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "signup"}
          onClick={() => onTabChange("signup")}
        >
          Create customer account
        </button>
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert--success" role="status" style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <IconCheck style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{success}</span>
        </div>
      )}

      {activeTab === "signin" ? (
        <form onSubmit={onLogin} noValidate>
          <div className="field">
            <label htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            <p className="hint">
              Demo: <strong>admin@demo.com</strong> (super admin), <strong>tenant@demo.com</strong> (salon owner),{" "}
              <strong>staff@demo.com</strong> (professional), or any email as <strong>customer</strong> — password can be
              anything.
            </p>
          </div>
          <PasswordField
            id="signin-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
            hint="Use Show to verify what you typed."
          />
          <button type="submit" className="btn btn--primary btn--wide" disabled={busy}>
            {busy ? "Please wait…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={onRegisterCustomer} noValidate>
          <div className="field">
            <label htmlFor="cust-name">Your name</label>
            <input
              id="cust-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
            />
          </div>
          <div className="field">
            <label htmlFor="cust-email">Email</label>
            <input
              id="cust-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            <p className="hint">Use the same email when you book so bookings appear in My bookings.</p>
          </div>
          <div className="field">
            <label htmlFor="cust-mobile">Mobile number *</label>
            <input
              id="cust-mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
              placeholder="10-digit number (e.g. 9876543210)"
            />
            <p className="hint">
              <strong>Required</strong> — for SMS/WhatsApp reminders and salon contact. Indian number (10 digits, starts with 6–9).
            </p>
          </div>
          <div className="field">
            <label>Profile photo (optional)</label>
            <p className="hint">Gallery or live selfie — used for AI style suggestions and your avatar. Compressed on device.</p>
            <div className="auth-photo-row">
              <input
                type="file"
                accept="image/*"
                aria-label="Choose photo from gallery"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const url = await compressImageFileToDataUrl(f);
                  if (!url) setError("Could not read that image — try another file.");
                  else {
                    setError(null);
                    setProfilePhotoDataUrl(url);
                  }
                  e.target.value = "";
                }}
              />
              {!cameraOn ? (
                <button type="button" className="btn btn--ghost btn--small" onClick={() => void startCamera()}>
                  Use camera
                </button>
              ) : (
                <>
                  <video ref={videoRef} className="auth-camera-preview" playsInline muted width={200} height={150} />
                  <button type="button" className="btn btn--customer btn--small" onClick={() => captureFrame()}>
                    Capture
                  </button>
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => stopCamera()}>
                    Cancel camera
                  </button>
                </>
              )}
            </div>
            {profilePhotoDataUrl && (
              <p className="text-muted small">
                Preview: <img src={profilePhotoDataUrl} alt="" className="auth-photo-thumb" width={56} height={56} />
              </p>
            )}
          </div>
          <PasswordField
            id="cust-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            hint="Minimum 8 characters. Use Show to confirm."
          />
          <button type="submit" className="btn btn--primary btn--wide" disabled={busy}>
            {busy ? "Please wait…" : "Create customer account"}
          </button>
        </form>
      )}
    </div>
  );
}
