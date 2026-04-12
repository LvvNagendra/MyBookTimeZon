import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageBackBar } from "../components/PageBackBar";
import { ApiError, USE_MOCK_API, apiBeautyCoachChat } from "../api/client";
import { BEAUTY_COACH_SEED } from "../data/dummy";

type Msg = { role: "user" | "assistant"; text: string };

export default function BeautyCoachPage() {
  const [messages, setMessages] = useState<Msg[]>(BEAUTY_COACH_SEED as Msg[]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const userText = input.trim();
    if (!userText || loading) return;
    setError(null);
    setInput("");

    const historyForApi = messages.map((m) => ({ role: m.role, content: m.text }));
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const { reply, offline: isOffline } = await apiBeautyCoachChat(userText, historyForApi);
      setOffline(Boolean(isOffline));
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong. Try again.";
      setError(msg);
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main" className="section page-pad coach-page">
      <div className="page-narrow">
        <PageBackBar to="/home" label="Home" />
        <header className="coach-header">
          <h1 className="page-title">AI beauty coach</h1>
          <p className="page-subtitle">
            Server-side LLM for hair, beard, scalp, everyday makeup, and skincare routines. Describe your face shape or
            concerns in text (photos are analyzed on-device on the{" "}
            <Link to="/ai-hair">AI hair</Link> page). Not medical advice — see a dermatologist for persistent issues.
          </p>
          {USE_MOCK_API ? (
            <p className="coach-mode-banner" role="status">
              <strong>Demo / mock mode:</strong> <code>VITE_USE_MOCK=true</code> in your Vite env — the browser does{" "}
              <strong>not</strong> call the Spring API, so no server LLM runs. Set{" "}
              <code>VITE_USE_MOCK=false</code>, restart <code>npm run dev</code>, keep the API reachable (e.g. Vite proxy
              to port 8090), then configure the key on the <strong>backend only</strong>.
            </p>
          ) : (
            offline && (
              <p className="coach-mode-banner" role="status">
                The API answered with a local fallback (often coach disabled or no key on the server). Set{" "}
                <code>OPENAI_API_KEY</code> and/or <code>GEMINI_API_KEY</code> (or <code>app.beauty-coach.*-api-key</code>) in
                Spring — never in Vite env files.
              </p>
            )
          )}
          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}
        </header>

        <div ref={logRef} className="chat-log surface-card" role="log" aria-live="polite">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble chat-bubble--${msg.role}`}>
              <div className="chat-bubble__text">{msg.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble chat-bubble--assistant chat-bubble--typing" aria-busy="true">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}
        </div>

        <form className="chat-form" onSubmit={send}>
          <label className="visually-hidden" htmlFor="coach-input">
            Message
          </label>
          <input
            id="coach-input"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. How do I tame frizz in humid weather?"
            autoComplete="off"
            disabled={loading}
            maxLength={4000}
          />
          <button type="submit" className="btn btn--gold" disabled={loading || !input.trim()}>
            {loading ? "…" : "Send"}
          </button>
        </form>
        <p className="text-muted small coach-footnote">
          Live AI: <code>VITE_USE_MOCK=false</code> + running Spring Boot + key on the server (
          <code>OPENAI_API_KEY</code> and/or <code>GEMINI_API_KEY</code>; optional <code>BEAUTY_COACH_LLM</code>). Models:{" "}
          <code>app.beauty-coach.model</code> / <code>app.beauty-coach.gemini-model</code>. Never put keys in the browser —
          rotate any leaked key.
        </p>
      </div>
    </main>
  );
}
