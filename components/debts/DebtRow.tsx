"use client";

import { useState } from "react";
import { settleDebt, deleteDebt } from "@/app/(app)/debts/actions";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { formatIDR } from "@/lib/format";

type Debt = {
  id: string;
  lender_name: string;
  borrower_name: string;
  amount: number;
  description: string | null;
  due_date: string | null;
  is_settled: boolean;
  settled_at: string | null;
};

export function DebtRow({ debt }: { debt: Debt }) {
  const [settling, setSettling] = useState(false);

  const isOverdue =
    !debt.is_settled &&
    debt.due_date &&
    new Date(debt.due_date) < new Date();

  async function handleSettle() {
    setSettling(true);
    await settleDebt(debt.id);
    setSettling(false);
  }

  async function handleDelete() {
    await deleteDebt(debt.id);
  }

  return (
    <div className={`rounded-xl border p-4 ${debt.is_settled ? "border-neutral-100 bg-neutral-50" : "border-neutral-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{formatIDR(debt.amount)}</span>
            {debt.is_settled && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Settled</span>
            )}
            {isOverdue && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Overdue</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">
            {debt.borrower_name} → owes → {debt.lender_name}
          </p>
          {debt.description && (
            <p className="mt-0.5 text-xs text-neutral-400">{debt.description}</p>
          )}
          {debt.due_date && (
            <p className="mt-0.5 text-xs text-neutral-400">Due: {debt.due_date}</p>
          )}
          {debt.settled_at && (
            <p className="mt-0.5 text-xs text-neutral-400">
              Settled: {new Date(debt.settled_at).toLocaleDateString("id-ID")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 items-end">
          {!debt.is_settled && (
            <button
              onClick={handleSettle}
              disabled={settling}
              className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 disabled:opacity-50"
            >
              {settling ? "..." : "Settle"}
            </button>
          )}
          <ConfirmDeleteButton onConfirm={handleDelete} label="Delete" />
        </div>
      </div>
    </div>
  );
}
