import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiTenantCreateTrendingStyle,
  apiTenantDeleteTrendingStyle,
  apiTenantTrendingStyles,
  type TrendingStyleRow,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function TenantTrendingStylesPage() {
  const { token, profile, loading } = useAuth();
  const clinicId = profile?.clinic?.id ?? null;
  const [rows, setRows] = useState<TrendingStyleRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const load = useCallback(async () => {
    if (!token || !clinicId) return;
    setErr(null);
    try {
      setRows(await apiTenantTrendingStyles(token, clinicId));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, [token, clinicId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!token || !clinicId || !title.trim()) return;
    setErr(null);
    try {
      await apiTenantCreateTrendingStyle(token, clinicId, {
        title: title.trim(),
        tagline: tagline.trim() || null,
        imageUrl: imageUrl.trim() || null,
        sortOrder,
        active: true,
      });
      setTitle("");
      setTagline("");
      setImageUrl("");
      setSortOrder(0);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not add");
    }
  }

  async function onDelete(id: string) {
    if (!token || !clinicId) return;
    if (!window.confirm("Remove this trending item from your public salon page?")) return;
    setErr(null);
    try {
      await apiTenantDeleteTrendingStyle(token, clinicId, id);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading && !profile) return <main className="section hub-page"><p className="text-muted">Loading…</p></main>;

  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/dashboard">Overview</Link>
      </p>
      <h1 className="page-title">Trending at your salon</h1>
      <p className="page-subtitle">
        Curated looks and promotions shown on your <strong>public booking page</strong> (same tenant only). Optional image URL
        (HTTPS). This is editorial content — not automated from other salons&apos; data.
      </p>
      {err && <div className="alert alert--error">{err}</div>}

      <div className="dash-grid">
        <section className="surface-card glass-card">
          <h2 className="section-heading">Add trending item</h2>
          <form onSubmit={onAdd} className="stack">
            <div className="field">
              <label htmlFor="tt">Title</label>
              <input id="tt" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Butterfly layers" />
            </div>
            <div className="field">
              <label htmlFor="tg">Tagline</label>
              <textarea
                id="tg"
                rows={2}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Short line for customers"
                className="input-textarea"
              />
            </div>
            <div className="field">
              <label htmlFor="tiu">Image URL (optional)</label>
              <input id="tiu" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div className="field">
              <label htmlFor="tso">Sort order</label>
              <input id="tso" type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} />
            </div>
            <button type="submit" className="btn btn--gradient btn--wide">
              Save to public page
            </button>
          </form>
        </section>

        <section className="surface-card">
          <h2 className="section-heading">Catalog ({rows.length})</h2>
          {rows.length === 0 ? (
            <p className="text-muted">No items yet — add one to show on your salon&apos;s explore page.</p>
          ) : (
            <ul className="data-list">
              {rows.map((r) => (
                <li key={r.id} className="trending-admin-row">
                  <div>
                    <strong>{r.title}</strong>
                    {r.tagline && <p className="text-muted small">{r.tagline}</p>}
                    <p className="text-muted small">
                      Sort {r.sortOrder}
                      {r.imageUrl ? (
                        <>
                          {" "}
                          · <a href={r.imageUrl}>image</a>
                        </>
                      ) : null}
                      {!r.active ? " · hidden" : ""}
                    </p>
                  </div>
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => void onDelete(r.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
