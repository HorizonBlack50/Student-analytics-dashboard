// Read-only check that Prisma can talk to prisma_playground.
// Run with: npx tsx scripts/list-students.ts
import { prisma } from "../lib/prisma";

async function main() {
  const students = await prisma.student.findMany({ orderBy: { id: "asc" } });
  console.log(`Found ${students.length} student(s):`);
  console.table(students);
}

main()
  .catch((error) => {
    console.error("Query failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
