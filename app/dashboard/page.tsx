import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { parseFilters, toQueryString } from "@/lib/analytics/definitions";
import { formatCount } from "@/lib/analytics/format";
import { getOverview } from "@/lib/analytics/queries";
import { AgeBandChart, AgeCountChart, CompletenessChart } from "./_components/charts";
import { FilterBar } from "./_components/filter-bar";
import { KpiRow } from "./_components/kpi-row";
import { PageHeader } from "./_components/page-header";
import { Panel } from "./_components/panel";
import { DashboardSkeleton, EmptyState } from "./_components/states";
import { StudentTable } from "./_components/student-table";

export const metadata: Metadata = { title: "Overview" };

const PREVIEW_ROWS = 8;

// The page shell renders immediately; the data part waits for MySQL inside
// Suspense (required for uncached data when Cache Components is enabled).
export default function OverviewPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

async function Overview({ searchParams }: Pick<PageProps<"/dashboard">, "searchParams">) {
  const filters = parseFilters(await searchParams);
  const data = await getOverview(filters, PREVIEW_ROWS);
  const explorerHref = `/dashboard/explorer${toQueryString(filters)}`;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Headline metrics and distributions for the Student table. Every number is computed from MySQL for the records matching your filters."
        snapshot={data}
        tableTotal={data.tableTotal}
        matching={data.matching}
      />
      <FilterBar filters={filters} />
      <KpiRow data={data} />

      {data.matching === 0 ? (
        <EmptyState resetHref="/dashboard" />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Panel
            title="Students by age band"
            subtitle="Every matching student is counted exactly once, including unknown ages. Click a bar to filter by that band."
            className="xl:col-span-8"
          >
            <AgeBandChart bands={data.bands} matching={data.matching} filters={filters} />
          </Panel>
          <Panel
            title="Age data completeness"
            subtitle={`${formatCount(data.matching)} matching records examined`}
            className="xl:col-span-4"
          >
            <CompletenessChart known={data.knownAge} missing={data.missingAge} />
            <p className="mt-2 text-xs text-gf-muted">
              Missing means the age is NULL (never recorded). It is not the same as an age of 0.{" "}
              <Link href="/dashboard/data-quality" className="text-gf-blue hover:underline">
                Data quality checks →
              </Link>
            </p>
          </Panel>
          <Panel
            title="Students by individual age"
            subtitle={`Known ages only (${formatCount(data.missingAge)} unknown not shown). Amber bars are outside the expected review range. Click a bar to filter to that age.`}
            className="xl:col-span-12"
          >
            <AgeCountChart frequency={data.frequency} missing={data.missingAge} filters={filters} />
          </Panel>
          <Panel
            title="Student records"
            subtitle={`First ${Math.min(PREVIEW_ROWS, data.matching)} of ${formatCount(data.matching)} matching records, by ID`}
            actions={
              <Link href={explorerHref} className="text-gf-blue hover:underline">
                Open in Student Explorer →
              </Link>
            }
            className="xl:col-span-12"
          >
            <StudentTable rows={data.preview} caption="Preview of matching student records" />
          </Panel>
        </div>
      )}
    </>
  );
}
