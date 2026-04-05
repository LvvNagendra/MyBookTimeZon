import { useState } from "react";
import { apiLogin, apiRegister } from "../api/client";
import { IconCheck } from "./Icons";

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
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await apiLogin({ email: email.trim(), password });
      onAuthSuccess(res.accessToken);
      setSuccess("You are signed in. Your dashboard tools are ready.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await apiRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        businessName: businessName.trim(),
        slug: slug.trim().toLowerCase(),
      });
      onAuthSuccess(res.accessToken);
      setSuccess("Welcome! Your business page is set up. You can sign in anytime with your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-panel" id="account">
      <h2 className="section__title" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
        Your account
      </h2>
      <p className="section__lead" style={{ margin: "0 auto 1.5rem", textAlign: "center", maxWidth: "28rem" }}>
        Sign in if you already registered. New here? Create an account in one step — clinic, salon, or gym, same form.
      </p>

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
          Create account
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
            <p className="hint">Use the email you used when you created your business account.</p>
          </div>
          <div className="field">
            <label htmlFor="signin-password">Password</label>
            <input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn--primary btn--wide" disabled={busy}>
            {busy ? "Please wait…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={onRegister} noValidate>
          <div className="field">
            <label htmlFor="reg-name">Your name</label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Priya Sharma"
            />
            <p className="hint">The name we will show on your account.</p>
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            <p className="hint">You will use this email every time you sign in.</p>
          </div>
          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
            <p className="hint">Choose at least 8 characters. Write it down somewhere safe.</p>
          </div>
          <div className="field">
            <label htmlFor="reg-business">Business name</label>
            <input
              id="reg-business"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              placeholder="Happy Hair Salon"
            />
            <p className="hint">Your clinic, salon, or studio name as customers should see it.</p>
          </div>
          <div className="field">
            <label htmlFor="reg-slug">Short name for your booking link</label>
            <input
              id="reg-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())}
              required
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              placeholder="happy-hair-salon"
            />
            <p className="hint">
              Small letters and dashes only. Example: <strong>happy-hair-salon</strong>. Customers will find you with this
              short name on your website later.
            </p>
          </div>
          <button type="submit" className="btn btn--primary btn--wide" disabled={busy}>
            {busy ? "Please wait…" : "Create my business account"}
          </button>
        </form>
      )}
    </div>
  );
}
