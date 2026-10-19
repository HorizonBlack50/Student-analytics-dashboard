import type { Metadata } from "next";
import { Suspense } from "react";
import { formatCount, formatPercent, percentOf } from "@/lib/analytics/format";
import { type QualityCheck, getDataQuality } from "@/lib/analytics/queries";
import { CompletenessChart, QualityChecksChart } from "../_components/charts";
import { PageHeader } from "../_components/page-header";
import { Panel } from "../_components/panel";
import { DashboardSkeleton } from "../_components/states";
import { StudentTable } from "../_components/student-table";

export const metadata: Metadata = { title: "Data Quality" };

export default function DataQualityPage() {
  return (
    <Suspense fallback={<DashboardSkeleton panels={2} />}>
      <DataQuality />
    </Suspense>
  );
}

const SEVERITY_STYLE: Record<QualityCheck["severity"], { label: string; className: string }> = {
  info: { label: "Info", className: "border-gf-blue/60 text-gf-blue" },
  warning: { label: "Warning", className: "border-gf-amber/60 text-gf-amber" },
  error: { label: "Error", className: "border-gf-red/60 text-gf-red" },
};

function CheckStatus({ check }: { check: QualityCheck }) {
  if (check.count === 0) {
    return <span className="rounded-sm border border-gf-green/60 px-1.5 py-0.5 text-xs text-gf-green">✓ Pass · no rows</span>;
  }
  const s = SEVERITY_STYLE[check.severity];
  return (
    <span className={`rounded-sm border px-1.5 py-0.5 text-xs ${s.className}`}>
      {check.severity === "info" ? "ℹ" : "⚠"} {s.label} · {formatCount(check.count)} {check.count === 1 ? "row" : "rows"}
    </span>
  );
}

async function DataQuality() {
  const report = await getDataQuality();
  const flagged = report.checks.filter((c) => c.count > 0);

  return (
    <>
      <PageHeader
        title="Data Quality"
        description="Audits the entire Student table. Dashboard filters do not apply here. Flagged rows are only reported: nothing is changed or excluded."
        snapshot={report}
        tableTotal={report.total}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel title="Age completeness" subtitle={`${formatCount(report.total)} records examined`} className="xl:col-span-5">
          <CompletenessChart known={report.knownAge} missing={report.missingAge} />
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-sm bg-gf-raised p-2">
              <dt className="text-gf-muted">Total examined</dt>
              <dd className="font-mono text-lg text-gf-text">{formatCount(report.total)}</dd>
            </div>
            <div className="rounded-sm bg-gf-raised p-2">
              <dt className="text-gf-muted">With age</dt>
              <dd className="font-mono text-lg text-gf-text">{formatCount(report.knownAge)}</dd>
              <dd className="text-gf-muted">{formatPercent(percentOf(report.knownAge, report.total))}</dd>
            </div>
            <div className="rounded-sm bg-gf-raised p-2">
              <dt className="text-gf-muted">Missing age</dt>
              <dd className="font-mono text-lg text-gf-text">{formatCount(report.missingAge)}</dd>
              <dd className="text-gf-muted">{formatPercent(percentOf(report.missingAge, report.total))}</dd>
            </div>
          </dl>
        </Panel>

        <Panel
          title="Rows flagged per check"
          subtitle="Colour shows severity; the label beside each check repeats it in text. One row can trigger several checks."
          className="xl:col-span-7"
        >
          <QualityChecksChart checks={report.checks.map(({ shortTitle, severity, count }) => ({ title: shortTitle, severity, count }))} />
        </Panel>

        <Panel title="Check results" subtitle={`${flagged.length} of ${report.checks.length} checks flagged rows`} className="xl:col-span-12">
          <ul className="flex flex-col divide-y divide-gf-border">
            {report.checks.map((check) => (
              <li key={check.key} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-gf-text">{check.title}</h3>
                  <CheckStatus check={check} />
                </div>
                <p className="mt-1 text-xs text-gf-muted">{check.description}</p>
                {check.count > 0 && (
                  <details className="mt-2 group">
                    <summary className="cursor-pointer text-xs text-gf-blue hover:underline">
                      Show {check.samples.length === check.count ? "all" : `first ${check.samples.length} of`}{" "}
                      {formatCount(check.count)} affected {check.count === 1 ? "row" : "rows"}
                    </summary>
                    <div className="mt-2 rounded-sm border border-gf-border">
                      <StudentTable rows={check.samples} caption={`Rows flagged by: ${check.title}`} />
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
