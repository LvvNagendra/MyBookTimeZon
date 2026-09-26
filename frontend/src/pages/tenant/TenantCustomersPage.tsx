import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiTenantCustomers, type TenantCustomerRow } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function TenantCustomersPage() {
  const { token, profile } = useAuth();
  const clinicId = profile?.clinic?.id ?? null;
  const [rows, setRows] = useState<TenantCustomerRow[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token || !clinicId) return;
    setLoading(true);
    setErr(null);
    try {
      setRows(await apiTenantCustomers(token, clinicId));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not load customers");
    } finally {
      setLoading(false);
    }
  }, [token, clinicId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        (c.mobile ?? "").includes(needle),
    );
  }, [rows, q]);

  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/dashboard">Overview</Link>
      </p>
      <h1 className="page-title">Customers</h1>
      <p className="page-subtitle">
        CRM from real bookings — visit count, last visit, and notes for every client who booked your{" "}
        {profile?.clinic?.businessType?.toLowerCase() ?? "business"}.
      </p>

      <div className="surface-card" style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search name, email, mobile…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: "1 1 16rem" }}
          aria-label="Search customers"
        />
        <button type="button" className="btn btn--ghost" onClick={() => void load()}>
          Refresh
        </button>
        <Link className="btn btn--primary" to="/dashboard/bookings">
          View bookings
        </Link>
      </div>

      {err ? <p className="form-error">{err}</p> : null}
      {loading ? <p className="text-muted">Loading customers…</p> : null}

      {!loading && filtered.length === 0 ? (
        <div className="surface-card glass-card">
          <p className="text-muted" style={{ margin: 0 }}>
            No customers yet. When guests book online, they appear here automatically.
          </p>
        </div>
      ) : (
        <div className="surface-card" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Visits</th>
                <th>Last visit</th>
                <th>Last service</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.customerId}>
                  <td>
                    <strong>{c.name}</strong>
                    {c.lastStatus ? (
                      <div className="text-muted small">{c.lastStatus}</div>
                    ) : null}
                  </td>
                  <td>
                    <div>{c.email}</div>
                    <div className="text-muted small">{c.mobile || "—"}</div>
                  </td>
                  <td>{c.visitCount}</td>
                  <td>
                    {c.lastVisitAt
                      ? new Date(c.lastVisitAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td>{c.lastServiceName || "—"}</td>
                  <td>{c.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
