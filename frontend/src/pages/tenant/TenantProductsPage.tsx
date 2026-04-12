import { Link } from "react-router-dom";
import { TENANT_PRODUCTS } from "../../data/dummy";

function rupees(paise: number) {
  return (paise / 100).toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

export default function TenantProductsPage() {
  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/dashboard">Overview</Link>
      </p>
      <h1 className="page-title">Retail products</h1>
      <p className="page-subtitle">Shown to customers after hair analysis — matches concern.</p>

      <button type="button" className="btn btn--gradient btn--small" disabled style={{ marginBottom: "1rem" }}>
        Add product
      </button>

      <div className="product-grid-tenant">
        {TENANT_PRODUCTS.map((p) => (
          <article key={p.id} className="surface-card product-card-tenant">
            <strong>{p.name}</strong>
            <p className="text-muted small">{p.match}</p>
            <p className="price-tag">{rupees(p.pricePaise)}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
