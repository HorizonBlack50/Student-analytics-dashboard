import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

const PREVIEW_COUNT = 6;

// Server Component: this runs only on the server, so the database
// credentials and query never reach the browser.
export default async function StudentList() {
  // Read the database at request time, never during `next build`.
  await connection();

  const [students, total] = await Promise.all([
    prisma.student.findMany({ orderBy: { id: "asc" }, take: PREVIEW_COUNT }),
    prisma.student.count(),
  ]);

  if (students.length === 0) {
    return <p className="text-foreground/70">No students in the database yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => (
          <li
            key={student.id}
            className="flex flex-col gap-1 rounded-2xl border border-black/10 p-6"
          >
            <span className="font-semibold">{student.name}</span>
            <span className="text-sm text-foreground/70">{student.email}</span>
            <span className="mt-2 w-fit rounded bg-black/5 px-2 py-1 font-mono text-xs">
              {student.age === null ? "age unknown" : `age ${student.age}`}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-foreground/70">
        Showing {students.length} of {total} students.{" "}
        <Link href="/dashboard" className="font-medium text-accent hover:underline">
          Explore them all in the analytics dashboard →
        </Link>
      </p>
    </div>
  );
}

export function StudentListSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-28 animate-pulse rounded-2xl bg-black/5" />
      ))}
    </ul>
  );
}
