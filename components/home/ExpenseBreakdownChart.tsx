"use client";

import { useEffect, useRef, useState } from "react";
import { formatIDR } from "@/lib/format";
import { useBalanceVisibility } from "@/components/home/BalanceVisibilityContext";

const COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];

export type Slice = { label: string; amount: number };

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function donutSegmentPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
) {
  const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const startInner = polarToCartesian(cx, cy, innerR, endAngle);
  const endInner = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${startOuter.x} ${startOuter.y} A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y} L ${endInner.x} ${endInner.y} A ${innerR} ${innerR} 0 ${largeArc} 1 ${startInner.x} ${startInner.y} Z`;
}

export function ExpenseBreakdownChart({ data, total }: { data: Slice[]; total: number }) {
  const { hidden } = useBalanceVisibility();
  const [selected, setSelected] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelected(null);
      }
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  if (total <= 0 || data.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-500">Expenses by Category</h2>
        <div className="mt-3 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-28 w-28">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e1e0d9" strokeWidth="15" />
          </svg>
        </div>
        <p className="mt-2 text-center text-sm text-neutral-400">No expenses this period.</p>
      </div>
    );
  }

  const gapDeg = data.length > 1 ? 1.5 : 0;
  const segments = data.reduce<{ cursor: number; items: (Slice & { path: string; color: string; pct: number })[] }>(
    (acc, d, i) => {
      const sweep = (d.amount / total) * 360;
      const start = acc.cursor + gapDeg / 2;
      const end = acc.cursor + sweep - gapDeg / 2;
      return {
        cursor: acc.cursor + sweep,
        items: [
          ...acc.items,
          {
            label: d.label,
            amount: d.amount,
            path: donutSegmentPath(50, 50, 40, 25, start, Math.max(end, start + 0.01)),
            color: COLORS[i % COLORS.length],
            pct: (d.amount / total) * 100,
          },
        ],
      };
    },
    { cursor: 0, items: [] }
  ).items;

  const active = segments.find((s) => s.label === selected) ?? null;
  const centerLabel = active ? active.label : "Total";
  const centerAmount = active ? active.amount : total;

  function toggle(label: string) {
    setSelected((current) => (current === label ? null : label));
  }

  return (
    <div ref={containerRef} className="rounded-xl border border-neutral-200 p-4">
      <h2 className="text-sm font-medium text-neutral-500">Expenses by Category</h2>
      <div className="mt-3 grid grid-cols-2 items-center gap-4">
        <div className="flex justify-center">
          <div className="relative h-36 w-36">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              {segments.map((s) => (
                <path
                  key={s.label}
                  d={s.path}
                  fill={s.color}
                  opacity={selected && selected !== s.label ? 0.25 : 1}
                  className="cursor-pointer transition-opacity"
                  onClick={() => toggle(s.label)}
                >
                  <title>
                    {hidden ? s.label : `${s.label}: ${formatIDR(s.amount)} (${s.pct.toFixed(0)}%)`}
                  </title>
                </path>
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
              <span className="truncate text-[10px] text-neutral-400">{centerLabel}</span>
              <span className="text-sm font-semibold text-neutral-900">
                {hidden ? "••••••" : formatIDR(centerAmount)}
              </span>
            </div>
          </div>
        </div>
        <ul className="flex flex-col gap-1">
          {segments.map((s) => (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => toggle(s.label)}
                className={`flex w-full items-center gap-2 rounded-md px-1 py-1 text-sm transition-opacity ${
                  selected && selected !== s.label ? "opacity-40" : ""
                } ${selected === s.label ? "bg-neutral-100" : ""}`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="min-w-0 flex-1 truncate text-left text-neutral-600">
                  {s.label}
                </span>
                <span className="shrink-0 font-semibold text-neutral-900">
                  {s.pct.toFixed(0)}%
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
