import { useCallback, useEffect, useState } from "react";
import { apiAdminUsers, type AdminUserRow } from "../../api/client";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminAlert, AdminEmptyState, AdminPanel, AdminStatusBadge } from "../../components/admin/AdminUi";
import { useAuth } from "../../context/AuthContext";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      setRows(await apiAdminUsers(token));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main id="main" className="sa-page">
      <AdminPageHeader
        title="End users"
        subtitle="Live platform directory — customers, tenant owners, staff, and platform admins."
      />
      {err ? <AdminAlert>{err}</AdminAlert> : null}

      <AdminPanel title="Directory" subtitle={loading ? "Loading…" : `${rows.length} accounts`}>
        {!loading && rows.length === 0 ? (
          <AdminEmptyState title="No users yet" text="Accounts appear here after signup." />
        ) : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.mobile || "—"}</td>
                    <td>
                      <AdminStatusBadge status={u.role} />
                    </td>
                    <td>{u.status}</td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </main>
  );
}
