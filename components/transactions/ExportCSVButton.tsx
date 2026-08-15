"use client";

import { useSearchParams } from "next/navigation";

export function ExportCSVButton() {
  const searchParams = useSearchParams();

  const params = new URLSearchParams();
  for (const key of ["type", "from", "to", "owner", "search"]) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }
  const href = `/transactions/export?${params.toString()}`;

  return (
    <a
      href={href}
      className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600"
      aria-label="Export transactions as CSV"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
        <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
      </svg>
      Export CSV
    </a>
  );
}
