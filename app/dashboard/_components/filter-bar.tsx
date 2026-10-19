"use client";

import { type FormEvent, useState } from "react";
import {
  AGE_BANDS,
  AGE_INPUT_MAX,
  AGE_INPUT_MIN,
  findBand,
  hasActiveFilters,
  MAX_SEARCH_LENGTH,
  PAGE_SIZES,
  type SortDir,
  type SortField,
  type StudentFilters,
  type TableOptions,
  toQueryString,
} from "@/lib/analytics/definitions";
import { useFilterNavigation } from "./use-filter-navigation";

const EMPTY_FILTERS: StudentFilters = { q: "", minAge: null, maxAge: null, group: null };

const SORT_LABELS: Record<SortField, string> = { id: "ID", name: "Name", email: "Email", age: "Age" };

type Draft = { q: string; minAge: string; maxAge: string };

function draftFrom(filters: StudentFilters): Draft {
  return { q: filters.q, minAge: filters.minAge?.toString() ?? "", maxAge: filters.maxAge?.toString() ?? "" };
}

function parseAgeInput(value: string): number | null | "invalid" {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= AGE_INPUT_MIN && n <= AGE_INPUT_MAX ? n : "invalid";
}

const inputClass =
  "rounded-sm border border-gf-border bg-gf-canvas px-2 py-1.5 text-sm text-gf-text placeholder:text-gf-muted/70 focus-visible:border-gf-blue focus-visible:outline-2 focus-visible:outline-gf-blue";
const labelClass = "text-xs font-medium text-gf-muted";

/**
 * Filters and table controls. Text and number inputs apply on Enter or "Apply";
 * dropdowns apply immediately. Every change becomes a new URL, which makes the
 * server re-run its queries.
 */
export function FilterBar({ filters, table }: { filters: StudentFilters; table?: TableOptions }) {
  const { navigate, isPending } = useFilterNavigation();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(filters));
  const [error, setError] = useState<string | null>(null);

  // When filters change from elsewhere (chart click, chip removal, back button),
  // reset the text inputs to match. This is React's "adjust state when a prop
  // changes" pattern, done during render instead of in an effect.
  // Compared by value, so pressing Refresh does not wipe text being typed.
  const filtersKey = toQueryString(filters);
  const [lastFiltersKey, setLastFiltersKey] = useState(filtersKey);
  if (lastFiltersKey !== filtersKey) {
    setLastFiltersKey(filtersKey);
    setDraft(draftFrom(filters));
    setError(null);
  }

  function apply(next: Partial<StudentFilters>, nextTable?: Partial<TableOptions>) {
    const minAge = parseAgeInput(draft.minAge);
    const maxAge = parseAgeInput(draft.maxAge);
    if (minAge === "invalid" || maxAge === "invalid") {
      setError(`Ages must be whole numbers from ${AGE_INPUT_MIN} to ${AGE_INPUT_MAX}.`);
      return;
    }
    if (minAge !== null && maxAge !== null && minAge > maxAge) {
      setError("Minimum age cannot be greater than maximum age.");
      return;
    }
    setError(null);
    navigate(
      { ...filters, q: draft.q.trim(), minAge, maxAge, ...next },
      table ? { ...table, page: 1, ...nextTable } : undefined,
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    apply({});
  }

  const chips: { label: string; clear: Partial<StudentFilters> }[] = [];
  if (filters.q) chips.push({ label: `Search: “${filters.q}”`, clear: { q: "" } });
  if (filters.minAge !== null) chips.push({ label: `Age ≥ ${filters.minAge}`, clear: { minAge: null } });
  if (filters.maxAge !== null) chips.push({ label: `Age ≤ ${filters.maxAge}`, clear: { maxAge: null } });
  if (filters.group) chips.push({ label: `Age group: ${findBand(filters.group)?.label}`, clear: { group: null } });

  return (
    <section aria-label="Filters" className="rounded-sm border border-gf-border bg-gf-panel p-3">
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="filter-q" className={labelClass}>Search name or email</label>
          <input
            id="filter-q"
            type="search"
            maxLength={MAX_SEARCH_LENGTH}
            placeholder="e.g. sharma or seed-0042"
            value={draft.q}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="flex w-24 flex-col gap-1">
          <label htmlFor="filter-min" className={labelClass}>Min age</label>
          <input
            id="filter-min"
            type="number"
            inputMode="numeric"
            min={AGE_INPUT_MIN}
            max={AGE_INPUT_MAX}
            value={draft.minAge}
            onChange={(e) => setDraft({ ...draft, minAge: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="flex w-24 flex-col gap-1">
          <label htmlFor="filter-max" className={labelClass}>Max age</label>
          <input
            id="filter-max"
            type="number"
            inputMode="numeric"
            min={AGE_INPUT_MIN}
            max={AGE_INPUT_MAX}
            value={draft.maxAge}
            onChange={(e) => setDraft({ ...draft, maxAge: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-group" className={labelClass}>Age group</label>
          <select
            id="filter-group"
            value={filters.group ?? ""}
            onChange={(e) => apply({ group: findBand(e.target.value)?.key ?? null })}
            className={inputClass}
          >
            <option value="">All age groups</option>
            {AGE_BANDS.map((b) => (
              <option key={b.key} value={b.key}>{b.label}</option>
            ))}
          </select>
        </div>

        {table && (
          <>
            <div className="flex flex-col gap-1">
              <label htmlFor="table-sort" className={labelClass}>Sort by</label>
              <select
                id="table-sort"
                value={table.sort}
                onChange={(e) => apply({}, { sort: e.target.value as SortField })}
                className={inputClass}
              >
                {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
                  <option key={field} value={field}>{SORT_LABELS[field]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="table-dir" className={labelClass}>Order</label>
              <select
                id="table-dir"
                value={table.dir}
                onChange={(e) => apply({}, { dir: e.target.value as SortDir })}
                className={inputClass}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="table-size" className={labelClass}>Rows per page</label>
              <select
                id="table-size"
                value={table.size}
                onChange={(e) => apply({}, { size: Number(e.target.value) })}
                className={inputClass}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-sm bg-gf-blue px-3 py-1.5 text-sm font-medium text-gf-canvas transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gf-blue"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => navigate(EMPTY_FILTERS, table ? { size: table.size } : undefined)}
            disabled={!hasActiveFilters(filters) && !(table && (table.sort !== "id" || table.dir !== "asc"))}
            className="rounded-sm border border-gf-border px-3 py-1.5 text-sm text-gf-text transition-colors hover:bg-gf-raised disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-gf-blue"
          >
            Reset filters
          </button>
        </div>
      </form>

      <div className="mt-2 flex min-h-6 flex-wrap items-center gap-2 text-xs">
        {error && (
          <p role="alert" className="text-gf-red">
            ⚠ {error}
          </p>
        )}
        {!error && chips.length === 0 && <span className="text-gf-muted">No filters applied: showing all students.</span>}
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => navigate({ ...filters, ...chip.clear }, table ? { ...table, page: 1 } : undefined)}
            className="rounded-sm border border-gf-blue/50 bg-gf-blue/10 px-2 py-0.5 text-gf-text hover:bg-gf-blue/20 focus-visible:outline-2 focus-visible:outline-gf-blue"
            aria-label={`Remove filter ${chip.label}`}
          >
            {chip.label} <span aria-hidden="true">×</span>
          </button>
        ))}
        <span aria-live="polite" className="ml-auto text-gf-muted">
          {isPending ? "Updating results…" : ""}
        </span>
      </div>
    </section>
  );
}
