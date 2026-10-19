import Link from "next/link";

/** Shown when the filters match no students. */
export function EmptyState({ resetHref, message = "No students match the current filters." }: { resetHref: string; message?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-sm border border-dashed border-gf-border bg-gf-panel px-4 py-10 text-center">
      <p className="text-sm font-medium text-gf-text">{message}</p>
      <p className="max-w-md text-xs text-gf-muted">
        This is an empty result, not missing data: the database returned zero matching rows. Try widening the age
        range or clearing the search.
      </p>
      <Link href={resetHref} className="mt-1 text-sm text-gf-blue hover:underline">
        Clear all filters
      </Link>
    </div>
  );
}

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-sm border border-gf-border bg-gf-panel ${className}`} />;
}

/** Loading placeholder shown while the server queries MySQL. */
export function DashboardSkeleton({ panels = 3 }: { panels?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading dashboard data">
      <Block className="h-16" />
      <Block className="h-24" />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => <Block key={i} className="h-24" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: panels }, (_, i) => <Block key={i} className="h-72" />)}
      </div>
      <p className="sr-only">Loading data from the database…</p>
    </div>
  );
}
