import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiCreateService,
  apiMetaStarterServiceTemplates,
  apiTenantServiceCategories,
  apiTenantServices,
  apiUpdateService,
  type StarterServiceTemplate,
} from "../../api/client";
import { useAuth } from "../../context/AuthContext";

type Svc = { id: string; name: string; category?: string | null; durationMinutes: number; priceCents: number; active: boolean };

const MIN_PAISE = 10_000;

function rupees(paise: number) {
  return (paise / 100).toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

/** Preset list in rupees → stored as paise (API field name is priceCents but values are paise). */
const PRESET_RUPEES = [100, 150, 199, 299, 499, 799, 999, 1499, 1999, 2499, 2999, 3999, 4999];

export default function TenantServicesPage() {
  const { token, profile, loading } = useAuth();
  const clinicId = profile?.clinic?.id ?? null;
  const businessType = profile?.clinic?.businessType ?? "SALON";
  const [services, setServices] = useState<Svc[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [svcName, setSvcName] = useState("Balayage");
  const [svcCategory, setSvcCategory] = useState("");
  const [svcMin, setSvcMin] = useState(90);
  const [svcPricePaise, setSvcPricePaise] = useState(250000);
  const [categories, setCategories] = useState<string[]>([]);
  const [starterTemplates, setStarterTemplates] = useState<StarterServiceTemplate[]>([]);
  const [templatePick, setTemplatePick] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sectorCategories = useMemo(() => {
    const set = new Set<string>();
    for (const t of starterTemplates) {
      if (t.category?.trim()) set.add(t.category.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [starterTemplates]);

  const load = useCallback(async () => {
    if (!token || !clinicId) return;
    setErr(null);
    try {
      const sv = (await apiTenantServices(token, clinicId)) as Svc[];
      setServices(sv);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, [token, clinicId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!token || !clinicId) return;
    let alive = true;
    void apiTenantServiceCategories(token, clinicId)
      .then((rows) => {
        if (alive) setCategories(Array.isArray(rows) ? (rows as string[]) : []);
      })
      .catch(() => {
        if (alive) setCategories([]);
      });
    return () => {
      alive = false;
    };
  }, [token, clinicId]);

  useEffect(() => {
    let alive = true;
    void apiMetaStarterServiceTemplates(businessType)
      .then((rows) => {
        if (alive) setStarterTemplates(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (alive) setStarterTemplates([]);
      });
    return () => {
      alive = false;
    };
  }, [businessType]);

  function applyTemplate(id: string) {
    setTemplatePick(id);
    if (!id) return;
    const t = starterTemplates.find((x) => x.name === id);
    if (!t) return;
    setSvcName(t.name);
    setSvcCategory(t.category?.trim() ?? "");
    setSvcMin(t.durationMinutes);
    setSvcPricePaise(Math.max(MIN_PAISE, t.priceCents));
  }

  function startEdit(s: Svc) {
    setEditingId(s.id);
    setSvcName(s.name);
    setSvcCategory(s.category ?? "");
    setSvcMin(s.durationMinutes);
    setSvcPricePaise(Math.max(MIN_PAISE, s.priceCents));
    setTemplatePick("");
    setErr(
      s.priceCents < MIN_PAISE
        ? `This service was below ₹100 — price raised to the minimum so you can save.`
        : null,
    );
  }

  function cancelEdit() {
    setEditingId(null);
    setSvcName("Balayage");
    setSvcCategory("");
    setSvcMin(90);
    setSvcPricePaise(250000);
    setTemplatePick("");
  }

  async function saveService(e: FormEvent) {
    e.preventDefault();
    if (!token || !clinicId) return;
    if (svcPricePaise < MIN_PAISE) {
      setErr(`Minimum price is ${rupees(MIN_PAISE)} (₹100).`);
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const body = {
        name: svcName.trim(),
        category: svcCategory.trim() || undefined,
        durationMinutes: svcMin,
        priceCents: svcPricePaise,
        active: true,
      };
      if (editingId) {
        await apiUpdateService(token, clinicId, editingId, body);
      } else {
        await apiCreateService(token, clinicId, body);
      }
      cancelEdit();
      await load();
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !profile) return <main className="section hub-page"><p className="text-muted">Loading…</p></main>;

  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/dashboard">Overview</Link>
      </p>
      <h1 className="page-title">Services</h1>
      <p className="page-subtitle">
        Create and edit pricing for <strong>this business only</strong>. Duplicate names are blocked; minimum price{" "}
        <strong>₹100</strong>.
      </p>
      {err && <div className="alert alert--error">{err}</div>}

      <div className="dash-grid">
        <section className="surface-card glass-card">
          <h2 className="section-heading">{editingId ? "Edit service" : "Add service"}</h2>
          <form onSubmit={(e) => void saveService(e)} className="stack">
            <div className="field">
              <label htmlFor="tpl">Quick fill from catalogue (by business type)</label>
              <select
                id="tpl"
                className="select-input"
                value={templatePick}
                onChange={(e) => applyTemplate(e.target.value)}
                disabled={Boolean(editingId)}
              >
                <option value="">— Pick a starter template (optional) —</option>
                {starterTemplates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                    {t.category ? ` · ${t.category}` : ""} · {t.durationMinutes} min · {rupees(t.priceCents)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="sn">Name</label>
              <input id="sn" value={svcName} onChange={(e) => setSvcName(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="scat-sector">Sector category (dropdown)</label>
              <select
                id="scat-sector"
                className="select-input"
                value=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) setSvcCategory(v);
                }}
              >
                <option value="">— Pick for {businessType} (optional) —</option>
                {sectorCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="scat">Category (saved value)</label>
              <input
                id="scat"
                value={svcCategory}
                onChange={(e) => setSvcCategory(e.target.value)}
                list="tenant-svc-cats"
                placeholder="e.g. Hair, Skin"
              />
              <datalist id="tenant-svc-cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label htmlFor="sm">Minutes</label>
              <input id="sm" type="number" min={5} max={480} value={svcMin} onChange={(e) => setSvcMin(+e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="spr">Quick price (₹)</label>
              <select
                id="spr"
                className="select-input"
                value={
                  PRESET_RUPEES.includes(Math.round(svcPricePaise / 100))
                    ? String(Math.round(svcPricePaise / 100))
                    : "custom"
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "custom") return;
                  setSvcPricePaise(Math.max(MIN_PAISE, +v * 100));
                }}
              >
                <option value="custom">Custom ({rupees(svcPricePaise)})</option>
                {PRESET_RUPEES.map((r) => (
                  <option key={r} value={r}>
                    {rupees(r * 100)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="sp">Amount (paise)</label>
              <input
                id="sp"
                type="number"
                min={MIN_PAISE}
                step={100}
                value={svcPricePaise}
                onChange={(e) => setSvcPricePaise(+e.target.value)}
              />
              <p className="hint">{rupees(svcPricePaise)} · minimum ₹100</p>
            </div>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
              <button type="submit" className="btn btn--gradient" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Update service" : "Add service"}
              </button>
              {editingId ? (
                <button type="button" className="btn btn--ghost" onClick={cancelEdit}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>
        <section className="surface-card">
          <h2 className="section-heading">Catalog ({services.length})</h2>
          <ul className="data-list">
            {services.map((s) => (
              <li key={s.id} className="service-row" style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                <div>
                  <strong>{s.name}</strong>
                  <span className="text-muted">
                    {" "}
                    {s.category ? `· ${s.category} ` : ""}· {s.durationMinutes} min · {rupees(s.priceCents)}
                    {!s.active ? " · inactive" : ""}
                  </span>
                </div>
                <button type="button" className="btn btn--ghost btn--small" onClick={() => startEdit(s)}>
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
