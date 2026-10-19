import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AGE_BANDS, EXPECTED_AGE_RANGE } from "@/lib/analytics/definitions";
import { PageHeader } from "../_components/page-header";
import { Panel } from "../_components/panel";

export const metadata: Metadata = { title: "About This Dashboard" };

const METRICS: { name: string; definition: ReactNode; nulls: string; empty: string }[] = [
  {
    name: "Students",
    definition: "Number of student records matching the active filters.",
    nulls: "Rows with an unknown age are counted.",
    empty: "Shows 0.",
  },
  {
    name: "Average age",
    definition: "Arithmetic mean of non-null ages: sum of ages ÷ number of known ages. Rounded to 1 decimal.",
    nulls: "Excluded (an unknown age is not zero).",
    empty: "Shows — when there are no known ages.",
  },
  {
    name: "Median age",
    definition: "Middle value of the sorted non-null ages; with an even count, the mean of the two middle values.",
    nulls: "Excluded.",
    empty: "Shows —.",
  },
  {
    name: "Age range",
    definition: "Observed minimum and maximum of non-null ages.",
    nulls: "Excluded.",
    empty: "Shows —.",
  },
  {
    name: "Missing age rate",
    definition: (
      <>
        <code className="font-mono">students with NULL age ÷ matching students × 100</code>. Denominator includes unknown ages.
      </>
    ),
    nulls: "This metric counts them.",
    empty: "Shows — (no division by zero).",
  },
  {
    name: "Age completeness",
    definition: (
      <>
        <code className="font-mono">students with an age ÷ matching students × 100</code>. Same denominator, so it and the
        missing rate add up to 100% (±0.1 from rounding each to 1 decimal).
      </>
    ),
    nulls: "Counted in the denominator only.",
    empty: "Shows —.",
  },
  {
    name: "Quartiles, IQR & box plot",
    definition:
      "Q1/Q3 use linear interpolation between closest ranks (Excel QUARTILE.INC, NumPy default). Whiskers reach the most extreme ages within Q1 − 1.5×IQR and Q3 + 1.5×IQR; ages beyond are drawn as outliers.",
    nulls: "Excluded.",
    empty: "Chart shows a message instead.",
  },
];

const FILTER_SCOPE: [string, string, string][] = [
  ["Overview", "Yes", "KPIs, age band chart, completeness, per-age chart, record preview"],
  ["Student Analytics", "Yes", "KPIs, box plot, summary statistics, group comparison, cumulative chart"],
  ["Student Explorer", "Yes", "Table, matching count, pagination (plus sort order and page size)"],
  ["Data Quality", "No", "Always audits every row in the table"],
  ["Header “Students in table”", "No", "Always the full table row count"],
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-4">
      <Panel title={title}>{children}</Panel>
    </section>
  );
}

const th = "px-3 py-2 text-left text-xs font-medium text-gf-muted";
const td = "px-3 py-2 align-top text-sm";

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About This Dashboard"
        description="How every number on this dashboard is defined, where it comes from and what it can and cannot tell you."
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section id="data" title="Data source & freshness">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-gf-text">
            <li>
              Source: the <code className="font-mono">Student</code> table in the local MySQL database{" "}
              <code className="font-mono">prisma_playground</code>, read through Prisma ORM 7 on the server.
            </li>
            <li>
              Columns: <code className="font-mono">id</code>, <code className="font-mono">name</code>,{" "}
              <code className="font-mono">email</code>, <code className="font-mono">age</code> (nullable). There are no
              dates, courses, grades or institutions, so the dashboard shows no trends, comparisons with earlier periods
              or performance measures.
            </li>
            <li>
              Data is read when a page loads, when a filter changes and when you press <b>Refresh data</b>. It is not
              live and there is no automatic polling; the header shows when the current snapshot was fetched.
            </li>
            <li>Nothing is cached between requests, so a refresh always re-queries MySQL.</li>
            <li>
              Most records are fictional seed data (emails ending <code className="font-mono">@students.example</code>).
              Ages say nothing about performance, attendance, engagement or outcomes.
            </li>
          </ul>
        </Section>

        <Section id="nulls" title="Missing values, zeros and empty results">
          <dl className="flex flex-col gap-3 text-sm">
            <div>
              <dt className="font-semibold text-gf-text">Missing (NULL) age</dt>
              <dd className="text-gf-muted">
                The age was never recorded. Such rows count in “Students”, appear in the “Unknown age” band and in the
                missing-age rate, but are excluded from the average, median, quartiles and range.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gf-text">Zero age</dt>
              <dd className="text-gf-muted">
                A recorded value of 0. It is a real number, so it is included in every statistic, and the Data Quality
                page flags it as implausible.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gf-text">Unexpected ages</dt>
              <dd className="text-gf-muted">
                Ages outside {EXPECTED_AGE_RANGE.min}–{EXPECTED_AGE_RANGE.max} are highlighted for review. This range is
                a heuristic chosen for this dashboard, not an official rule; flagged rows are never excluded.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gf-text">Empty result</dt>
              <dd className="text-gf-muted">
                When filters match no rows, counts show 0, other metrics show —, and charts show a message. No division
                by zero occurs.
              </dd>
            </div>
          </dl>
        </Section>

        <div className="xl:col-span-2">
          <Section id="metrics" title="Metric definitions">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-gf-border">
                    <th scope="col" className={th}>Metric</th>
                    <th scope="col" className={th}>Definition</th>
                    <th scope="col" className={th}>Unknown ages</th>
                    <th scope="col" className={th}>No matching data</th>
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((m) => (
                    <tr key={m.name} className="border-b border-gf-border/60 last:border-0">
                      <th scope="row" className={`${td} text-left font-semibold text-gf-text`}>{m.name}</th>
                      <td className={`${td} text-gf-text`}>{m.definition}</td>
                      <td className={`${td} text-gf-muted`}>{m.nulls}</td>
                      <td className={`${td} text-gf-muted`}>{m.empty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        <Section id="bands" title="Age groups">
          <p className="mb-2 text-sm text-gf-muted">
            Bounds are inclusive. Because age is a whole number, the groups do not overlap and every record belongs to
            exactly one of them, so the group counts always add up to the number of matching students.
          </p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gf-border">
                <th scope="col" className={th}>Group</th>
                <th scope="col" className={th}>Rule</th>
              </tr>
            </thead>
            <tbody>
              {AGE_BANDS.map((b) => (
                <tr key={b.key} className="border-b border-gf-border/60 last:border-0">
                  <th scope="row" className={`${td} text-left font-medium text-gf-text`}>{b.label}</th>
                  <td className={`${td} font-mono text-gf-muted`}>{b.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section id="filters" title="Filters and their scope">
          <ul className="mb-3 flex list-disc flex-col gap-1 pl-5 text-sm text-gf-text">
            <li><b>Search</b>: case-insensitive “contains” match on name or email.</li>
            <li>
              <b>Min / max age</b>: inclusive. Setting either one excludes unknown ages, because an unknown age cannot be
              shown to be inside a range.
            </li>
            <li><b>Age group</b>: one of the groups on the left, including “Unknown age”.</li>
            <li>All active filters combine with AND. Clicking a chart bar sets the matching filter; clicking it again clears it.</li>
          </ul>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gf-border">
                <th scope="col" className={th}>Page / element</th>
                <th scope="col" className={th}>Filtered?</th>
                <th scope="col" className={th}>What is affected</th>
              </tr>
            </thead>
            <tbody>
              {FILTER_SCOPE.map(([page, applies, what]) => (
                <tr key={page} className="border-b border-gf-border/60 last:border-0">
                  <th scope="row" className={`${td} text-left font-medium text-gf-text`}>{page}</th>
                  <td className={`${td} text-gf-text`}>{applies}</td>
                  <td className={`${td} text-gf-muted`}>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </>
  );
}
