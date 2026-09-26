import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  apiAdminCatalogCreateSector,
  apiAdminCatalogModules,
  apiAdminCatalogSectors,
  apiAdminCatalogUpdateSector,
  type CatalogSector,
  type ProfileModule,
} from "../../api/client";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminAlert, AdminField, AdminFormGrid, AdminPanel, AdminStatusBadge } from "../../components/admin/AdminUi";
import { useAuth } from "../../context/AuthContext";

export default function AdminSectorsPage() {
  const { token } = useAuth();
  const [sectors, setSectors] = useState<CatalogSector[]>([]);
  const [modules, setModules] = useState<ProfileModule[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>(["booking", "staff", "payments", "crm"]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setErr(null);
    try {
      const [s, m] = await Promise.all([apiAdminCatalogSectors(token), apiAdminCatalogModules(token)]);
      setSectors(s);
      setModules(m);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load catalog");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleModule(mod: string) {
    setSelectedModules((prev) => (prev.includes(mod) ? prev.filter((x) => x !== mod) : [...prev, mod]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setErr(null);
    try {
      const body = {
        code: code.trim().toUpperCase(),
        label: label.trim(),
        description: description.trim() || undefined,
        active: true,
        moduleCodes: selectedModules,
      };
      if (editingId) {
        await apiAdminCatalogUpdateSector(token, editingId, body);
      } else {
        await apiAdminCatalogCreateSector(token, body);
      }
      setCode("");
      setLabel("");
      setDescription("");
      setEditingId(null);
      await load();
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(s: CatalogSector) {
    setEditingId(s.id);
    setCode(s.code);
    setLabel(s.label);
    setDescription(s.description ?? "");
    setSelectedModules(s.modules.map((m) => m.code));
  }

  function cancelEdit() {
    setEditingId(null);
    setCode("");
    setLabel("");
    setDescription("");
  }

  return (
    <main id="main" className="sa-page">
      <AdminPageHeader
        title="Sectors & modules"
        subtitle="Add business sectors dynamically and attach feature modules. Public booking URLs keep using the sector code (e.g. /book/SALON/…)."
      />

      {err ? <AdminAlert>{err}</AdminAlert> : null}

      <AdminPanel title={editingId ? "Edit sector" : "Add sector"} subtitle="Code is immutable after create">
        <form onSubmit={onSubmit}>
          <AdminFormGrid columns={2}>
            <AdminField id="sector-code" label="Code *" hint="Uppercase identifier used in URLs">
              <input
                id="sector-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="DENTAL"
                required
                disabled={Boolean(editingId)}
              />
            </AdminField>
            <AdminField id="sector-label" label="Label *">
              <input id="sector-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Dental clinic" required />
            </AdminField>
            <AdminField id="sector-desc" label="Description" full>
              <input id="sector-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </AdminField>
            <AdminField id="sector-modules" label="Feature modules" full>
              <div className="sa-check-grid" id="sector-modules">
                {modules.map((m) => (
                  <label key={m.code} className="sa-check">
                    <input type="checkbox" checked={selectedModules.includes(m.code)} onChange={() => toggleModule(m.code)} />
                    {m.label}
                  </label>
                ))}
              </div>
            </AdminField>
          </AdminFormGrid>
          <div className="sa-form-actions">
            <button type="submit" className="btn btn--gold" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update sector" : "Create sector"}
            </button>
            {editingId ? (
              <button type="button" className="btn btn--ghost" onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </AdminPanel>

      <div style={{ height: "1rem" }} />

      <AdminPanel title="Active sectors" subtitle={`${sectors.length} configured`}>
        <ul className="sa-list">
          {sectors.map((s) => (
            <li key={s.id} className="sa-list__item">
              <div>
                <strong>
                  {s.label} <span className="text-muted">({s.code})</span>
                </strong>
                <p className="sa-note">Modules: {s.modules.map((m) => m.code).join(", ") || "—"}</p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <AdminStatusBadge status={s.active ? "Active" : "Inactive"} />
                <button type="button" className="btn btn--ghost btn--small" onClick={() => startEdit(s)}>
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      </AdminPanel>
    </main>
  );
}
