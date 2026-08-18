"use client";

import { useRef, useState } from "react";
import { upsertBudget } from "@/app/(app)/budget/actions";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { SaveButton } from "@/components/ui/SaveButton";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { saveWithFeedback } from "@/lib/hooks/saveForm";
import { currentMonthStr } from "@/lib/date";

type Category = { id: string; name: string; type: "income" | "expense" };

export function AddBudgetForm({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const expenseCategories = categories.filter((c) => c.type === "expense");

  async function handleAction(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPending(true);

    try {
      const result = await saveWithFeedback(() => upsertBudget({ error: null }, formData), {
        entity: "budget",
        setToast,
        onSuccess: () => {
          formRef.current?.reset();
          setOpen(false);
        },
      });
      setError(result.error);
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium"
      >
        + Add Budget
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Set Budget">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="budget-category" className="text-sm font-medium">Category</label>
            <select id="budget-category" name="category_id" required className={SELECT_CLASS} style={SELECT_CHEVRON}>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="budget-month" className="text-sm font-medium">Month</label>
            <input
              id="budget-month"
              name="month"
              type="month"
              required
              defaultValue={currentMonthStr()}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="budget-amount" className="text-sm font-medium">Limit Amount</label>
            <AmountInput id="budget-amount" name="amount" required />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <SaveButton
            pending={pending}
            label="Save Budget"
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
          />
        </form>
      </Modal>

      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
    </>
  );
}
