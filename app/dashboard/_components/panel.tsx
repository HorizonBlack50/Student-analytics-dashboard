import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** A dashboard panel: title bar, optional caption and actions, then content. */
export function Panel({ title, subtitle, actions, className = "", children }: Props) {
  const headingId = `panel-${slug(title)}`;
  return (
    <section aria-labelledby={headingId} className={`flex min-w-0 flex-col rounded-sm border border-gf-border bg-gf-panel ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-gf-border px-3 py-2">
        <div className="min-w-0">
          <h2 id={headingId} className="text-sm font-semibold text-gf-text">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gf-muted">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0 text-xs">{actions}</div>}
      </div>
      <div className="min-w-0 flex-1 p-3">{children}</div>
    </section>
  );
}
