// Shared definitions for the student dashboard. Safe to import from both
// Server and Client Components: no database access happens here.

export type AgeBandKey = "under-18" | "18-20" | "21-23" | "24-26" | "27-30" | "over-30" | "unknown";

export type AgeBand = {
  key: AgeBandKey;
  label: string;
  /** Inclusive lower bound; null means "no lower bound". */
  min: number | null;
  /** Inclusive upper bound; null means "no upper bound". */
  max: number | null;
  rule: string;
};

// `age` is an INT column, so these bands are mutually exclusive and together
// cover every possible row exactly once (including NULL ages).
export const AGE_BANDS: AgeBand[] = [
  { key: "under-18", label: "Under 18", min: null, max: 17, rule: "age ≤ 17" },
  { key: "18-20", label: "18–20", min: 18, max: 20, rule: "18 ≤ age ≤ 20" },
  { key: "21-23", label: "21–23", min: 21, max: 23, rule: "21 ≤ age ≤ 23" },
  { key: "24-26", label: "24–26", min: 24, max: 26, rule: "24 ≤ age ≤ 26" },
  { key: "27-30", label: "27–30", min: 27, max: 30, rule: "27 ≤ age ≤ 30" },
  { key: "over-30", label: "Over 30", min: 31, max: null, rule: "age ≥ 31" },
  { key: "unknown", label: "Unknown age", min: null, max: null, rule: "age is NULL" },
];

/** Heuristic review range: ages outside it are flagged for review, never removed. */
export const EXPECTED_AGE_RANGE = { min: 15, max: 65 } as const;

export function isUnexpectedAge(age: number | null): boolean {
  return age !== null && (age < EXPECTED_AGE_RANGE.min || age > EXPECTED_AGE_RANGE.max);
}

export function bandForAge(age: number | null): AgeBand {
  if (age === null) return AGE_BANDS[AGE_BANDS.length - 1];
  const band = AGE_BANDS.find(
    (b) => b.key !== "unknown" && (b.min === null || age >= b.min) && (b.max === null || age <= b.max),
  );
  if (!band) throw new Error(`No age band for age ${age}`);
  return band;
}

export function findBand(key: string | null | undefined): AgeBand | null {
  return AGE_BANDS.find((b) => b.key === key) ?? null;
}

// ---------------------------------------------------------------------------
// Filters and table options live in the URL (?q=…&minAge=…), so every view is
// shareable and the server can read them before querying the database.

export type StudentFilters = {
  q: string;
  minAge: number | null;
  maxAge: number | null;
  group: AgeBandKey | null;
};

export const SORT_FIELDS = ["id", "name", "email", "age"] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortDir = "asc" | "desc";

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export type TableOptions = {
  sort: SortField;
  dir: SortDir;
  page: number;
  size: number;
};

export const FILTER_KEYS = ["q", "minAge", "maxAge", "group"] as const;
export const TABLE_KEYS = ["sort", "dir", "page", "size"] as const;

export const MAX_SEARCH_LENGTH = 100;
export const AGE_INPUT_MIN = 0;
export const AGE_INPUT_MAX = 150;

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseAge(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= AGE_INPUT_MIN && n <= AGE_INPUT_MAX ? n : null;
}

export function parseFilters(params: RawSearchParams): StudentFilters {
  return {
    q: (first(params.q) ?? "").trim().slice(0, MAX_SEARCH_LENGTH),
    minAge: parseAge(first(params.minAge)),
    maxAge: parseAge(first(params.maxAge)),
    group: findBand(first(params.group))?.key ?? null,
  };
}

export function parseTableOptions(params: RawSearchParams): TableOptions {
  const sort = first(params.sort);
  const size = Number(first(params.size));
  const page = Number(first(params.page));
  return {
    sort: SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "id",
    dir: first(params.dir) === "desc" ? "desc" : "asc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    size: PAGE_SIZES.includes(size as (typeof PAGE_SIZES)[number]) ? size : 25,
  };
}

export function hasActiveFilters(filters: StudentFilters): boolean {
  return filters.q !== "" || filters.minAge !== null || filters.maxAge !== null || filters.group !== null;
}

/** Serialise filters (and optionally table options) back into a query string. */
export function toQueryString(
  filters: StudentFilters,
  table?: Partial<TableOptions>,
): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.minAge !== null) params.set("minAge", String(filters.minAge));
  if (filters.maxAge !== null) params.set("maxAge", String(filters.maxAge));
  if (filters.group) params.set("group", filters.group);
  if (table?.sort && table.sort !== "id") params.set("sort", table.sort);
  if (table?.dir === "desc") params.set("dir", "desc");
  if (table?.size && table.size !== 25) params.set("size", String(table.size));
  if (table?.page && table.page > 1) params.set("page", String(table.page));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
