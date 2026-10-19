import type { Metadata } from "next";
import Link from "next/link";
import { SidebarNav } from "./_components/sidebar-nav";

export const metadata: Metadata = {
  title: { default: "Student Analytics Lab", template: "%s · Student Analytics Lab" },
  description: "Grafana-inspired analytics dashboard for the prisma_playground Student table.",
};

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-3 focus-visible:outline-2 focus-visible:outline-gf-blue">
      <span aria-hidden="true" className="grid size-6 grid-cols-2 gap-0.5">
        <span className="rounded-[1px] bg-gf-blue" />
        <span className="rounded-[1px] bg-gf-green" />
        <span className="rounded-[1px] bg-gf-amber" />
        <span className="rounded-[1px] bg-gf-blue/40" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-gf-text">Student Analytics Lab</span>
        <span className="text-[11px] text-gf-muted">Learning dashboard</span>
      </span>
    </Link>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-screen flex-1 bg-gf-canvas text-gf-text [color-scheme:dark]">
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-sm focus:bg-gf-blue focus:px-3 focus:py-2 focus:text-gf-canvas"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-gf-border bg-gf-panel lg:flex">
        <Brand />
        <div className="mb-2 border-b border-gf-border" />
        <SidebarNav layout="vertical" />
        <div className="mt-auto border-t border-gf-border px-4 py-3 text-[11px] leading-5 text-gf-muted">
          <p>
            Source: MySQL · <span className="font-mono">prisma_playground.Student</span>
          </p>
          <p>Read-only · fictional data</p>
          <Link href="/" className="text-gf-blue hover:underline">
            ← Back to app home
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile / tablet top bar */}
        <div className="border-b border-gf-border bg-gf-panel lg:hidden">
          <Brand />
          <SidebarNav layout="horizontal" />
        </div>
        <main id="dashboard-main" className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
