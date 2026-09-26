import type { Detection, FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageBackBar } from "../components/PageBackBar";
import { AI_HAIR_STYLES, NEARBY_SALONS } from "../data/dummy";
import { apiBeautyCoachPersonalize, type BeautyCoachPersonalizeResult } from "../api/client";
import { useFaceLandmarks } from "../hooks/useFaceLandmarks";
import {
  detectVideoFrame,
  detectionsFromLandmarks,
  inferFaceAttributesFromLandmarks,
  loadFaceLandmarkerVideo,
} from "../lib/faceLandmarker";
import { drawHairComposite } from "../lib/hairComposite";
import {
  drawFaceBoxes,
  faceOverlayLabel,
  salonFaceShapeCategory,
  type InferredFaceAttributes,
} from "../lib/faceDetection";
import { salonDetailPath } from "../utils/salonRoutes";

const EMPTY_ATTRS: InferredFaceAttributes = {
  faceShape: "—",
  hairThickness: "—",
  forehead: "—",
  hairVolume: "—",
  faceCount: 0,
  confidence: 0,
};

const MAX_PREVIEW = 960;

const TINT_SWATCHES: { label: string; hex: string | null }[] = [
  { label: "Natural", hex: null },
  { label: "Warm brown", hex: "#7a4a32" },
  { label: "Copper", hex: "#b87348" },
  { label: "Black tea", hex: "#2a1810" },
  { label: "Auburn", hex: "#6b2f28" },
];

export default function AiHairSuggestPage() {
  const [styleIdx, setStyleIdx] = useState(0);
  const [hairOpacity, setHairOpacity] = useState(0.85);
  const [tintHex, setTintHex] = useState<string | null>(null);
  const [applyHeadRotation, setApplyHeadRotation] = useState(true);

  const { detectImage } = useFaceLandmarks();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const workRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const videoLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const overlaySizeRef = useRef({ w: 0, h: 0 });
  const lastAttrsUiSigRef = useRef("");
  const lastAttrsUiAtRef = useRef(0);
  const styleIdRef = useRef(AI_HAIR_STYLES[0].id);
  const salonTagRef = useRef<string | null>(null);
  const photoImgRef = useRef<HTMLImageElement | null>(null);
  const lastPhotoLandmarksRef = useRef<NormalizedLandmark[] | null>(null);

  const lastCamLmRef = useRef<NormalizedLandmark[] | null>(null);
  const lastCamInfRef = useRef<InferredFaceAttributes>(EMPTY_ATTRS);
  const lastCamDetsRef = useRef<Detection[]>([]);
  const touchStartXRef = useRef<number | null>(null);

  const [mode, setMode] = useState<"idle" | "camera" | "photo">("idle");
  const [modelLoading, setModelLoading] = useState(false);
  const [attrs, setAttrs] = useState<InferredFaceAttributes>(EMPTY_ATTRS);
  const [err, setErr] = useState<string | null>(null);
  const [hairConcernText, setHairConcernText] = useState("");
  const [skinNotes, setSkinNotes] = useState("");
  const [personalizeLoading, setPersonalizeLoading] = useState(false);
  const [personalizeResult, setPersonalizeResult] = useState<BeautyCoachPersonalizeResult | null>(null);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    videoLandmarkerRef.current = null;
    overlaySizeRef.current = { w: 0, h: 0 };
    lastAttrsUiSigRef.current = "";
    lastAttrsUiAtRef.current = 0;
    lastCamLmRef.current = null;
    lastCamDetsRef.current = [];
    lastCamInfRef.current = EMPTY_ATTRS;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const renderHairOpts = useCallback(
    () => ({
      opacity: hairOpacity,
      tintHex,
      applyHeadRotation,
    }),
    [hairOpacity, tintHex, applyHeadRotation],
  );

  const paintCameraOverlay = useCallback(
    (W: number, H: number) => {
      const lm = lastCamLmRef.current;
      const inferred = lastCamInfRef.current;
      const dets = lastCamDetsRef.current;
      const ov = overlayRef.current;
      if (!ov) return;
      if (overlaySizeRef.current.w !== W || overlaySizeRef.current.h !== H) {
        ov.width = W;
        ov.height = H;
        overlaySizeRef.current = { w: W, h: H };
      }
      const octx = ov.getContext("2d");
      if (!octx) return;
      octx.clearRect(0, 0, W, H);
      drawHairComposite(
        octx,
        lm,
        W,
        H,
        dets[0]?.boundingBox,
        styleIdRef.current,
        salonTagRef.current,
        renderHairOpts(),
      );
      drawFaceBoxes(octx, dets, { label: faceOverlayLabel(inferred) });
    },
    [renderHairOpts],
  );

  const applyPhotoComposite = useCallback(() => {
    const work = workRef.current;
    const img = photoImgRef.current;
    const lm = lastPhotoLandmarksRef.current;
    if (!work || !img?.complete || img.naturalWidth === 0 || work.width === 0) return;
    const wctx = work.getContext("2d");
    if (!wctx) return;
    const W = work.width;
    const H = work.height;
    wctx.clearRect(0, 0, W, H);
    wctx.drawImage(img, 0, 0, W, H);
    if (!lm) {
      return;
    }
    const dets = detectionsFromLandmarks([lm], W, H);
    const inferred = inferFaceAttributesFromLandmarks([lm], W, H);
    drawHairComposite(wctx, lm, W, H, dets[0]?.boundingBox, styleIdRef.current, salonTagRef.current, renderHairOpts());
    drawFaceBoxes(wctx, dets, { label: faceOverlayLabel(inferred) });
  }, [renderHairOpts]);

  const startCamera = useCallback(async () => {
    setErr(null);
    setMode("idle");
    setModelLoading(true);
    try {
      const flm = await loadFaceLandmarkerVideo();
      videoLandmarkerRef.current = flm;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (!v) return;
      v.srcObject = stream;
      await v.play();
      setMode("camera");

      const loop = () => {
        const video = videoRef.current;
        const fl = videoLandmarkerRef.current;
        if (!video || !fl || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (w === 0 || h === 0) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        try {
          const { primary, all } = detectVideoFrame(fl, video);
          lastCamLmRef.current = primary;
          const inferred = inferFaceAttributesFromLandmarks(all, w, h);
          lastCamInfRef.current = inferred;
          lastCamDetsRef.current = primary ? detectionsFromLandmarks([primary], w, h) : [];

          const tag = salonFaceShapeCategory(inferred);
          const sig = `${inferred.faceCount}|${inferred.faceShape}|${tag ?? ""}`;
          const t = performance.now();
          if (sig !== lastAttrsUiSigRef.current || t - lastAttrsUiAtRef.current > 350) {
            lastAttrsUiSigRef.current = sig;
            lastAttrsUiAtRef.current = t;
            setAttrs(inferred);
          }
        } catch (e: unknown) {
          setErr(e instanceof Error ? e.message : "Detection error");
        }

        paintCameraOverlay(w, h);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not open camera");
      setMode("idle");
    } finally {
      setModelLoading(false);
    }
  }, [paintCameraOverlay]);

  const onPhotoChosen = useCallback(
    async (file: File) => {
      stopCamera();
      setErr(null);
      setMode("idle");
      setModelLoading(true);
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error("Invalid image"));
          img.src = url;
        });

        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        const scale = Math.min(1, MAX_PREVIEW / Math.max(nw, nh));
        const cw = Math.round(nw * scale);
        const ch = Math.round(nh * scale);

        const work = workRef.current;
        if (!work) {
          URL.revokeObjectURL(url);
          return;
        }
        work.width = cw;
        work.height = ch;
        work.classList.add("face-work-canvas--visible");
        const wctx = work.getContext("2d");
        if (!wctx) {
          URL.revokeObjectURL(url);
          return;
        }
        wctx.drawImage(img, 0, 0, cw, ch);
        const { primary, all } = await detectImage(work);
        lastPhotoLandmarksRef.current = primary;
        photoImgRef.current = img;
        setAttrs(inferFaceAttributesFromLandmarks(all.length ? all : primary ? [primary] : [], cw, ch));
        setMode("photo");
        applyPhotoComposite();
        URL.revokeObjectURL(url);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Could not read image");
      } finally {
        setModelLoading(false);
      }
    },
    [stopCamera, applyPhotoComposite, detectImage],
  );

  const resetAll = useCallback(() => {
    stopCamera();
    setMode("idle");
    setAttrs(EMPTY_ATTRS);
    setErr(null);
    setPersonalizeResult(null);
    setHairConcernText("");
    setSkinNotes("");
    photoImgRef.current = null;
    lastPhotoLandmarksRef.current = null;
    const work = workRef.current;
    if (work) {
      work.classList.remove("face-work-canvas--visible");
      const c = work.getContext("2d");
      if (c) c.clearRect(0, 0, work.width, work.height);
    }
    const ov = overlayRef.current;
    if (ov) {
      const c = ov.getContext("2d");
      if (c) c.clearRect(0, 0, ov.width, ov.height);
    }
  }, [stopCamera]);

  const downloadSnapshot = useCallback(() => {
    const merge = document.createElement("canvas");
    const ctx = merge.getContext("2d");
    if (!ctx) return;

    if (mode === "photo") {
      const work = workRef.current;
      if (!work || work.width === 0) return;
      merge.width = work.width;
      merge.height = work.height;
      ctx.drawImage(work, 0, 0);
    } else if (mode === "camera") {
      const video = videoRef.current;
      const ov = overlayRef.current;
      if (!video || !ov || video.videoWidth === 0) return;
      merge.width = video.videoWidth;
      merge.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, merge.width, merge.height);
      ctx.drawImage(ov, 0, 0, merge.width, merge.height);
    } else {
      return;
    }

    merge.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `hair-preview-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }, [mode]);

  const salonTag = salonFaceShapeCategory(attrs);
  const stylesForYou = useMemo(() => {
    if (!salonTag) return AI_HAIR_STYLES;
    const match = AI_HAIR_STYLES.filter((s) => s.faceShape === salonTag);
    const rest = AI_HAIR_STYLES.filter((s) => s.faceShape !== salonTag);
    return [...match, ...rest];
  }, [salonTag]);
  const cur = stylesForYou[styleIdx % stylesForYou.length];

  useEffect(() => {
    styleIdRef.current = cur.id;
  }, [cur.id]);

  useEffect(() => {
    salonTagRef.current = salonTag;
  }, [salonTag]);

  useEffect(() => {
    if (mode !== "photo") return;
    applyPhotoComposite();
  }, [mode, cur.id, salonTag, applyPhotoComposite]);

  const onCarouselTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.changedTouches[0]?.clientX ?? null;
  };

  async function runPersonalizedCoach() {
    if (attrs.faceCount < 1) {
      setErr("Detect a face first (camera or photo), then run personalized suggestions.");
      return;
    }
    setErr(null);
    setPersonalizeLoading(true);
    try {
      const data = await apiBeautyCoachPersonalize({
        faceShapeCategory: salonTag,
        faceShapeDetail: attrs.faceShape,
        faceCount: attrs.faceCount,
        hairConcern: hairConcernText.trim() || null,
        skinOrMakeupNotes: skinNotes.trim() || null,
      });
      setPersonalizeResult(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Personalization request failed");
      setPersonalizeResult(null);
    } finally {
      setPersonalizeLoading(false);
    }
  }

  const onCarouselTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartXRef.current;
    touchStartXRef.current = null;
    const end = e.changedTouches[0]?.clientX;
    if (start == null || end == null) return;
    const dx = end - start;
    if (dx > 48) setStyleIdx((x) => x - 1);
    else if (dx < -48) setStyleIdx((x) => x + 1);
  };

  return (
    <main id="main" className="page-ai section page-pad">
      <div className="page-narrow">
        <PageBackBar to="/home" label="Home" />
        <h1 className="page-title">AI Hair Suggest</h1>
        <p className="page-subtitle">
          <strong>Face Landmarker</strong> fits a hair preview to <em>your</em> forehead and temples (dense facial mesh), then blends
          tones over your camera or upload. Everything runs locally in the browser — nothing is sent to our servers.
        </p>

        <div className="ai-upload-card surface-card glass-card">
          <div className="ai-file-input-wrap" aria-hidden="true">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="visually-hidden"
              tabIndex={-1}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onPhotoChosen(f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="ai-upload-card__icon" aria-hidden>
            ↑
          </div>
          <p className="ai-upload-card__lead">Upload or capture your photo</p>
          <p className="text-muted small">JPG, PNG, WebP · Clear front face · Camera needs HTTPS or localhost</p>
          {err && <div className="alert alert--error">{err}</div>}
          {modelLoading && <p className="text-muted small">Loading face model…</p>}
          <div className="stack-gap">
            <button
              type="button"
              className="btn btn--gradient btn--wide"
              disabled={modelLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose photo
            </button>
            <button type="button" className="btn btn--dark btn--wide" disabled={modelLoading} onClick={() => void startCamera()}>
              Use camera (live)
            </button>
            {(mode !== "idle" || attrs.faceCount > 0) && (
              <button type="button" className="btn btn--ghost btn--wide" onClick={resetAll}>
                Clear &amp; stop camera
              </button>
            )}
          </div>
        </div>

        <div className={`face-preview-wrap surface-card ${mode === "idle" ? "face-preview-wrap--empty" : ""}`}>
          {mode === "camera" && (
            <div className="face-live">
              <video ref={videoRef} className="face-live__video" playsInline muted autoPlay />
              <canvas ref={overlayRef} className="face-live__overlay" />
            </div>
          )}
          <canvas ref={workRef} className="face-work-canvas" aria-hidden />
          {mode === "idle" && <p className="text-muted small face-preview-placeholder">Choose a photo or start the camera for a live preview.</p>}
        </div>

        {attrs.faceCount > 0 && (
          <p className="face-confidence-badge">
            {attrs.faceCount} face{attrs.faceCount > 1 ? "s" : ""} · {(attrs.confidence * 100).toFixed(0)}% score
            {salonTag && <span> · Style group: {salonTag}</span>}
          </p>
        )}
        {(mode === "camera" || mode === "photo") && attrs.faceCount === 0 && !modelLoading && (
          <p className="text-muted small">No face detected — use a clear front-facing shot and good light.</p>
        )}

        {(mode === "camera" || mode === "photo") && (
          <section className="section-block ai-hair-tuning surface-card">
            <h2 className="section-heading">Blend &amp; alignment</h2>
            <p className="text-muted small">
              Opacity controls how strongly the style blends. Tint shifts the brown base. Turn off head rotation if the mesh jitters.
            </p>
            <label className="ai-hair-tuning__label">
              <span>Hairstyle opacity</span>
              <input
                type="range"
                min={0.25}
                max={1}
                step={0.01}
                value={hairOpacity}
                onChange={(e) => setHairOpacity(Number(e.target.value))}
              />
              <span className="ai-hair-tuning__value">{(hairOpacity * 100).toFixed(0)}%</span>
            </label>
            <div className="ai-tint-row">
              <span className="text-muted small">Tint</span>
              <div className="ai-tint-row__swatches">
                {TINT_SWATCHES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    className={`ai-tint-swatch${tintHex === t.hex ? " ai-tint-swatch--active" : ""}`}
                    style={t.hex ? { background: t.hex } : undefined}
                    title={t.label}
                    aria-label={t.label}
                    onClick={() => setTintHex(t.hex)}
                  >
                    {!t.hex ? "∅" : ""}
                  </button>
                ))}
              </div>
            </div>
            <label className="ai-hair-tuning__check">
              <input type="checkbox" checked={applyHeadRotation} onChange={(e) => setApplyHeadRotation(e.target.checked)} />
              <span>Align overlay to head tilt (roll from eye line)</span>
            </label>
            <button type="button" className="btn btn--ghost btn--wide" onClick={downloadSnapshot}>
              Download snapshot (PNG)
            </button>
          </section>
        )}

        <section className="section-block">
          <h2 className="section-heading">Hair style preview</h2>
          <p className="text-muted small">
            The tint follows <strong>your facial contour</strong> (MediaPipe Face Landmarker), not a generic rectangle. Presets change
            volume, length, and asymmetry; face-group tuning tweaks width. Still a <strong>salon-style visual guide</strong>, not
            photoreal hair replacement. Swipe <em>Recommended styles</em> below to change the look.
          </p>
          <div className="hair-style-preview hair-style-preview--hint surface-card">
            <p className="hair-style-preview__meta text-muted small">
              {mode === "idle" && "Use camera or upload above to see the composite live on your face."}
              {mode !== "idle" && attrs.faceCount > 0 && (
                <>
                  Active preset: <strong>{cur.name}</strong> — {cur.trend}
                </>
              )}
              {mode !== "idle" && attrs.faceCount === 0 && "No face detected yet — overlay appears when a face is found."}
            </p>
          </div>
        </section>

        <section className="section-block">
          <h2 className="section-heading">Detected (live)</h2>
          <p className="text-muted small">
            In camera mode these fields refresh from <strong>local</strong> landmark math each frame (throttled slightly for the text
            panel so React does not fight the animation). They are simple geometric hints, not a medical or server-side analysis.
          </p>
          <div className="face-attrs surface-card">
            <div>
              <span className="text-muted small">Face shape (hint)</span>
              <strong>{attrs.faceShape}</strong>
            </div>
            <div>
              <span className="text-muted small">Visibility / clarity</span>
              <strong>{attrs.hairThickness}</strong>
            </div>
            <div>
              <span className="text-muted small">Framing</span>
              <strong>{attrs.forehead}</strong>
            </div>
            <div>
              <span className="text-muted small">Notes</span>
              <strong>{attrs.hairVolume}</strong>
            </div>
          </div>
        </section>

        <section className="section-block ai-personalize surface-card">
          <h2 className="section-heading">Personalized tips</h2>
          <p className="text-muted small">
            Your <strong>photo pixels stay in the browser</strong>. The button below sends only{" "}
            <strong>coarse labels</strong> (face-shape hint + optional notes) to SlotNexa. With an API key you get a live
            LLM; without one, smart offline tips still work.
          </p>
          <div className="field">
            <label htmlFor="hc">Hair / scalp concern (optional)</label>
            <textarea
              id="hc"
              rows={2}
              className="input-textarea"
              value={hairConcernText}
              onChange={(e) => setHairConcernText(e.target.value)}
              placeholder="e.g. frizz, post-colour dryness, thinning at temples"
            />
          </div>
          <div className="field">
            <label htmlFor="sn">Skin / makeup notes (optional)</label>
            <textarea
              id="sn"
              rows={2}
              className="input-textarea"
              value={skinNotes}
              onChange={(e) => setSkinNotes(e.target.value)}
              placeholder="e.g. combination skin, want soft everyday makeup"
            />
          </div>
          <button
            type="button"
            className="btn btn--gradient btn--wide"
            disabled={personalizeLoading || attrs.faceCount < 1}
            onClick={() => void runPersonalizedCoach()}
          >
            {personalizeLoading ? "Asking coach…" : "Get personalized suggestions"}
          </button>
          {personalizeResult && (
            <div className="ai-personalize__result stack-gap">
              {personalizeResult.offline || (personalizeResult.disclaimer || "").toLowerCase().includes("heuristic") ? (
                <p className="sa-badge sa-badge--warn" style={{ width: "fit-content" }}>
                  Offline / heuristic tips
                </p>
              ) : (
                <p className="sa-badge sa-badge--ok" style={{ width: "fit-content" }}>
                  Live coach
                </p>
              )}
              <div>
                <p className="text-muted small">
                  <strong>Suggested haircuts</strong>
                </p>
                <ul className="text-muted">
                  {personalizeResult.suggestedHaircuts.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="section-heading section-heading--small">Hair health</h3>
                <ul className="text-muted">
                  {personalizeResult.hairHealthTips.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-muted small">
                  <strong>Product categories (generic)</strong>
                </p>
                <ul className="text-muted">
                  {personalizeResult.productCategories.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-muted small">
                  <strong>Facial / makeup framing</strong>
                </p>
                <ul className="text-muted">
                  {personalizeResult.facialTips.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <p className="text-muted small">{personalizeResult.disclaimer}</p>
            </div>
          )}
        </section>

        <section className="section-block">
          <h2 className="section-heading">Recommended styles</h2>
          <p className="text-muted small">
            {attrs.faceCount > 0 && salonTag
              ? `Order below matches your face first (${salonTag} from our hint), then other looks. Each card shows a reference photo.`
              : "Swipe styles — each card shows a reference photo. Upload a face to reorder by your detected shape."}
          </p>
          <div
            className="style-carousel style-carousel--swipe"
            onTouchStart={onCarouselTouchStart}
            onTouchEnd={onCarouselTouchEnd}
          >
            <button type="button" className="btn btn--ghost btn--small" aria-label="Previous style" onClick={() => setStyleIdx((x) => x - 1)}>
              ‹
            </button>
            <div className="style-carousel__panel surface-card glass-card">
              <span className="badge badge--lav">
                {attrs.faceCount > 0 && salonTag
                  ? `${cur.faceShape === salonTag ? "Matches you" : "Also try"} · ${cur.faceShape}`
                  : `For ${cur.faceShape} faces`}
              </span>
              {cur.imageUrl ? (
                <div className="style-carousel__media">
                  <img
                    src={cur.imageUrl}
                    alt={`${cur.name} reference`}
                    className="style-carousel__img"
                    decoding="async"
                  />
                </div>
              ) : null}
              <h3 className="style-name">{cur.name}</h3>
              <p className="text-muted">{cur.trend}</p>
              {"blurb" in cur && cur.blurb ? <p className="text-muted small">{cur.blurb}</p> : null}
              <p className="text-muted small style-carousel__hint">
                Reference look for the salon — your live preview above uses a contour tint, not this photo pasted on your
                head.
              </p>
            </div>
            <button type="button" className="btn btn--ghost btn--small" aria-label="Next style" onClick={() => setStyleIdx((x) => x + 1)}>
              ›
            </button>
          </div>
          <Link className="btn btn--gradient btn--wide" to={salonDetailPath(NEARBY_SALONS[0].slug, NEARBY_SALONS[0].businessType)}>
            Book this style at {NEARBY_SALONS[0].name}
          </Link>
        </section>

        <p className="text-center text-muted small privacy-foot">
          Face mesh preview runs in your browser. The optional coach button sends only short text hints to the API — not your image
          file.
        </p>
      </div>
    </main>
  );
}
