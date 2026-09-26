import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

/** Shared page header for every Super Admin screen. */
export function AdminPageHeader({ eyebrow = "Platform console", title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <header className="sa-page-header">
      <div className="sa-page-header__text">
        <p className="sa-page-header__eyebrow">{eyebrow}</p>
        <h1 className="sa-page-header__title">{title}</h1>
        {subtitle ? <p className="sa-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="sa-page-header__actions">{actions}</div> : null}
    </header>
  );
}
