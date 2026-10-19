"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FILTER_KEYS } from "@/lib/analytics/definitions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", keepsFilters: true },
  { href: "/dashboard/analytics", label: "Student Analytics", keepsFilters: true },
  { href: "/dashboard/explorer", label: "Student Explorer", keepsFilters: true },
  { href: "/dashboard/data-quality", label: "Data Quality", keepsFilters: false },
  { href: "/dashboard/about", label: "About This Dashboard", keepsFilters: false },
] as const;

type Layout = "vertical" | "horizontal";

export function SidebarNav({ layout }: { layout: Layout }) {
  // Reading the URL's query string must sit inside Suspense when Cache
  // Components is on; the fallback renders the same links without filters.
  return (
    <Suspense fallback={<NavLinks layout={layout} filterQuery="" />}>
      <NavWithFilters layout={layout} />
    </Suspense>
  );
}

function NavWithFilters({ layout }: { layout: Layout }) {
  const searchParams = useSearchParams();
  const kept = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value) kept.set(key, value);
  }
  const qs = kept.toString();
  return <NavLinks layout={layout} filterQuery={qs ? `?${qs}` : ""} />;
}

function NavLinks({ layout, filterQuery }: { layout: Layout; filterQuery: string }) {
  const pathname = usePathname();
  const vertical = layout === "vertical";
  return (
    <nav aria-label="Dashboard">
      <ul className={vertical ? "flex flex-col gap-0.5 px-2" : "flex gap-1 overflow-x-auto px-3 pb-2"}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={`${item.href}${item.keepsFilters ? filterQuery : ""}`}
                aria-current={active ? "page" : undefined}
                className={[
                  "block rounded-sm px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-gf-blue",
                  vertical ? "border-l-2" : "border-b-2",
                  active
                    ? "border-gf-blue bg-gf-raised font-medium text-gf-text"
                    : "border-transparent text-gf-muted hover:bg-gf-raised hover:text-gf-text",
                ].join(" ")}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
