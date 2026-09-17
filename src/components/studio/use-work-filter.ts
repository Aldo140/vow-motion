"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
/** Shareable exception views survive reloads and browser Back. */
export function useWorkFilter(allowed: readonly string[]) {
  const query = useSearchParams(),
    pathname = usePathname(),
    router = useRouter();
  const value = query.get("filter") || "all";
  const filter = allowed.includes(value) ? value : "all";
  const setFilter = (next: string) => {
    const params = new URLSearchParams(query.toString());
    if (next === "all") params.delete("filter");
    else params.set("filter", next);
    router.replace(`${pathname}?${params}`, { scroll: false });
  };
  return [filter, setFilter] as const;
}
