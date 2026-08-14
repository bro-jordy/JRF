"use client";

import { useActionState, useRef, useState } from "react";
import { createHolding } from "@/app/(app)/investments/actions";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";

export function AddHoldingForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createHolding, { error: null });

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
        + Add Holding
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Investment">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="holding-name" className="text-sm font-medium">Name</label>
            <input id="holding-name" name="name" required placeholder="e.g. Bank Mandiri (BMRI)" className={FIELD_CLASS} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="holding-ticker" className="text-sm font-medium">Ticker (optional)</label>
            <input id="holding-ticker" name="ticker" placeholder="e.g. BMRI" className={FIELD_CLASS} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="holding-value" className="text-sm font-medium">Current Market Value</label>
            <AmountInput id="holding-value" name="current_value" required />
          </div>

          {state.error && <p className="text-sm text-red-500">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Saving..." : "Add Investment"}
          </button>
        </form>
      </Modal>
    </>
  );
}
