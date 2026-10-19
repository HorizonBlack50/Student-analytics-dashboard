import Link from "next/link";
import {
  EXPECTED_AGE_RANGE,
  isUnexpectedAge,
  type SortField,
  type StudentFilters,
  type TableOptions,
  toQueryString,
} from "@/lib/analytics/definitions";
import type { StudentRow } from "@/lib/analytics/queries";

const COLUMNS: { field: SortField; label: string; align: "left" | "right" }[] = [
  { field: "id", label: "ID", align: "right" },
  { field: "name", label: "Name", align: "left" },
  { field: "email", label: "Email", align: "left" },
  { field: "age", label: "Age", align: "right" },
];

type Sorting = { filters: StudentFilters; table: TableOptions; basePath: string };

function AgeCell({ age }: { age: number | null }) {
  if (age === null) {
    return (
      <span className="rounded-sm border border-dashed border-gf-grey px-1.5 py-0.5 text-xs italic text-gf-muted">
        Unknown
      </span>
    );
  }
  if (isUnexpectedAge(age)) {
    return (
      <span className="font-mono text-gf-amber" title={`Outside expected range ${EXPECTED_AGE_RANGE.min}–${EXPECTED_AGE_RANGE.max}`}>
        <span aria-hidden="true">⚠ </span>
        {age}
        <span className="sr-only"> (outside expected range)</span>
      </span>
    );
  }
  return <span className="font-mono">{age}</span>;
}

/** Read-only student table. With `sorting`, column headers become sort links. */
export function StudentTable({ rows, caption, sorting }: { rows: StudentRow[]; caption: string; sorting?: Sorting }) {
  return (
    // `relative` keeps the absolutely positioned sr-only labels inside this
    // scroll box, so a wide table scrolls here instead of widening the page.
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-gf-border text-xs text-gf-muted">
            {COLUMNS.map((col) => {
              const active = sorting?.table.sort === col.field;
              const dir = active ? sorting!.table.dir : undefined;
              const nextDir = active && dir === "asc" ? "desc" : "asc";
              return (
                <th
                  key={col.field}
                  scope="col"
                  aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : sorting ? "none" : undefined}
                  className={`px-3 py-2 font-medium ${col.align === "right" ? "text-right" : "text-left"}`}
                >
                  {sorting ? (
                    <Link
                      href={`${sorting.basePath}${toQueryString(sorting.filters, { ...sorting.table, sort: col.field, dir: nextDir, page: 1 })}`}
                      scroll={false}
                      className={`inline-flex items-center gap-1 hover:text-gf-text focus-visible:outline-2 focus-visible:outline-gf-blue ${active ? "text-gf-text" : ""}`}
                    >
                      {col.label}
                      <span aria-hidden="true" className={active ? "text-gf-blue" : "opacity-40"}>
                        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                      <span className="sr-only">, sort {nextDir === "asc" ? "ascending" : "descending"}</span>
                    </Link>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-gf-border/60 last:border-0 hover:bg-gf-raised/60">
              <td className="px-3 py-1.5 text-right font-mono text-gf-muted tabular-nums">{row.id}</td>
              <td className="px-3 py-1.5 text-gf-text">{row.name}</td>
              <td className="px-3 py-1.5 font-mono text-xs text-gf-muted">{row.email}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">
                <AgeCell age={row.age} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
