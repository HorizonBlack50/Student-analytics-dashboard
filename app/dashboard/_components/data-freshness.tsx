"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition } from "react";

// A clock that ticks every 10 seconds. On the server it returns null, so the
// "x ago" text only appears in the browser and never causes a hydration mismatch.
function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 10_000);
  return () => clearInterval(id);
}
const getNow = () => Math.floor(Date.now() / 10_000) * 10_000;
const getServerNow = () => null;

function timeAgo(fromIso: string, now: number) {
  const seconds = Math.max(0, Math.round((now - Date.parse(fromIso)) / 1000));
  if (seconds < 60) return "less than a minute ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min ago`;
}

/**
 * Shows when the numbers on screen were read from MySQL. The data is a
 * snapshot: it only changes when the page loads, a filter changes, or Refresh
 * is pressed. Refresh re-runs the server queries (nothing is cached).
 */
export function DataFreshness({ fetchedAt, fetchedLabel }: { fetchedAt: string; fetchedLabel: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const now = useSyncExternalStore(subscribe, getNow, getServerNow);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-xs leading-5 text-gf-muted">
        <span className="font-medium text-gf-text">Snapshot</span> (not live) fetched{" "}
        <time dateTime={fetchedAt} className="font-mono text-gf-text">
          {fetchedLabel}
        </time>
        {now !== null && <span> · {timeAgo(fetchedAt, now)}</span>}
      </p>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={isPending}
        className="rounded-sm border border-gf-border bg-gf-raised px-3 py-1.5 text-sm font-medium text-gf-text transition-colors hover:border-gf-blue disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-gf-blue"
      >
        {isPending ? "Refreshing…" : "↻ Refresh data"}
      </button>
      <span aria-live="polite" className="sr-only">
        {isPending ? "Refreshing data from the database" : ""}
      </span>
    </div>
  );
}
