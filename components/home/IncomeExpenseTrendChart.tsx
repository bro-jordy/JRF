"use client";

import { formatIDR } from "@/lib/format";
import { useBalanceVisibility } from "@/components/home/BalanceVisibilityContext";

export type MonthStat = {
  label: string; // e.g. "Aug"
  income: number;
  expense: number;
};

export function IncomeExpenseTrendChart({ data }: { data: MonthStat[] }) {
  const { hidden } = useBalanceVisibility();

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);

  const BAR_HEIGHT = 100;
  const BAR_WIDTH = 14;
  const GAP = 4;      // gap between income/expense bar pair
  const GROUP_GAP = 10; // gap between months
  const GROUP_WIDTH = BAR_WIDTH * 2 + GAP + GROUP_GAP;
  const TOTAL_WIDTH = data.length * GROUP_WIDTH - GROUP_GAP;

  function barH(val: number) {
    return (val / maxVal) * BAR_HEIGHT;
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <h2 className="text-sm font-medium text-neutral-500">Income vs Expense</h2>

      <div className="mt-1 flex items-center gap-3">
        <span className="flex items-center gap-1 text-xs text-neutral-500">
          <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" /> Income
        </span>
        <span className="flex items-center gap-1 text-xs text-neutral-500">
          <span className="inline-block h-2 w-2 rounded-sm bg-red-400" /> Expense
        </span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${TOTAL_WIDTH} ${BAR_HEIGHT + 20}`}
          className="w-full"
          style={{ minWidth: `${TOTAL_WIDTH * 2}px`, maxWidth: "100%" }}
          aria-label="Income vs expense trend chart"
        >
          {data.map((d, i) => {
            const x = i * GROUP_WIDTH;
            const incomeH = barH(d.income);
            const expenseH = barH(d.expense);

            return (
              <g key={d.label}>
                {/* Income bar */}
                <rect
                  x={x}
                  y={BAR_HEIGHT - incomeH}
                  width={BAR_WIDTH}
                  height={incomeH || 1}
                  rx={2}
                  fill="#10b981"
                  opacity={hidden ? 0.3 : 1}
                />
                {/* Expense bar */}
                <rect
                  x={x + BAR_WIDTH + GAP}
                  y={BAR_HEIGHT - expenseH}
                  width={BAR_WIDTH}
                  height={expenseH || 1}
                  rx={2}
                  fill="#f87171"
                  opacity={hidden ? 0.3 : 1}
                />
                {/* Month label */}
                <text
                  x={x + BAR_WIDTH + GAP / 2}
                  y={BAR_HEIGHT + 14}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#9ca3af"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Max value hint */}
      {!hidden && (
        <p className="mt-1 text-right text-xs text-neutral-400">
          Max: {formatIDR(maxVal)}
        </p>
      )}
    </div>
  );
}
