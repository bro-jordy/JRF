"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PERIODS = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All" },
];

export function PeriodToggle({
  period,
  offset,
  label,
}: {
  period: string;
  offset: number;
  label: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    params.delete("offset");
    router.push(`/?${params.toString()}`);
  }

  function setOffset(value: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("offset", String(value));
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              period === p.value
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 text-neutral-500"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period !== "all" && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset(offset + 1)}
            aria-label="Previous period"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 text-neutral-500"
          >
            ‹
          </button>
          <span className="w-28 text-center text-xs text-neutral-500">{label}</span>
          <button
            onClick={() => setOffset(offset - 1)}
            disabled={offset === 0}
            aria-label="Next period"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
