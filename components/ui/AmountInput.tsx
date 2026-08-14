"use client";

import { useState } from "react";

const groupFormatter = new Intl.NumberFormat("id-ID");

export function AmountInput({
  id,
  name,
  label,
  defaultValue,
  required,
}: {
  id: string;
  name: string;
  label?: string;
  defaultValue?: number;
  required?: boolean;
}) {
  const initial = defaultValue != null ? defaultValue.toFixed(2).split(".") : null;
  const [whole, setWhole] = useState(initial ? initial[0] : "");
  const [cents, setCents] = useState(initial ? initial[1] : "00");

  const formattedWhole = whole ? groupFormatter.format(Number(whole)) : "";
  const rawValue = `${whole || "0"}.${cents.padEnd(2, "0").slice(0, 2)}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      )}
      <div className="flex h-11 items-center gap-1 rounded-lg border border-neutral-300 px-3 focus-within:border-neutral-500">
        <span className="text-neutral-400">Rp</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={formattedWhole}
          onChange={(e) => setWhole(e.target.value.replace(/\D/g, ""))}
          placeholder="0"
          className="min-w-0 flex-1 border-none bg-transparent p-0 outline-none"
        />
        <span className="text-neutral-400">,</span>
        <input
          type="text"
          inputMode="numeric"
          value={cents}
          onFocus={(e) => e.target.select()}
          onChange={(e) =>
            setCents(e.target.value.replace(/\D/g, "").slice(0, 2) || "00")
          }
          className="w-8 border-none bg-transparent p-0 outline-none"
        />
      </div>
      <input type="hidden" name={name} value={rawValue} required={required} />
    </div>
  );
}
