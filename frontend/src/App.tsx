import { useCallback, useEffect, useState } from "react";
import {
  apiMe,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
  type ProfileData,
} from "./api/client";
import { AuthPanel } from "./components/AuthPanel";
import { IconCalendar, IconShop, IconUser } from "./components/Icons";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import "./styles/global.css";

type AuthTab = "signin" | "signup";

export default function App() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [authTab, setAuthTab] = useState<AuthTab>("signin");
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async (t: string) => {
    setProfileError(null);
    try {
      const data = await apiMe(t);
      setProfile(data);
    } catch {
      setProfile(null);
      setProfileError("We could not load your profile. Try signing in again.");
    }
  }, []);

  useEffect(() => {
    if (token) {
      void loadProfile(token);
    } else {
      setProfile(null);
    }
  }, [token, loadProfile]);

  function handleAuthSuccess(t: string) {
    setStoredToken(t);
    setToken(t);
  }

  function handleSignOut() {
    clearStoredToken();
    setToken(null);
    setProfile(null);
    setProfileError(null);
  }

  function scrollToAccount(tab: AuthTab) {
    setAuthTab(tab);
    document.getElementById("account")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const signedIn = Boolean(token);

  return (
    <>
      <SiteHeader
        signedIn={signedIn}
        onSignInClick={() => scrollToAccount("signin")}
        onCreateClick={() => scrollToAccount("signup")}
        onLogoClick={scrollTop}
      />

      <main id="main">
        <section className="hero section" aria-labelledby="hero-title">
          <div className="hero__grid">
            <div>
              <span className="hero__badge">Clinics, salons, fitness — one simple system</span>
              <h1 id="hero-title">Take bookings online without confusing your staff or customers</h1>
              <p className="hero__sub">
                MyBookTimeZon helps you show open times, confirm visits, and stay organised. Words stay short. Buttons
                stay big. Everyone can follow along.
              </p>
              <div className="hero__ctas">
                <button type="button" className="btn btn--primary" onClick={() => scrollToAccount("signup")}>
                  Start free for your business
                </button>
                <a className="btn btn--ghost" href="#for-customers">
                  I only want to book
                </a>
              </div>
              <p className="hero__note">
                Same product whether you run a doctor clinic, a beauty salon, or personal training. You choose your
                services and hours; customers see only what matters to them.
              </p>
            </div>
            <aside className="hero-card" aria-label="What you get">
              <h2>What you get</h2>
              <ul>
                <li>A clear calendar for your team</li>
                <li>A shareable link so customers book themselves</li>
                <li>Room to add payments and reminders later</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="section section--tight" id="for-business" aria-labelledby="biz-title">
          <h2 className="section__title" id="biz-title">
            For your business
          </h2>
          <p className="section__lead">
            If you own or manage the place, this side is for you. You sign in, set up services and people, then share
            your link.
          </p>
          <div className="audience-grid">
            <article className="audience-card">
              <div className="audience-card__icon">
                <IconShop />
              </div>
              <h3>One login for the owner</h3>
              <p>Create an account with your business name. You get a secure sign-in and your own booking page address.</p>
              <button type="button" className="btn btn--primary btn--small" onClick={() => scrollToAccount("signup")}>
                Create account
              </button>
            </article>
            <article className="audience-card">
              <div className="audience-card__icon">
                <IconCalendar />
              </div>
              <h3>Your team, your timetable</h3>
              <p>Add staff and services when your backend is connected. Everyone sees who works when — no double bookings.</p>
            </article>
          </div>
        </section>

        <section className="section section--tight" id="for-customers" aria-labelledby="cust-title">
          <h2 className="section__title" id="cust-title">
            For customers
          </h2>
          <p className="section__lead">
            People who only want an appointment do not need training. They open your link, choose a time, and done.
          </p>
          <div className="audience-grid">
            <article className="audience-card">
              <div className="audience-card__icon">
                <IconUser />
              </div>
              <h3>Simple steps on the phone</h3>
              <p>Large text, few screens, no account needed at first. Pick service, pick time, confirm.</p>
            </article>
            <article className="audience-card">
              <div className="audience-card__icon">
                <IconCalendar />
              </div>
              <h3>They always see the right business</h3>
              <p>Your short link belongs only to you. Customers never mix you up with another salon or clinic.</p>
            </article>
          </div>
        </section>

        <section className="section" id="how-it-works" aria-labelledby="how-title">
          <h2 className="section__title" id="how-title">
            How it works in three steps
          </h2>
          <p className="section__lead">Read top to bottom. Each step is one idea only.</p>
          <div className="steps">
            <div className="step">
              <div className="step__num" aria-hidden>
                1
              </div>
              <h3>You register</h3>
              <p>Email, password, business name, and a short link name. Takes a few minutes.</p>
            </div>
            <div className="step">
              <div className="step__num" aria-hidden>
                2
              </div>
              <h3>You set up</h3>
              <p>Add services and staff in your dashboard when those features are on. Set when you are open.</p>
            </div>
            <div className="step">
              <div className="step__num" aria-hidden>
                3
              </div>
              <h3>Customers book</h3>
              <p>They use your link. You see new visits on your calendar. Less phone tag.</p>
            </div>
          </div>
        </section>

        <section className="section auth-wrap section--tight">
          {signedIn ? (
            <div className="signed-bar" id="account" style={{ maxWidth: 520, margin: "0 auto" }}>
              <strong>Signed in</strong>
              {profile ? (
                <>
                  <span style={{ display: "block", marginTop: 8 }}>
                    Hello, <strong>{profile.user.name}</strong>
                  </span>
                  {profile.clinic && (
                    <span style={{ display: "block", marginTop: 4, color: "#065f46" }}>
                      Business: <strong>{profile.clinic.businessName}</strong> — link name:{" "}
                      <strong>{profile.clinic.slug}</strong>
                    </span>
                  )}
                </>
              ) : profileError ? (
                <span style={{ color: "#991b1b" }}>{profileError}</span>
              ) : (
                <span>Loading your details…</span>
              )}
              <p className="hint" style={{ marginTop: 12, marginBottom: 0 }}>
                Sign out if you need to open a different business account on this device.
              </p>
              <button type="button" className="btn btn--ghost btn--small" style={{ marginTop: 16 }} onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <AuthPanel activeTab={authTab} onTabChange={setAuthTab} onAuthSuccess={handleAuthSuccess} />
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
