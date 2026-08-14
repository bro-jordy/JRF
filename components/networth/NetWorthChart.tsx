"use client";

import { formatIDR } from "@/lib/format";

type Snapshot = {
  snapshot_month: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
};

export function NetWorthChart({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-neutral-200">
        <p className="text-sm text-neutral-400">No data yet. Take a snapshot to start tracking.</p>
      </div>
    );
  }

  const values = snapshots.map((s) => s.net_worth);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 320;
  const H = 120;
  const PAD = 8;

  const points = snapshots.map((s, i) => {
    const x = PAD + (i / Math.max(snapshots.length - 1, 1)) * (W - PAD * 2);
    const y = PAD + (1 - (s.net_worth - min) / range) * (H - PAD * 2);
    return { x, y, s };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = [
    `M${points[0].x},${H}`,
    ...points.map((p) => `L${p.x},${p.y}`),
    `L${points[points.length - 1].x},${H}`,
    "Z",
  ].join(" ");

  const latest = snapshots[snapshots.length - 1];
  const prev = snapshots[snapshots.length - 2];
  const delta = prev ? latest.net_worth - prev.net_worth : null;
  const isGain = delta == null || delta >= 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4">
      <div>
        <p className="text-xs text-neutral-500">Net Worth</p>
        <p className="text-2xl font-semibold">{formatIDR(latest.net_worth)}</p>
        {delta !== null && (
          <p className={`text-xs ${isGain ? "text-emerald-600" : "text-red-500"}`}>
            {isGain ? "+" : ""}{formatIDR(delta)} vs last month
          </p>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#nwGrad)" />
        <polyline points={polyline} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" />
        ))}
      </svg>

      <div className="flex justify-between text-xs text-neutral-400">
        <span>{snapshots[0].snapshot_month}</span>
        <span>{latest.snapshot_month}</span>
      </div>
    </div>
  );
}
