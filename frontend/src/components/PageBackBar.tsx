import { Link } from "react-router-dom";
import { IconChevronLeft } from "./CustomerIcons";

export type PageBackBarProps = {
  /** Where “Back” goes (explicit route — reliable in SPAs). */
  to: string;
  replace?: boolean;
  label?: string;
  className?: string;
  /** Use beside a centered title (e.g. appointment header). */
  variant?: "block" | "inline";
};

/**
 * Consistent top back control for inner screens (mobile-app style).
 * Prefer explicit `to` over history(-1) so deep links and refreshes always recover.
 */
export function PageBackBar({ to, replace, label = "Back", className = "", variant = "block" }: PageBackBarProps) {
  return (
    <div className={`page-back-bar page-back-bar--${variant} ${className}`.trim()}>
      <Link to={to} replace={replace} className="page-back-bar__link">
        <IconChevronLeft width={22} height={22} aria-hidden />
        <span>{label}</span>
      </Link>
    </div>
  );
}
