import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiBeautyCoachPersonalize } from "../api/client";
import { PageBackBar } from "../components/PageBackBar";
import { useFaceLandmarks } from "../hooks/useFaceLandmarks";
import {
  detectVideoFrame,
  detectionsFromLandmarks,
  inferFaceAttributesFromLandmarks,
  loadFaceLandmarkerVideo,
} from "../lib/faceLandmarker";
import {
  drawFaceBoxes,
  faceOverlayLabel,
  salonFaceShapeCategory,
  type InferredFaceAttributes,
} from "../lib/faceDetection";
import { analyzeSkinFromCanvas, type SkinAnalysisResult } from "../lib/skinAnalysis";

const EMPTY_ATTRS: InferredFaceAttributes = {
  faceShape: "—",
  hairThickness: "—",
  forehead: "—",
  hairVolume: "—",
  faceCount: 0,
  confidence: 0,
};

const MAX_PREVIEW = 960;

export default function SkinFacialPage() {
  const { detectImage } = useFaceLandmarks();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const workRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const lastLmRef = useRef<NormalizedLandmark[] | null>(null);
  const lastAttrsRef = useRef<InferredFaceAttributes>(EMPTY_ATTRS);

  const [mode, setMode] = useState<"idle" | "camera" | "photo">("idle");
  const [modelLoading, setModelLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [attrs, setAttrs] = useState<InferredFaceAttributes>(EMPTY_ATTRS);
  const [err, setErr] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [coachTips, setCoachTips] = useState<string[] | null>(null);
  const [offlineCoach, setOfflineCoach] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const paintOverlay = useCallback((W: number, H: number, lm: NormalizedLandmark[] | null, inferred: InferredFaceAttributes) => {
    const ov = overlayRef.current;
    if (!ov) return;
    if (ov.width !== W || ov.height !== H) {
      ov.width = W;
      ov.height = H;
    }
    const octx = ov.getContext("2d");
    if (!octx) return;
    octx.clearRect(0, 0, W, H);
    if (!lm) return;
    const dets = detectionsFromLandmarks([lm], W, H);
    drawFaceBoxes(octx, dets, { color: "rgba(201, 162, 39, 0.95)", label: faceOverlayLabel(inferred) });
  }, []);

  const startCamera = useCallback(async () => {
    setErr(null);
    setResult(null);
    setCoachTips(null);
    setMode("idle");
    setModelLoading(true);
    try {
      const flm = await loadFaceLandmarkerVideo();
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
        if (!video || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        try {
          const { primary, all } = detectVideoFrame(flm, video);
          lastLmRef.current = primary;
          const inferred = inferFaceAttributesFromLandmarks(all, w, h);
          lastAttrsRef.current = inferred;
          setAttrs(inferred);
          paintOverlay(w, h, primary, inferred);
        } catch (e: unknown) {
          setErr(e instanceof Error ? e.message : "Detection error");
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not open camera");
      setMode("idle");
    } finally {
      setModelLoading(false);
    }
  }, [paintOverlay]);

  const onPhotoChosen = useCallback(
    async (file: File) => {
      stopCamera();
      setErr(null);
      setResult(null);
      setCoachTips(null);
      setModelLoading(true);
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error("Invalid image"));
          img.src = url;
        });
        const scale = Math.min(1, MAX_PREVIEW / Math.max(img.naturalWidth, img.naturalHeight));
        const cw = Math.round(img.naturalWidth * scale);
        const ch = Math.round(img.naturalHeight * scale);
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
        lastLmRef.current = primary;
        const inferred = inferFaceAttributesFromLandmarks(all.length ? all : primary ? [primary] : [], cw, ch);
        lastAttrsRef.current = inferred;
        setAttrs(inferred);
        setMode("photo");
        if (primary) {
          const dets = detectionsFromLandmarks([primary], cw, ch);
          drawFaceBoxes(wctx, dets, { color: "rgba(201, 162, 39, 0.95)", label: faceOverlayLabel(inferred) });
        }
        URL.revokeObjectURL(url);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Could not read image");
        setMode("idle");
      } finally {
        setModelLoading(false);
      }
    },
    [stopCamera, detectImage],
  );

  const snapshotForAnalysis = useCallback((): HTMLCanvasElement | null => {
    const work = workRef.current;
    if (!work) return null;
    if (mode === "photo" && work.width > 0) return work;
    if (mode === "camera") {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0) return null;
      work.width = video.videoWidth;
      work.height = video.videoHeight;
      const ctx = work.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0);
      return work;
    }
    return null;
  }, [mode]);

  async function runAnalysis() {
    setErr(null);
    const canvas = snapshotForAnalysis();
    if (!canvas || attrs.faceCount < 1) {
      setErr("Detect a face first with camera or photo, then run skin analysis.");
      return;
    }
    setAnalyzing(true);
    try {
      const local = analyzeSkinFromCanvas(canvas, lastLmRef.current, lastAttrsRef.current);
      setResult(local);

      const tag = salonFaceShapeCategory(lastAttrsRef.current);
      const coach = await apiBeautyCoachPersonalize({
        faceShapeCategory: tag,
        faceShapeDetail: lastAttrsRef.current.faceShape,
        faceCount: lastAttrsRef.current.faceCount,
        hairConcern: null,
        skinOrMakeupNotes: notes.trim() || `Skin heuristic type: ${local.skinType}. Concerns: ${local.concerns.join("; ")}`,
      });
      setCoachTips(coach.facialTips);
      setOfflineCoach(Boolean(coach.offline) || (coach.disclaimer || "").toLowerCase().includes("heuristic"));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <main id="main" className="section page-pad">
      <div className="page-narrow">
        <PageBackBar to="/home" label="Home" />
        <h1 className="page-title">Facial &amp; skin analysis</h1>
        <p className="page-subtitle">
          MediaPipe Face Landmarker runs <strong>in your browser</strong>. We sample cheek regions for a skin-type
          heuristic, then fetch coach tips (live LLM when configured, otherwise smart offline tips). Not a medical diagnosis.
        </p>

        <div className="ai-upload-card surface-card glass-card">
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
          <p className="ai-upload-card__lead">Scan your face</p>
          <p className="text-muted small">Camera needs HTTPS or localhost · clear front light works best</p>
          {err ? <div className="alert alert--error">{err}</div> : null}
          {modelLoading ? <p className="text-muted small">Loading face model…</p> : null}
          <div className="stack-gap" style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
            <button type="button" className="btn btn--gold" disabled={modelLoading} onClick={() => void startCamera()}>
              Use camera
            </button>
            <button type="button" className="btn btn--ghost" disabled={modelLoading} onClick={() => fileInputRef.current?.click()}>
              Upload photo
            </button>
            {mode !== "idle" ? (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  stopCamera();
                  setMode("idle");
                  setAttrs(EMPTY_ATTRS);
                  setResult(null);
                  setCoachTips(null);
                  lastLmRef.current = null;
                }}
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>

        <section className="section-block" aria-live="polite">
          <div className={`face-preview-wrap surface-card ${mode === "idle" ? "face-preview-wrap--empty" : ""}`}>
            {mode === "camera" && (
              <div className="face-live">
                <video ref={videoRef} className="face-live__video" playsInline muted autoPlay />
                <canvas ref={overlayRef} className="face-live__overlay" />
              </div>
            )}
            <canvas
              ref={workRef}
              className={`face-work-canvas${mode === "photo" ? " face-work-canvas--visible" : ""}`}
              aria-hidden={mode !== "photo"}
            />
            {mode === "idle" ? (
              <p className="text-muted small face-preview-placeholder">Choose a photo or start the camera for a live scan.</p>
            ) : null}
          </div>
          {attrs.faceCount > 0 ? (
            <>
              <p className="face-confidence-badge">
                {attrs.faceCount} face{attrs.faceCount > 1 ? "s" : ""} · {(attrs.confidence * 100).toFixed(0)}% score
              </p>
              <div className="face-attrs surface-card" style={{ marginTop: "0.75rem" }}>
                <div>
                  <span className="text-muted small">Face shape hint</span>
                  <strong>{attrs.faceShape}</strong>
                </div>
                <div>
                  <span className="text-muted small">Clarity</span>
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
            </>
          ) : null}
          {(mode === "camera" || mode === "photo") && attrs.faceCount === 0 && !modelLoading ? (
            <p className="text-muted small">No face detected — use a clear front-facing shot and good light.</p>
          ) : null}
        </section>

        <section className="surface-card section-block">
          <div className="field">
            <label htmlFor="skin-notes">Skin notes (optional)</label>
            <textarea
              id="skin-notes"
              rows={2}
              className="input-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. combination, dry cheeks, want soft everyday makeup"
            />
          </div>
          <button
            type="button"
            className="btn btn--gold btn--wide"
            disabled={analyzing || attrs.faceCount < 1}
            onClick={() => void runAnalysis()}
          >
            {analyzing ? "Analyzing…" : "Run skin analysis"}
          </button>
        </section>

        {result ? (
          <>
            <div className="score-hero surface-card" style={{ marginTop: "1.25rem" }}>
              <div>
                <p className="text-muted small">Skin score · {result.source === "local-vision" ? "on-device" : "coach"}</p>
                <p className="score-value">
                  {result.score}
                  <span className="score-max">/10</span>
                </p>
                <p className="text-muted small">Type: {result.skinType}</p>
              </div>
              <div>
                <p className="text-muted small">Focus areas</p>
                <ul className="issue-list">
                  {result.concerns.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>

            <section className="section-block">
              <h2 className="section-heading">Personalized routine</h2>
              <div className="surface-card coach-block">
                <p>{result.routine}</p>
              </div>
            </section>

            <section className="section-block">
              <h2 className="section-heading">Diet &amp; habits</h2>
              <div className="surface-card coach-block glass-card">
                <p>{result.dietTips}</p>
              </div>
            </section>

            <section className="section-block">
              <h2 className="section-heading">Product ideas</h2>
              <div className="product-grid">
                {result.products.map((p) => (
                  <article key={p.name} className="surface-card product-card">
                    <strong>{p.name}</strong>
                    <span className="rating">★ {p.rating}</span>
                  </article>
                ))}
              </div>
            </section>

            {coachTips ? (
              <section className="section-block">
                <h2 className="section-heading">Coach facial tips {offlineCoach ? "(offline)" : "(live)"}</h2>
                <ul className="simple-list surface-card" style={{ padding: "1rem" }}>
                  {coachTips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <p className="surface-card facial-note">{result.facialSuggestion}</p>
          </>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", marginTop: "1rem" }}>
          <Link className="btn btn--gradient" to="/nearby?sector=CLINIC">
            Explore clinics
          </Link>
          <Link className="btn btn--ghost" to="/ai-hair">
            Try hairstyle suggest
          </Link>
          <Link className="btn btn--ghost" to="/coach">
            Beauty coach chat
          </Link>
        </div>
      </div>
    </main>
  );
}
