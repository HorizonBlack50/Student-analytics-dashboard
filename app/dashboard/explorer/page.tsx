import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  parseFilters,
  parseTableOptions,
  type StudentFilters,
  type TableOptions,
  toQueryString,
} from "@/lib/analytics/definitions";
import { formatCount } from "@/lib/analytics/format";
import { getStudentPage } from "@/lib/analytics/queries";
import { FilterBar } from "../_components/filter-bar";
import { PageHeader } from "../_components/page-header";
import { Panel } from "../_components/panel";
import { DashboardSkeleton, EmptyState } from "../_components/states";
import { StudentTable } from "../_components/student-table";

export const metadata: Metadata = { title: "Student Explorer" };

const BASE_PATH = "/dashboard/explorer";

export default function ExplorerPage({ searchParams }: PageProps<"/dashboard/explorer">) {
  return (
    <Suspense fallback={<DashboardSkeleton panels={1} />}>
      <Explorer searchParams={searchParams} />
    </Suspense>
  );
}

function Pagination({ filters, table, page, totalPages }: { filters: StudentFilters; table: TableOptions; page: number; totalPages: number }) {
  const href = (p: number) => `${BASE_PATH}${toQueryString(filters, { ...table, page: p })}`;
  const linkClass =
    "rounded-sm border border-gf-border px-2.5 py-1 text-sm text-gf-text hover:bg-gf-raised focus-visible:outline-2 focus-visible:outline-gf-blue";
  const disabledClass = "rounded-sm border border-gf-border/50 px-2.5 py-1 text-sm text-gf-muted/50";
  const items = [
    { label: "« First", target: 1, enabled: page > 1 },
    { label: "‹ Previous", target: page - 1, enabled: page > 1 },
    { label: "Next ›", target: page + 1, enabled: page < totalPages },
    { label: "Last »", target: totalPages, enabled: page < totalPages },
  ];
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
      {items.slice(0, 2).map((item) =>
        item.enabled ? (
          <Link key={item.label} href={href(item.target)} scroll={false} className={linkClass}>{item.label}</Link>
        ) : (
          <span key={item.label} aria-disabled="true" className={disabledClass}>{item.label}</span>
        ),
      )}
      <span className="px-2 text-sm text-gf-muted" aria-current="page">
        Page <span className="font-mono text-gf-text">{page}</span> of <span className="font-mono text-gf-text">{totalPages}</span>
      </span>
      {items.slice(2).map((item) =>
        item.enabled ? (
          <Link key={item.label} href={href(item.target)} scroll={false} className={linkClass}>{item.label}</Link>
        ) : (
          <span key={item.label} aria-disabled="true" className={disabledClass}>{item.label}</span>
        ),
      )}
    </nav>
  );
}

async function Explorer({ searchParams }: Pick<PageProps<"/dashboard/explorer">, "searchParams">) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const requested = parseTableOptions(params);
  const data = await getStudentPage(filters, requested);
  // The query clamps out-of-range page numbers; use the page actually shown.
  const table = { ...requested, page: data.page };
  const from = data.matching === 0 ? 0 : (data.page - 1) * table.size + 1;
  const to = Math.min(data.page * table.size, data.matching);

  return (
    <>
      <PageHeader
        title="Student Explorer"
        description="Search, filter, sort and page through student records. Filtering, sorting and paging run in MySQL; only the visible page is sent to your browser."
        snapshot={data}
        tableTotal={data.tableTotal}
        matching={data.matching}
      />
      <FilterBar filters={filters} table={table} />
      {data.matching === 0 ? (
        <EmptyState resetHref={BASE_PATH} />
      ) : (
        <Panel
          title="Students"
          subtitle={
            <span aria-live="polite">
              Showing <span className="font-mono text-gf-text">{formatCount(from)}–{formatCount(to)}</span> of{" "}
              <span className="font-mono text-gf-text">{formatCount(data.matching)}</span> matching records. Unknown ages
              always sort last.
            </span>
          }
        >
          <StudentTable
            rows={data.rows}
            caption={`Student records, sorted by ${table.sort} ${table.dir === "asc" ? "ascending" : "descending"}`}
            sorting={{ filters, table, basePath: BASE_PATH }}
          />
          <div className="mt-3 border-t border-gf-border pt-3">
            <Pagination filters={filters} table={table} page={data.page} totalPages={data.totalPages} />
          </div>
        </Panel>
      )}
    </>
  );
}
