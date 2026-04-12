import { Link } from "react-router-dom";
import { TENANT_CUSTOMERS } from "../../data/dummy";

export default function TenantCustomersPage() {
  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/dashboard">Overview</Link>
      </p>
      <h1 className="page-title">Customers</h1>
      <p className="page-subtitle">Profiles, notes, visit history — CRM-ready layout.</p>

      <div className="surface-card" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Visits</th>
              <th>Last visit</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {TENANT_CUSTOMERS.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.visits}</td>
                <td>{c.lastVisit}</td>
                <td>{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
