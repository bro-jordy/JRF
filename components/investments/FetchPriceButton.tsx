"use client";

import { useState } from "react";
import { fetchAndUpdatePrice } from "@/app/(app)/investments/actions";
import { formatIDR } from "@/lib/format";

export function FetchPriceButton({
  holdingId,
  ticker,
}: {
  holdingId: string;
  ticker: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ error?: string | null; newValue?: number } | null>(null);

  async function handleFetch() {
    setLoading(true);
    setResult(null);
    const res = await fetchAndUpdatePrice(holdingId, ticker);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleFetch}
        disabled={loading}
        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Fetching..." : "🔄 Update Price"}
      </button>
      {result?.error && (
        <p className="text-xs text-red-500">{result.error}</p>
      )}
      {result?.newValue != null && !result.error && (
        <p className="text-xs text-emerald-600">Updated to {formatIDR(result.newValue)}</p>
      )}
    </div>
  );
}
