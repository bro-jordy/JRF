"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FIELD_CLASS } from "@/components/ui/form-styles";
import { monthStartStr, todayStr } from "@/lib/date";

const TYPE_PILLS = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Saving" },
];

export function TransactionFilters({
  type,
  from,
  to,
  owner,
  search,
  owners,
}: {
  type: string;
  from: string;
  to: string;
  owner: string;
  search: string;
  owners: { id: string; display_name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasFilters = type !== "all" || owner !== "all" || !!from || !!to || !!search;
  const [expanded, setExpanded] = useState(hasFilters);
  const [searchValue, setSearchValue] = useState(search);

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/transactions?${params.toString()}`);
  }

  const OWNER_PILLS = [{ id: "all", display_name: "All" }, ...owners];

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${
          hasFilters
            ? "border-neutral-900 bg-neutral-900 text-white"
            : "border-neutral-300 text-neutral-600"
        }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 .8 1.6l-4.8 6.4v4a1 1 0 0 1-.5.87l-2 1.14A1 1 0 0 1 8 16.14V11L3.2 4.6A1 1 0 0 1 3 4Z" />
        </svg>
        Filters
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-3">
          <div className="flex gap-2 overflow-x-auto">
            {OWNER_PILLS.map((p) => (
              <button
                key={p.id}
                onClick={() => updateParams({ owner: p.id === "all" ? "" : p.id })}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                  owner === p.id
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-600"
                }`}
              >
                {p.display_name}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {TYPE_PILLS.map((p) => (
              <button
                key={p.value}
                onClick={() => updateParams({ type: p.value === "all" ? "" : p.value })}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                  type === p.value
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 text-neutral-600"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <input
            type="search"
            placeholder="Search description..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ search: searchValue });
            }}
            onBlur={() => updateParams({ search: searchValue })}
            className={`${FIELD_CLASS} h-10 text-sm`}
          />

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => updateParams({ from: e.target.value })}
              className={`${FIELD_CLASS} h-10 text-sm`}
            />
            <span className="text-neutral-400">–</span>
            <input
              type="date"
              value={to}
              onChange={(e) => updateParams({ to: e.target.value })}
              className={`${FIELD_CLASS} h-10 text-sm`}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => updateParams({ from: monthStartStr(), to: todayStr() })}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600"
            >
              This month
            </button>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearchValue("");
                  updateParams({ type: "", owner: "", from: "", to: "", search: "" });
                }}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
