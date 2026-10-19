"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { type StudentFilters, type TableOptions, toQueryString } from "@/lib/analytics/definitions";

/**
 * Changing a filter means changing the URL. The server page then re-runs its
 * Prisma queries for the new URL, so the database stays the source of truth.
 * The transition keeps the current results on screen until the new ones arrive.
 */
export function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function navigate(filters: StudentFilters, table?: Partial<TableOptions>) {
    startTransition(() => {
      router.push(`${pathname}${toQueryString(filters, table)}`, { scroll: false });
    });
  }

  return { navigate, isPending };
}
