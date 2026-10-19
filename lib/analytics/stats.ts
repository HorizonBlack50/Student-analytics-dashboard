// Pure statistics helpers. They work on a frequency table (age -> number of
// students) instead of individual rows, so the database only has to return one
// small row per distinct age rather than every student.
import { AGE_BANDS, type AgeBandKey, bandForAge } from "./definitions";

/** One row per distinct non-null age, sorted ascending. */
export type AgeFrequency = { age: number; count: number };

/**
 * Value at a 0-based position in the sorted list of ages that the frequency
 * table represents (as if every student's age were written out in order).
 */
function valueAt(freq: AgeFrequency[], position: number): number {
  let seen = 0;
  for (const { age, count } of freq) {
    seen += count;
    if (position < seen) return age;
  }
  throw new RangeError("position outside the data");
}

/**
 * Quantile using linear interpolation between closest ranks: the same method as
 * Excel's QUARTILE.INC / PERCENTILE.INC and NumPy's default. p = 0.5 gives the
 * median; with an even count it averages the two middle values.
 */
export function quantile(freq: AgeFrequency[], p: number): number | null {
  const n = freq.reduce((sum, f) => sum + f.count, 0);
  if (n === 0) return null;
  const h = (n - 1) * p;
  const lower = Math.floor(h);
  const lowerValue = valueAt(freq, lower);
  if (lower === h) return lowerValue;
  return lowerValue + (h - lower) * (valueAt(freq, lower + 1) - lowerValue);
}

export type AgeSummary = {
  n: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  /** Tukey fences: Q1 − 1.5×IQR and Q3 + 1.5×IQR. */
  lowerFence: number;
  upperFence: number;
  /** Whiskers end at the most extreme ages still inside the fences. */
  whiskerLow: number;
  whiskerHigh: number;
  outliers: AgeFrequency[];
};

export function summarizeAges(freq: AgeFrequency[]): AgeSummary | null {
  const n = freq.reduce((sum, f) => sum + f.count, 0);
  if (n === 0) return null;
  const q1 = quantile(freq, 0.25)!;
  const median = quantile(freq, 0.5)!;
  const q3 = quantile(freq, 0.75)!;
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const inside = freq.filter((f) => f.age >= lowerFence && f.age <= upperFence);
  return {
    n,
    min: freq[0].age,
    q1,
    median,
    q3,
    max: freq[freq.length - 1].age,
    iqr,
    lowerFence,
    upperFence,
    whiskerLow: inside.length ? inside[0].age : median,
    whiskerHigh: inside.length ? inside[inside.length - 1].age : median,
    outliers: freq.filter((f) => f.age < lowerFence || f.age > upperFence),
  };
}

export type BandCount = { key: AgeBandKey; label: string; rule: string; count: number };

/** Counts per age band. Every student lands in exactly one band. */
export function countByBand(freq: AgeFrequency[], unknownCount: number): BandCount[] {
  const counts = new Map<AgeBandKey, number>(AGE_BANDS.map((b) => [b.key, 0]));
  for (const { age, count } of freq) {
    const key = bandForAge(age).key;
    counts.set(key, counts.get(key)! + count);
  }
  counts.set("unknown", unknownCount);
  return AGE_BANDS.map((b) => ({ key: b.key, label: b.label, rule: b.rule, count: counts.get(b.key)! }));
}

export type CumulativePoint = { age: number; count: number; atOrBelow: number; cumulativePct: number };

/** Share of students with a known age who are at or below each observed age. */
export function cumulativeShare(freq: AgeFrequency[]): CumulativePoint[] {
  const n = freq.reduce((sum, f) => sum + f.count, 0);
  let running = 0;
  return freq.map(({ age, count }) => {
    running += count;
    return { age, count, atOrBelow: running, cumulativePct: n === 0 ? 0 : (running / n) * 100 };
  });
}
