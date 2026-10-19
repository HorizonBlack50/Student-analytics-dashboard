// Inserts fictional students into prisma_playground.Student. Insert-only and idempotent.
// Run with: npx tsx scripts/seed-students.ts [count]   (default 400)
//
// How duplicates are prevented without a database unique constraint:
// record #N is generated deterministically from N, and its email always contains
// "seed-NNNN". Before inserting, we ask the database which of those emails already
// exist and insert only the missing ones. Re-running inserts nothing new.
import { prisma } from "../lib/prisma";

const DEFAULT_COUNT = 400;
const EMAIL_DOMAIN = "students.example"; // .example is reserved (RFC 2606), never a real mailbox

// A few deliberately implausible ages so the Data Quality checks have something to flag.
const IMPLAUSIBLE_AGES: Record<number, number> = { 37: 0, 142: 7, 289: 112 };

const FIRST_NAMES = [
  "Aarav", "Ananya", "Vihaan", "Diya", "Arjun", "Isha", "Kabir", "Meera", "Rohan", "Saanvi",
  "Aditya", "Kavya", "Nikhil", "Pooja", "Siddharth", "Tanvi", "Yash", "Zara", "Farhan", "Leela",
  "Oliver", "Amelia", "Lucas", "Sofia", "Mateo", "Chloe", "Noah", "Hana", "Kenji", "Mei",
  "Omar", "Layla", "Tomasz", "Ingrid", "Kwame", "Amara", "Diego", "Valentina", "Elif", "Jonas",
  "Sam", "Jo", "Alexandrina", "Maximilian", "Bo", "Evangeline", "Ravi", "Nia", "Priyanka", "Ed",
];

const LAST_NAMES = [
  "Sharma", "Iyer", "Patel", "Reddy", "Nair", "Gupta", "Kulkarni", "Banerjee", "Menon", "Joshi",
  "Fernandes", "Khan", "Das", "Chatterjee", "Pillai", "Rao", "Singh", "Desai", "Bose", "Kapoor",
  "Smith", "Garcia", "Müller", "Rossi", "Tanaka", "Kim", "Nguyen", "Okafor", "Novak", "Silva",
  "Andersson", "Haddad", "Kowalski", "Dubois", "Mensah", "Lopez", "Yilmaz", "Ng", "Li", "Wu",
  "Venkataraman", "Bhattacharya", "Van der Merwe", "O'Brien", "Castellanos-Ruiz", "Ito", "Ali",
];

// Small deterministic pseudo-random generator (mulberry32): same seed, same sequence.
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

function slug(text: string) {
  return text.normalize("NFD").replace(/[^A-Za-z]/g, "").toLowerCase();
}

function makeAge(random: () => number): number | null {
  const r = random();
  if (r < 0.06) return null; // ~6% missing
  if (r < 0.1) return 16 + Math.floor(random() * 2); // 16–17
  if (r < 0.16) return 31 + Math.floor(random() * 8); // 31–38
  // 18–30, weighted towards the early twenties (sum of two uniforms)
  return 18 + Math.floor(((random() + random()) / 2) * 13);
}

function makeStudent(n: number) {
  const random = rng(n * 7919 + 17);
  const first = pick(FIRST_NAMES, random);
  const last = pick(LAST_NAMES, random);
  const middle = random() < 0.15 ? ` ${String.fromCharCode(65 + Math.floor(random() * 26))}.` : "";
  const age = n in IMPLAUSIBLE_AGES ? IMPLAUSIBLE_AGES[n] : makeAge(random);
  const tag = `seed-${String(n).padStart(4, "0")}`;
  return {
    name: `${first}${middle} ${last}`,
    email: `${tag}.${slug(first)}.${slug(last)}@${EMAIL_DOMAIN}`,
    age,
  };
}

async function main() {
  const count = Number(process.argv[2] ?? DEFAULT_COUNT);
  if (!Number.isInteger(count) || count < 1 || count > 5000) {
    throw new Error("Count must be a whole number between 1 and 5000.");
  }

  const planned = Array.from({ length: count }, (_, i) => makeStudent(i + 1));
  const before = await prisma.student.count();

  const existing = await prisma.student.findMany({
    where: { email: { in: planned.map((s) => s.email) } },
    select: { email: true },
  });
  const existingEmails = new Set(existing.map((s) => s.email));
  const toInsert = planned.filter((s) => !existingEmails.has(s.email));

  const { count: inserted } = toInsert.length
    ? await prisma.student.createMany({ data: toInsert })
    : { count: 0 };

  // Read-only verification
  const after = await prisma.student.count();
  const seeded = await prisma.student.count({ where: { email: { endsWith: `@${EMAIL_DOMAIN}` } } });

  console.log(`Planned seed records : ${count}`);
  console.log(`Already present      : ${existingEmails.size}`);
  console.log(`Inserted now         : ${inserted}`);
  console.log(`Rows before / after  : ${before} / ${after}`);
  console.log(`Seeded rows in table : ${seeded}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
