"use client";

import { useActionState, useRef, useState } from "react";
import { createDebt } from "@/app/(app)/debts/actions";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";

type Profile = { id: string; display_name: string };

export function AddDebtForm({ profiles }: { profiles: Profile[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createDebt, { error: null });

  async function handleAction(formData: FormData) {
    await action(formData);
    formRef.current?.reset();
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium"
      >
        + Add Debt
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Debt">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="debt-lender" className="text-sm font-medium">Lender (who lent)</label>
            <div className="relative">
              <select id="debt-lender" name="lender_id" required className={SELECT_CLASS} style={SELECT_CHEVRON}>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="debt-borrower" className="text-sm font-medium">Borrower (who owes)</label>
            <div className="relative">
              <select id="debt-borrower" name="borrower_id" required className={SELECT_CLASS} style={SELECT_CHEVRON}>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="debt-amount" className="text-sm font-medium">Amount</label>
            <AmountInput id="debt-amount" name="amount" required />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="debt-desc" className="text-sm font-medium">Description (optional)</label>
            <input id="debt-desc" name="description" className={FIELD_CLASS} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="debt-due" className="text-sm font-medium">Due Date (optional)</label>
            <input id="debt-due" name="due_date" type="date" className={FIELD_CLASS} />
          </div>

          {state.error && <p className="text-sm text-red-500">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Saving..." : "Add Debt"}
          </button>
        </form>
      </Modal>
    </>
  );
}
