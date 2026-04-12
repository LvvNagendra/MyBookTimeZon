import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageBackBar } from "../components/PageBackBar";
import { AI_HAIR_STYLES, NEARBY_SALONS } from "../data/dummy";
import { apiPatchCustomerProfile } from "../api/client";
import { formatInMobileDisplay } from "../utils/phone";
import { salonDetailPath } from "../utils/salonRoutes";
import { compressImageFileToDataUrl, dataUrlFromVideoFrame } from "../utils/imageCompress";

type Tab = "info" | "styles" | "favourites";

export default function ProfilePage() {
  const { token, profile, loading, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("info");
  const [photoUrl, setPhotoUrl] = useState("");
  const [busyPhoto, setBusyPhoto] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const displayPhoto = profile?.user.profilePhotoDataUrl || photoUrl.trim() || "";

  useEffect(() => {
    setPhotoUrl("");
  }, [profile?.user.profilePhotoDataUrl]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  async function startCamera() {
    setPhotoErr(null);
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
      setPhotoErr("Camera not available — use gallery upload.");
    }
  }

  async function savePhotoToServer(dataUrl: string | null) {
    if (!token || profile?.user.role !== "CUSTOMER") return;
    setBusyPhoto(true);
    setPhotoErr(null);
    try {
      await apiPatchCustomerProfile(token, {
        profilePhotoDataUrl: dataUrl === "" ? "" : dataUrl,
      });
      await refreshProfile();
    } catch (e: unknown) {
      setPhotoErr(e instanceof Error ? e.message : "Could not save photo");
    } finally {
      setBusyPhoto(false);
    }
  }

  if (!token && !loading) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main id="main" className="section page-pad profile-page">
      <div className="page-narrow">
        <PageBackBar to="/home" label="Home" />
        <h1 className="page-title">Profile</h1>
        {loading && <p className="text-muted">Loading…</p>}
        {!loading && profile && (
          <>
            <div className="surface-card profile-card glass-card">
              <div className="profile-avatar" aria-hidden>
                {displayPhoto ? (
                  <img src={displayPhoto} alt="" className="profile-avatar-img" width={72} height={72} />
                ) : (
                  profile.user.name.slice(0, 1).toUpperCase()
                )}
              </div>
              <p className="profile-name">{profile.user.name}</p>
              <p className="text-muted">{profile.user.email}</p>
              {profile.user.role === "CUSTOMER" && profile.user.mobile && (
                <p className="text-muted">
                  Mobile: <strong>+91 {formatInMobileDisplay(profile.user.mobile)}</strong>
                  <span className="small block" style={{ marginTop: 4 }}>
                    Used for booking SMS &amp; reminders.
                  </span>
                </p>
              )}
              <p className="badge badge--muted">{profile.user.role}</p>
            </div>

            <div className="profile-tabs" role="tablist" aria-label="Profile sections">
              <button type="button" role="tab" aria-selected={tab === "info"} className="profile-tab" onClick={() => setTab("info")}>
                Info
              </button>
              <button type="button" role="tab" aria-selected={tab === "styles"} className="profile-tab" onClick={() => setTab("styles")}>
                Saved styles
              </button>
              <button type="button" role="tab" aria-selected={tab === "favourites"} className="profile-tab" onClick={() => setTab("favourites")}>
                Favourites
              </button>
            </div>

            {tab === "info" && (
              <div className="surface-card section-block">
                <p>
                  <strong>Photo</strong> — syncs to your account for AI hairstyle tools and a consistent avatar. Optional HTTPS URL
                  or upload / camera (stored securely on the API; use a small image).
                </p>
                {photoErr && (
                  <div className="alert alert--error" role="alert">
                    {photoErr}
                  </div>
                )}
                {profile.user.role === "CUSTOMER" && (
                  <>
                    <div className="field">
                      <label>Upload or camera</label>
                      <div className="auth-photo-row">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={busyPhoto}
                          aria-label="Choose from gallery"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const url = await compressImageFileToDataUrl(f);
                            if (!url) setPhotoErr("Image too large or unreadable.");
                            else await savePhotoToServer(url);
                            e.target.value = "";
                          }}
                        />
                        {!cameraOn ? (
                          <button type="button" className="btn btn--ghost btn--small" disabled={busyPhoto} onClick={() => void startCamera()}>
                            Selfie
                          </button>
                        ) : (
                          <>
                            <video ref={videoRef} className="auth-camera-preview" playsInline muted width={200} height={150} />
                            <button
                              type="button"
                              className="btn btn--customer btn--small"
                              onClick={() => {
                                const url = dataUrlFromVideoFrame(videoRef.current!);
                                if (url) void savePhotoToServer(url);
                                else setPhotoErr("Capture failed.");
                                stopCamera();
                              }}
                            >
                              Capture
                            </button>
                            <button type="button" className="btn btn--ghost btn--small" onClick={() => stopCamera()}>
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor="purl">Or paste image URL</label>
                      <input
                        id="purl"
                        type="url"
                        value={photoUrl}
                        disabled={busyPhoto}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="https://…"
                      />
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={busyPhoto}
                        onClick={() => void savePhotoToServer(photoUrl.trim())}
                      >
                        Save URL to profile
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={busyPhoto || !profile.user.profilePhotoDataUrl}
                        onClick={() => void savePhotoToServer("")}
                      >
                        Remove photo
                      </button>
                    </div>
                  </>
                )}
                {profile.user.role !== "CUSTOMER" && (
                  <p className="text-muted small">Customer accounts can upload a portrait; other roles use tenant admin tools.</p>
                )}
                <p className="text-muted small" style={{ marginTop: "1rem" }}>
                  <Link to="/ai-hair">AI hair try-on</Link> · <Link to="/coach">Beauty coach</Link> ·{" "}
                  <Link to="/hair-health">Hair health</Link> · <Link to="/skin">Facial &amp; skin</Link>
                </p>
                <div className="field">
                  <label htmlFor="pn">Mobile</label>
                  <input id="pn" placeholder="+91 · · · · · · · · · ·" disabled />
                </div>
                <div className="oauth-row">
                  <button type="button" className="btn btn--ghost btn--small" disabled>
                    Google
                  </button>
                  <button type="button" className="btn btn--ghost btn--small" disabled>
                    Apple
                  </button>
                </div>
                <Link to="/my-bookings" className="btn btn--gradient btn--wide" style={{ marginTop: "1rem" }}>
                  Past bookings
                </Link>
              </div>
            )}

            {tab === "styles" && (
              <ul className="saved-styles">
                {AI_HAIR_STYLES.slice(0, 3).map((s) => (
                  <li key={s.id} className="surface-card saved-style-row">
                    <strong>{s.name}</strong>
                    <span className="text-muted small">{s.faceShape}</span>
                  </li>
                ))}
              </ul>
            )}

            {tab === "favourites" && (
              <ul className="fav-salons">
                {NEARBY_SALONS.map((s) => (
                  <li key={s.id}>
                    <Link to={salonDetailPath(s.slug, s.businessType)} className="surface-card fav-salon-row">
                      <span>{s.name}</span>
                      <span className="text-muted small">★ {s.rating}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <button type="button" className="btn btn--ghost btn--wide" onClick={() => signOut()}>
              Sign out
            </button>
          </>
        )}
      </div>
    </main>
  );
}
