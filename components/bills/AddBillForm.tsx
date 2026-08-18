"use client";

import { useRef, useState } from "react";
import { createBill } from "@/app/(app)/bills/actions";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { SaveButton } from "@/components/ui/SaveButton";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { saveWithFeedback } from "@/lib/hooks/saveForm";

type Category = { id: string; name: string };

export function AddBillForm({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);

  async function handleAction(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPending(true);

    try {
      const result = await saveWithFeedback(() => createBill({ error: null }, formData), {
        entity: "tagihan",
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
        + Add Bill
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Bill">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="bill-name" className="text-sm font-medium">Bill Name</label>
            <input id="bill-name" name="name" required placeholder="e.g. Listrik PLN" className={FIELD_CLASS} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="bill-amount" className="text-sm font-medium">
              Amount <span className="text-xs text-neutral-400">(optional)</span>
            </label>
            <AmountInput id="bill-amount" name="amount" />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="bill-due-day" className="text-sm font-medium">
              Due Day of Month <span className="text-xs text-neutral-400">(optional)</span>
            </label>
            <input
              id="bill-due-day"
              name="due_day"
              type="number"
              min={1}
              max={31}
              placeholder="e.g. 20"
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="bill-category" className="text-sm font-medium">
              Category <span className="text-xs text-neutral-400">(optional)</span>
            </label>
            <div className="relative">
              <select id="bill-category" name="category_id" className={SELECT_CLASS} style={SELECT_CHEVRON}>
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <SaveButton
            pending={pending}
            label="Add Bill"
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
          />
        </form>
      </Modal>

      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
    </>
  );
}
