import { useCallback, useEffect, useState } from "react";
import {
  apiAdminCatalogPermissions,
  apiAdminCatalogRoles,
  apiAdminCatalogSetRolePermissions,
  type CatalogPermission,
  type CatalogRole,
} from "../../api/client";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminAlert, AdminPanel } from "../../components/admin/AdminUi";
import { useAuth } from "../../context/AuthContext";

export default function AdminRolesPage() {
  const { token } = useAuth();
  const [roles, setRoles] = useState<CatalogRole[]>([]);
  const [permissions, setPermissions] = useState<CatalogPermission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [draftPerms, setDraftPerms] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setErr(null);
    try {
      const [r, p] = await Promise.all([apiAdminCatalogRoles(token), apiAdminCatalogPermissions(token)]);
      setRoles(r);
      setPermissions(p);
      if (!selectedRoleId && r.length > 0) {
        setSelectedRoleId(r[0].id);
        setDraftPerms(r[0].permissionCodes);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load roles");
    }
  }, [token, selectedRoleId]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [token]);

  function selectRole(role: CatalogRole) {
    setSelectedRoleId(role.id);
    setDraftPerms([...role.permissionCodes]);
  }

  function togglePerm(code: string) {
    setDraftPerms((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  async function save() {
    if (!token || !selectedRoleId) return;
    setSaving(true);
    setErr(null);
    try {
      const updated = await apiAdminCatalogSetRolePermissions(token, selectedRoleId, draftPerms);
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setDraftPerms(updated.permissionCodes);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const selected = roles.find((r) => r.id === selectedRoleId) ?? null;

  return (
    <main id="main" className="sa-page">
      <AdminPageHeader
        title="Roles & permissions"
        subtitle="Dynamic RBAC. Changes apply on the next API request — permissions resolve from the catalog live."
      />

      {err ? <AdminAlert>{err}</AdminAlert> : null}

      <div className="sa-roles-layout">
        <AdminPanel title="Roles" subtitle="Select a role to edit">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`btn btn--ghost btn--small sa-role-btn${selectedRoleId === r.id ? " sa-role-btn--active" : ""}`}
              onClick={() => selectRole(r)}
            >
              {r.label}
              <span className="text-muted"> · {r.code}</span>
            </button>
          ))}
        </AdminPanel>

        <AdminPanel
          title={selected ? `Permissions — ${selected.label}` : "Permissions"}
          subtitle={selected ? `${draftPerms.length} selected` : "Choose a role first"}
          actions={
            selected ? (
              <button type="button" className="btn btn--gold btn--small" disabled={saving} onClick={() => void save()}>
                {saving ? "Saving…" : "Save"}
              </button>
            ) : null
          }
        >
          {!selected ? (
            <p className="text-muted">Select a role</p>
          ) : (
            <div className="sa-perm-scroll">
              {permissions.map((p) => (
                <label key={p.id} className="sa-check" style={{ display: "flex", marginBottom: "0.65rem", alignItems: "flex-start" }}>
                  <input type="checkbox" checked={draftPerms.includes(p.code)} onChange={() => togglePerm(p.code)} />
                  <span>
                    <code>{p.code}</code> — {p.label}
                    <span className="text-muted"> ({p.scope})</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </AdminPanel>
      </div>
    </main>
  );
}
