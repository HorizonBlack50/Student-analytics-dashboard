// Consistent number formatting for the dashboard. A fixed locale keeps the
// server-rendered HTML identical to what the browser would produce.
const countFormat = new Intl.NumberFormat("en-US");
const ageFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export const EMPTY_VALUE = "—";

export function formatCount(n: number): string {
  return countFormat.format(n);
}

/** Ages are shown with at most one decimal place (e.g. 24.4, 23.5, 22). */
export function formatAge(n: number | null): string {
  return n === null ? EMPTY_VALUE : ageFormat.format(n);
}

/** part / total × 100, or null when the denominator is zero. */
export function percentOf(part: number, total: number): number | null {
  return total === 0 ? null : (part / total) * 100;
}

/** Percentages are always shown with one decimal place. */
export function formatPercent(value: number | null): string {
  return value === null ? EMPTY_VALUE : `${value.toFixed(1)}%`;
}
