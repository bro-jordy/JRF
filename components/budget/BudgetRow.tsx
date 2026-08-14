"use client";

import { useActionState, useRef, useState } from "react";
import { upsertBudget, deleteBudget } from "@/app/(app)/budget/actions";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { formatIDR } from "@/lib/format";

type Category = { id: string; name: string; type: "income" | "expense" };

type Budget = {
  id: string;
  category_id: string;
  month: string;
  amount: number;
};

export function BudgetRow({
  budget,
  categories,
  spent,
}: {
  budget: Budget;
  categories: Category[];
  spent: number;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const [state, action, pending] = useActionState(upsertBudget, { error: null });

  const category = categories.find((c) => c.id === budget.category_id);
  const pct = Math.min(100, Math.round((spent / budget.amount) * 100));
  const isOver = spent > budget.amount;
  const barColor = isOver ? "bg-red-500" : pct >= 80 ? "bg-amber-400" : "bg-emerald-500";

  async function handleAction(formData: FormData) {
    await action(formData);
    setOpen(false);
  }

  async function handleDelete() {
    await deleteBudget(budget.id);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full flex-col gap-2 rounded-xl border border-neutral-200 p-4 text-left"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{category?.name ?? "-"}</p>
          <p className={`text-sm font-semibold ${isOver ? "text-red-500" : "text-neutral-700"}`}>
            {formatIDR(spent)} <span className="font-normal text-neutral-400">/ {formatIDR(budget.amount)}</span>
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-neutral-400">
          {isOver
            ? `Over by ${formatIDR(spent - budget.amount)}`
            : `${formatIDR(budget.amount - spent)} remaining · ${pct}%`}
        </p>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Budget">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`bc-${budget.id}`} className="text-sm font-medium">Category</label>
            <select id={`bc-${budget.id}`} name="category_id" defaultValue={budget.category_id} required className={SELECT_CLASS} style={SELECT_CHEVRON}>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`bm-${budget.id}`} className="text-sm font-medium">Month</label>
            <input
              id={`bm-${budget.id}`}
              name="month"
              type="month"
              required
              defaultValue={budget.month}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`ba-${budget.id}`} className="text-sm font-medium">Limit Amount</label>
            <AmountInput id={`ba-${budget.id}`} name="amount" required defaultValue={budget.amount} />
          </div>

          {state.error && <p className="text-sm text-red-500">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save Budget"}
          </button>

          <ConfirmDeleteButton onConfirm={handleDelete} label="Delete Budget" />
        </form>
      </Modal>
    </>
  );
}
