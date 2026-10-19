// All dashboard database access lives here. `server-only` makes the build fail
// if a Client Component ever imports this file, so Prisma and credentials can
// never end up in the browser bundle.
import "server-only";
import { connection } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  EXPECTED_AGE_RANGE,
  findBand,
  isUnexpectedAge,
  type StudentFilters,
  type TableOptions,
} from "./definitions";
import {
  type AgeFrequency,
  type AgeSummary,
  type BandCount,
  type CumulativePoint,
  countByBand,
  cumulativeShare,
  summarizeAges,
} from "./stats";

/**
 * Every query function starts with `await connection()`: it tells Next.js this
 * work belongs to a real request. That matters with Cache Components, because
 * Prisma's interactive transactions generate random IDs (crypto.randomUUID),
 * which Next.js refuses to run during any kind of prerender.
 */

/**
 * Translate URL filters into a Prisma `where` object. Prisma sends the values
 * as query parameters, so user input is never concatenated into SQL.
 * Note: an age range (minAge/maxAge) excludes NULL ages, because an unknown
 * age cannot be shown to fall inside a range.
 */
export function buildWhere(filters: StudentFilters): Prisma.StudentWhereInput {
  const and: Prisma.StudentWhereInput[] = [];
  if (filters.q) {
    // `contains` becomes SQL LIKE '%…%'. Escape LIKE's own wildcards so that
    // searching for "_" or "%" matches those characters literally.
    // MySQL's default collation makes the comparison case-insensitive.
    const text = filters.q.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    and.push({ OR: [{ name: { contains: text } }, { email: { contains: text } }] });
  }
  if (filters.minAge !== null) and.push({ age: { gte: filters.minAge } });
  if (filters.maxAge !== null) and.push({ age: { lte: filters.maxAge } });
  const band = findBand(filters.group);
  if (band) {
    and.push(
      band.key === "unknown"
        ? { age: null }
        : { age: { ...(band.min !== null && { gte: band.min }), ...(band.max !== null && { lte: band.max }) } },
    );
  }
  return and.length ? { AND: and } : {};
}

function snapshotTime() {
  const now = new Date();
  return {
    fetchedAt: now.toISOString(),
    fetchedLabel: new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(now),
  };
}

export type Snapshot = ReturnType<typeof snapshotTime>;

export type StudentRow = { id: number; name: string; email: string; age: number | null };

export type OverviewData = Snapshot & {
  tableTotal: number;
  matching: number;
  knownAge: number;
  missingAge: number;
  avgAge: number | null;
  minAge: number | null;
  maxAge: number | null;
  frequency: AgeFrequency[];
  summary: AgeSummary | null;
  bands: BandCount[];
  cumulative: CumulativePoint[];
  preview: StudentRow[];
};

/**
 * Everything the Overview and Analytics pages need, in one round trip.
 * The queries run inside one transaction so they read the same snapshot of the
 * table and the numbers always reconcile with each other.
 */
export async function getOverview(filters: StudentFilters, previewRows = 0): Promise<OverviewData> {
  await connection();
  const where = buildWhere(filters);
  const [tableTotal, agg, groups, preview] = await prisma.$transaction((tx) =>
    Promise.all([
      tx.student.count(),
      tx.student.aggregate({
        where,
        _count: { _all: true, age: true }, // _count.age counts only non-NULL ages
        _min: { age: true },
        _max: { age: true },
      }),
      // One row per distinct age (including NULL): powers the median, quartiles,
      // histogram and box plot without downloading individual students.
      tx.student.groupBy({
        by: ["age"],
        where,
        _count: { _all: true },
        orderBy: { age: "asc" },
      }),
      tx.student.findMany({ where, orderBy: { id: "asc" }, take: previewRows }),
    ]),
  );

  const frequency: AgeFrequency[] = groups
    .filter((g): g is typeof g & { age: number } => g.age !== null)
    .map((g) => ({ age: g.age, count: g._count._all }));
  const missingAge = agg._count._all - agg._count.age;
  // Mean computed exactly from the frequency table. (MySQL's AVG() on an INT
  // column returns a DECIMAL rounded to 4 places, which could occasionally
  // round the displayed value the wrong way.)
  const ageSum = frequency.reduce((sum, f) => sum + f.age * f.count, 0);

  return {
    ...snapshotTime(),
    tableTotal,
    matching: agg._count._all,
    knownAge: agg._count.age,
    missingAge,
    avgAge: agg._count.age > 0 ? ageSum / agg._count.age : null,
    minAge: agg._min.age,
    maxAge: agg._max.age,
    frequency,
    summary: summarizeAges(frequency),
    bands: countByBand(frequency, missingAge),
    cumulative: cumulativeShare(frequency),
    preview,
  };
}

export type StudentPage = Snapshot & {
  tableTotal: number;
  matching: number;
  page: number;
  totalPages: number;
  rows: StudentRow[];
};

/** One page of students. Filtering, sorting and paging all happen in MySQL. */
export async function getStudentPage(filters: StudentFilters, table: TableOptions): Promise<StudentPage> {
  await connection();
  const where = buildWhere(filters);
  // Unknown ages always sort last, whichever direction is chosen; id breaks ties
  // so the order is stable from page to page.
  const orderBy: Prisma.StudentOrderByWithRelationInput[] =
    table.sort === "age"
      ? [{ age: { sort: table.dir, nulls: "last" } }, { id: "asc" }]
      : [{ [table.sort]: table.dir }, { id: "asc" }];

  return prisma.$transaction(async (tx) => {
    const [tableTotal, matching] = await Promise.all([tx.student.count(), tx.student.count({ where })]);
    const totalPages = Math.max(1, Math.ceil(matching / table.size));
    const page = Math.min(table.page, totalPages);
    const rows = await tx.student.findMany({
      where,
      orderBy,
      skip: (page - 1) * table.size,
      take: table.size,
    });
    return { ...snapshotTime(), tableTotal, matching, page, totalPages, rows };
  });
}

// ---------------------------------------------------------------------------
// Data quality

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type QualityCheck = {
  key: string;
  title: string;
  /** Short label for chart axes. */
  shortTitle: string;
  severity: "info" | "warning" | "error";
  description: string;
  count: number;
  samples: StudentRow[];
};

export type DataQualityReport = Snapshot & {
  total: number;
  knownAge: number;
  missingAge: number;
  checks: QualityCheck[];
};

/**
 * Audits the whole table (filters are intentionally ignored). Format checks such
 * as "is this a valid email?" need application logic, so this fetches the four
 * columns of every row on the server. That is fine for a few hundred rows; a
 * much larger table would push these checks into SQL instead.
 */
export async function getDataQuality(): Promise<DataQualityReport> {
  await connection();
  const rows = await prisma.student.findMany({ orderBy: { id: "asc" } });

  const byEmail = new Map<string, StudentRow[]>();
  for (const row of rows) {
    // Compare emails case-insensitively, matching MySQL's default collation.
    const key = row.email.trim().toLowerCase();
    byEmail.set(key, [...(byEmail.get(key) ?? []), row]);
  }
  const duplicateRows = [...byEmail.values()].filter((group) => group.length > 1).flat();

  const check = (
    key: string,
    [title, shortTitle]: [string, string],
    severity: QualityCheck["severity"],
    description: string,
    matches: StudentRow[],
  ): QualityCheck => ({ key, title, shortTitle, severity, description, count: matches.length, samples: matches.slice(0, 20) });

  const missing = rows.filter((r) => r.age === null);

  return {
    ...snapshotTime(),
    total: rows.length,
    knownAge: rows.length - missing.length,
    missingAge: missing.length,
    checks: [
      check("missing-age", ["Missing age", "Missing age"], "info", "Age is NULL: the value was never recorded. Kept in all counts and shown as “Unknown age”.", missing),
      check("zero-age", ["Age recorded as 0", "Age = 0"], "error", "A zero is a recorded value, not a missing one, but 0 is not a plausible student age.", rows.filter((r) => r.age === 0)),
      check(
        "unexpected-age",
        [
          `Age outside ${EXPECTED_AGE_RANGE.min}–${EXPECTED_AGE_RANGE.max} (excluding 0)`,
          `Age outside ${EXPECTED_AGE_RANGE.min}–${EXPECTED_AGE_RANGE.max}`,
        ],
        "warning",
        "Heuristic review range chosen for this dashboard, not an official rule. These rows still count in every metric.",
        rows.filter((r) => r.age !== 0 && isUnexpectedAge(r.age)),
      ),
      check("duplicate-email", ["Duplicate email", "Duplicate email"], "error", "The same email (ignoring case) appears on more than one row. The schema has no unique constraint on email.", duplicateRows),
      check("invalid-email", ["Malformed email", "Malformed email"], "error", "Email does not look like name@domain.tld.", rows.filter((r) => !EMAIL_PATTERN.test(r.email))),
      check("blank-name", ["Blank name", "Blank name"], "error", "Name is empty or only whitespace.", rows.filter((r) => r.name.trim() === "")),
      check("name-spacing", ["Extra spaces in name", "Extra spaces"], "warning", "Leading, trailing or repeated spaces in the name.", rows.filter((r) => r.name.trim() !== "" && (r.name !== r.name.trim() || /\s{2,}/.test(r.name)))),
    ],
  };
}
