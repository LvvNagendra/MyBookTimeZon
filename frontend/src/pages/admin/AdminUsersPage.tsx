import { Link } from "react-router-dom";
import { ADMIN_END_USERS } from "../../data/dummy";

export default function AdminUsersPage() {
  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/admin">Overview</Link>
      </p>
      <h1 className="page-title">End users</h1>
      <p className="page-subtitle">Customers and tenant owners — demo list; wire search & filters to API later.</p>

      <div className="surface-card glass-card" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_END_USERS.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
