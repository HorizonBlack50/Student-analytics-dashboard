import type { Metadata } from "next";
import { Suspense } from "react";
import { parseFilters } from "@/lib/analytics/definitions";
import { formatAge, formatCount } from "@/lib/analytics/format";
import type { AgeSummary } from "@/lib/analytics/stats";
import { getOverview } from "@/lib/analytics/queries";
import { AgeBoxPlot, AgeGroupComparisonChart, CumulativeAgeChart } from "../_components/charts";
import { FilterBar } from "../_components/filter-bar";
import { KpiRow } from "../_components/kpi-row";
import { PageHeader } from "../_components/page-header";
import { Panel } from "../_components/panel";
import { DashboardSkeleton, EmptyState } from "../_components/states";

export const metadata: Metadata = { title: "Student Analytics" };

export default function AnalyticsPage({ searchParams }: PageProps<"/dashboard/analytics">) {
  return (
    <Suspense fallback={<DashboardSkeleton panels={4} />}>
      <Analytics searchParams={searchParams} />
    </Suspense>
  );
}

function SummaryTable({ summary, missing }: { summary: AgeSummary; missing: number }) {
  const rows: [string, string, string][] = [
    ["n (known ages)", formatCount(summary.n), `${formatCount(missing)} unknown excluded`],
    ["Minimum", formatAge(summary.min), "Smallest observed age"],
    ["Q1 (25th percentile)", formatAge(summary.q1), "A quarter of known ages are at or below"],
    ["Median (50th)", formatAge(summary.median), "Half are at or below"],
    ["Q3 (75th percentile)", formatAge(summary.q3), "Three quarters are at or below"],
    ["Maximum", formatAge(summary.max), "Largest observed age"],
    ["IQR (Q3 − Q1)", formatAge(summary.iqr), "Spread of the middle 50%"],
    ["Whiskers", `${formatAge(summary.whiskerLow)} – ${formatAge(summary.whiskerHigh)}`, "Most extreme ages within 1.5 × IQR"],
    [
      "Outliers",
      summary.outliers.length ? summary.outliers.map((o) => `${o.age}${o.count > 1 ? ` (×${o.count})` : ""}`).join(", ") : "None",
      `Outside ${formatAge(summary.lowerFence)} – ${formatAge(summary.upperFence)}`,
    ],
  ];
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Age summary statistics</caption>
      <tbody>
        {rows.map(([label, value, note]) => (
          <tr key={label} className="border-b border-gf-border/60 last:border-0">
            <th scope="row" className="py-1.5 pr-3 text-left text-xs font-medium text-gf-muted">{label}</th>
            <td className="py-1.5 pr-3 text-right font-mono tabular-nums text-gf-text">{value}</td>
            <td className="hidden py-1.5 text-xs text-gf-muted sm:table-cell">{note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

async function Analytics({ searchParams }: Pick<PageProps<"/dashboard/analytics">, "searchParams">) {
  const filters = parseFilters(await searchParams);
  const data = await getOverview(filters);

  return (
    <>
      <PageHeader
        title="Student Analytics"
        description="Shape and spread of student ages: quartiles, outliers, group comparison and cumulative distribution."
        snapshot={data}
        tableTotal={data.tableTotal}
        matching={data.matching}
      />
      <FilterBar filters={filters} />
      <KpiRow data={data} />

      {data.matching === 0 ? (
        <EmptyState resetHref="/dashboard/analytics" />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Panel
            title="Age box plot"
            subtitle="Box = Q1 to Q3, line = median, whiskers = 1.5 × IQR (Tukey). Amber points are outlier ages. Unknown ages are excluded."
            className="xl:col-span-7"
          >
            <AgeBoxPlot summary={data.summary} />
          </Panel>
          <Panel title="Summary statistics" subtitle="Quartiles use linear interpolation (Excel QUARTILE.INC)" className="xl:col-span-5">
            {data.summary ? (
              <SummaryTable summary={data.summary} missing={data.missingAge} />
            ) : (
              <p className="text-sm text-gf-muted">No known ages among the matching students.</p>
            )}
          </Panel>
          <Panel
            title="Age group comparison"
            subtitle="Count and share of matching students per group (shares sum to 100%). Click a bar to filter."
            className="xl:col-span-6"
          >
            <AgeGroupComparisonChart bands={data.bands} matching={data.matching} filters={filters} />
          </Panel>
          <Panel
            title="Cumulative age distribution"
            subtitle="Share of students with a known age who are at or below each age. Dashed line marks 50% (the median)."
            className="xl:col-span-6"
          >
            <CumulativeAgeChart points={data.cumulative} known={data.knownAge} />
          </Panel>
        </div>
      )}
    </>
  );
}
