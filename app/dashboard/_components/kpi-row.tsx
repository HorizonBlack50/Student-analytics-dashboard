import Link from "next/link";
import { EMPTY_VALUE, formatAge, formatCount, formatPercent, percentOf } from "@/lib/analytics/format";
import type { OverviewData } from "@/lib/analytics/queries";

type Kpi = {
  label: string;
  value: string;
  unit?: string;
  caption: string;
  /** Optional 0–100 meter, always shown next to its number (never colour alone). */
  meter?: { pct: number; color: string };
};

export function KpiRow({ data }: { data: OverviewData }) {
  const { matching, knownAge, missingAge, summary } = data;
  const noRecords = matching === 0;
  const noAges = knownAge === 0;
  const missingRate = percentOf(missingAge, matching);
  const completeness = percentOf(knownAge, matching);
  const noAgeCaption = noRecords ? "No matching records" : "No known ages in matching records";

  const kpis: Kpi[] = [
    {
      label: "Students",
      value: formatCount(matching),
      caption: `Records matching filters · ${formatCount(data.tableTotal)} in table`,
    },
    {
      label: "Average age",
      value: formatAge(data.avgAge),
      unit: noAges ? undefined : "years",
      caption: noAges ? noAgeCaption : `Mean of ${formatCount(knownAge)} known ages`,
    },
    {
      label: "Median age",
      value: formatAge(summary?.median ?? null),
      unit: noAges ? undefined : "years",
      caption: noAges ? noAgeCaption : "Middle known age (avg of two middles if even)",
    },
    {
      label: "Age range",
      value: noAges ? EMPTY_VALUE : `${data.minAge}–${data.maxAge}`,
      unit: noAges ? undefined : "years",
      caption: noAges ? noAgeCaption : "Observed minimum – maximum",
    },
    {
      label: "Missing age rate",
      value: formatPercent(missingRate),
      caption: noRecords ? "No matching records" : `${formatCount(missingAge)} of ${formatCount(matching)} records have no age`,
      meter: missingRate === null ? undefined : { pct: missingRate, color: "bg-gf-amber" },
    },
    {
      label: "Age completeness",
      value: formatPercent(completeness),
      caption: noRecords ? "No matching records" : `${formatCount(knownAge)} of ${formatCount(matching)} records have an age`,
      meter: completeness === null ? undefined : { pct: completeness, color: "bg-gf-green" },
    },
  ];

  return (
    <section aria-labelledby="kpi-heading">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 id="kpi-heading" className="text-xs font-semibold uppercase tracking-wider text-gf-muted">
          Key metrics <span className="font-normal normal-case tracking-normal">· computed from matching records</span>
        </h2>
        <Link href="/dashboard/about#metrics" className="text-xs text-gf-blue hover:underline">
          Metric definitions
        </Link>
      </div>
      <dl className="grid grid-cols-2 gap-2 md:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-1 rounded-sm border border-gf-border bg-gf-panel px-3 py-2.5">
            <dt className="text-xs font-medium text-gf-muted">{kpi.label}</dt>
            <dd className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-semibold tabular-nums text-gf-text">{kpi.value}</span>
              {kpi.unit && <span className="text-xs text-gf-muted">{kpi.unit}</span>}
            </dd>
            {kpi.meter && (
              <dd aria-hidden="true" className="h-1 w-full overflow-hidden rounded-full bg-gf-raised">
                <div className={`h-full ${kpi.meter.color}`} style={{ width: `${kpi.meter.pct}%` }} />
              </dd>
            )}
            <dd className="text-[11px] leading-4 text-gf-muted">{kpi.caption}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
