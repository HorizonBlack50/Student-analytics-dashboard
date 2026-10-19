import { Suspense } from "react";
import Image from "next/image";
import ClickCounter from "./components/ClickCounter";
import StudentList, { StudentListSkeleton } from "./components/StudentList";

const concepts = [
  {
    title: "App Router",
    file: "app/page.tsx",
    body: "Every folder in app/ is a URL. Add app/about/page.tsx and you get /about.",
  },
  {
    title: "Server Components",
    file: "app/page.tsx",
    body: "This page renders on the server and ships as HTML, so the browser downloads very little JavaScript.",
  },
  {
    title: "Client Components",
    file: "app/components/ClickCounter.tsx",
    body: 'Add "use client" at the top of a file when you need state, effects or click handlers.',
  },
  {
    title: "Layouts",
    file: "app/layout.tsx",
    body: "The root layout wraps every page: fonts, global CSS and the <html> tag live there.",
  },
  {
    title: "Tailwind CSS",
    file: "app/globals.css",
    body: "Utility classes like rounded-full and style everything on this page.",
  },
  {
    title: "Optimised images",
    file: "public/next.svg",
    body: "next/image serves files from public/ with sizing and lazy loading handled for you.",
  },
];

const nextSteps = [
  "Create an /about page in app/about/page.tsx",
  "Link to it with <Link href=\"/about\"> from next/link",
  "Make an async component that awaits fetch() for real data",
  "Add a loading.tsx file to show a spinner while it loads",
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-6 py-16 sm:py-24">
      {/* Hero */}
      <section className="flex flex-col items-start gap-6">
        <span className="rounded-full border border-black/10 px-3 py-1 text-sm text-foreground/70">
          Built locally on my Mac
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          My First{" "}
          <span className="bg-gradient-to-r from-sky-500 to-violet-500 bg-clip-text text-transparent">
            Next.js
          </span>{" "}
          App
        </h1>
        <p className="max-w-2xl text-lg text-foreground/70">
          A small playground for learning how Next.js works: routing, server
          and client components, layouts and styling with Tailwind.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="#learn"
            className="rounded-full bg-accent px-6 py-3 font-medium text-white shadow-md shadow-accent/30 transition hover:bg-accent-hover"
          >
            What I&apos;m learning
          </a>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-black/10 px-6 py-3 font-medium transition hover:bg-black/5"
          >
            Next.js docs ↗
          </a>
        </div>
      </section>

      {/* Concepts */}
      <section id="learn" className="flex scroll-mt-8 flex-col gap-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          What this app shows
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {concepts.map((c) => (
            <article
              key={c.title}
              className="flex flex-col gap-3 rounded-2xl border border-black/10 p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-sm leading-6 text-foreground/70">{c.body}</p>
              <code className="mt-auto w-fit rounded bg-black/5 px-2 py-1 font-mono text-xs">
                {c.file}
              </code>
            </article>
          ))}
        </div>
      </section>

      {/* Live data from MySQL via Prisma */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">Students</h2>
          <p className="max-w-2xl text-foreground/70">
            Read from the <code className="font-mono text-sm">Student</code>{" "}
            table in MySQL with Prisma, on every request.
          </p>
        </div>
        <Suspense fallback={<StudentListSkeleton />}>
          <StudentList />
        </Suspense>
      </section>

      {/* Interactive demo */}
      <section className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-sky-500/10 to-violet-500/10 p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Try it</h2>
        <p className="max-w-2xl text-foreground/70">
          The rest of this page is static HTML from the server. This button is
          a Client Component, so its state lives in your browser.
        </p>
        <ClickCounter />
      </section>

      {/* Next steps */}
      <section className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold tracking-tight">Up next</h2>
        <ol className="flex flex-col gap-3">
          {nextSteps.map((step, i) => (
            <li key={step} className="flex items-start gap-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-black/10 text-sm font-medium">
                {i + 1}
              </span>
              <span className="pt-0.5 text-foreground/80">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="flex items-center gap-3 border-t border-black/10 pt-8 text-sm text-foreground/60">
        <span>Powered by</span>
        <Image
          src="/next.svg"
          alt="Next.js"
          width={72}
          height={15}        />
      </footer>
    </main>
  );
}
