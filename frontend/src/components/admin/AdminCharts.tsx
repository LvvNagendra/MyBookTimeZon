export type AdminChartPoint = {
  key?: string;
  label: string;
  value: number;
};

type AdminBarChartProps = {
  points: AdminChartPoint[];
  /** Max height of the tallest bar */
  height?: number;
  unitSuffix?: string;
  accent?: "gold" | "teal" | "rose";
};

/** Lightweight CSS bar chart — no chart library required. */
export function AdminBarChart({ points, height = 160, unitSuffix = "", accent = "gold" }: AdminBarChartProps) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className={`sa-chart sa-chart--${accent}`} style={{ ["--sa-chart-h" as string]: `${height}px` }}>
      <div className="sa-chart__bars" role="img" aria-label="Bar chart">
        {points.map((p, i) => {
          const pct = Math.round((p.value / max) * 100);
          return (
            <div key={p.key ?? p.label} className="sa-chart__col" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="sa-chart__value">
                {p.value}
                {unitSuffix}
              </span>
              <div className="sa-chart__track">
                <div className="sa-chart__bar" style={{ height: `${pct}%` }} />
              </div>
              <span className="sa-chart__label">{p.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type AdminDonutProps = {
  points: AdminChartPoint[];
  centerLabel?: string;
  centerValue?: string | number;
};

/** SVG donut from simple labelled counts. */
export function AdminDonut({ points, centerLabel, centerValue }: AdminDonutProps) {
  const total = points.reduce((s, p) => s + p.value, 0) || 1;
  const colors = ["#C9A227", "#1A3A4A", "#C45C6A", "#5B8A72", "#6B7280", "#8B6B4A"];
  let offset = 0;
  const radius = 42;
  const circ = 2 * Math.PI * radius;

  return (
    <div className="sa-donut">
      <div className="sa-donut__visual">
        <svg viewBox="0 0 120 120" className="sa-donut__svg" aria-hidden>
          <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--border)" strokeWidth="14" />
          {points.map((p, i) => {
            const len = (p.value / total) * circ;
            const dash = `${len} ${circ - len}`;
            const el = (
              <circle
                key={p.key ?? p.label}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth="14"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 60 60)"
                className="sa-donut__seg"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="sa-donut__center">
          {centerValue != null ? <strong>{centerValue}</strong> : null}
          {centerLabel ? <span>{centerLabel}</span> : null}
        </div>
      </div>
      <ul className="sa-donut__legend">
        {points.map((p, i) => (
          <li key={p.key ?? p.label}>
            <i style={{ background: colors[i % colors.length] }} aria-hidden />
            <span>
              {p.label} <em>{p.value}</em>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
