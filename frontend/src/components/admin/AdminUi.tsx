import type { ReactNode } from "react";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "gold" | "teal" | "rose" | "slate";
  index?: number;
};

export function AdminStatCard({ label, value, hint, tone = "gold", index = 0 }: AdminStatCardProps) {
  return (
    <article
      className={`sa-stat sa-stat--${tone}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <span className="sa-stat__label">{label}</span>
      <strong className="sa-stat__value">{value}</strong>
      {hint ? <span className="sa-stat__hint">{hint}</span> : null}
    </article>
  );
}

type AdminPanelProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminPanel({ title, subtitle, actions, children, className = "" }: AdminPanelProps) {
  return (
    <section className={`sa-panel ${className}`.trim()}>
      <div className="sa-panel__head">
        <div>
          <h2 className="sa-panel__title">{title}</h2>
          {subtitle ? <p className="sa-panel__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="sa-panel__actions">{actions}</div> : null}
      </div>
      <div className="sa-panel__body">{children}</div>
    </section>
  );
}

type AdminFormGridProps = {
  children: ReactNode;
  columns?: 2 | 3;
};

export function AdminFormGrid({ children, columns = 2 }: AdminFormGridProps) {
  return <div className={`sa-form-grid sa-form-grid--${columns}`}>{children}</div>;
}

type AdminFieldProps = {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
  full?: boolean;
};

export function AdminField({ id, label, hint, children, full }: AdminFieldProps) {
  return (
    <div className={`sa-field${full ? " sa-field--full" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <p className="sa-field__hint">{hint}</p> : null}
    </div>
  );
}

type AdminStatusBadgeProps = {
  status: string;
};

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  const s = status.toLowerCase();
  const tone =
    s.includes("active") || s.includes("settled") || s.includes("ok")
      ? "ok"
      : s.includes("pending") || s.includes("trial")
        ? "warn"
        : s.includes("suspend") || s.includes("cancel") || s.includes("fail")
          ? "bad"
          : "neutral";
  return <span className={`sa-badge sa-badge--${tone}`}>{status}</span>;
}

type AdminEmptyStateProps = {
  title: string;
  text?: string;
};

export function AdminEmptyState({ title, text }: AdminEmptyStateProps) {
  return (
    <div className="sa-empty">
      <strong>{title}</strong>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

type AdminAlertProps = {
  tone?: "error" | "info" | "success";
  children: ReactNode;
};

export function AdminAlert({ tone = "error", children }: AdminAlertProps) {
  return <div className={`sa-alert sa-alert--${tone}`} role="alert">{children}</div>;
}
