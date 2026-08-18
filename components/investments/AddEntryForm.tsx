"use client";

import { useRef, useState } from "react";
import { addEntry } from "@/app/(app)/investments/actions";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { SaveButton } from "@/components/ui/SaveButton";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { saveWithFeedback } from "@/lib/hooks/saveForm";
import { todayStr } from "@/lib/date";

export function AddEntryForm({ holdingId }: { holdingId: string }) {
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
      const result = await saveWithFeedback(
        () => addEntry(holdingId, { error: null }, formData),
        {
          entity: "entry investasi",
          setToast,
          onSuccess: () => {
            formRef.current?.reset();
            setOpen(false);
          },
        }
      );
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
        + Add Entry
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Entry">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="entry-amount" className="text-sm font-medium">
              Amount <span className="text-xs text-neutral-400">(negative = sell)</span>
            </label>
            <AmountInput id="entry-amount" name="amount" required />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="entry-units" className="text-sm font-medium">
              Units / Lots <span className="text-xs text-neutral-400">(optional)</span>
            </label>
            <input
              id="entry-units"
              name="units"
              type="number"
              step="any"
              placeholder="e.g. 10"
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="entry-date" className="text-sm font-medium">Date</label>
            <input
              id="entry-date"
              name="entry_date"
              type="date"
              required
              defaultValue={todayStr()}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="entry-note" className="text-sm font-medium">
              Note <span className="text-xs text-neutral-400">(optional)</span>
            </label>
            <input id="entry-note" name="note" className={FIELD_CLASS} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <SaveButton
            pending={pending}
            label="Save Entry"
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
          />
        </form>
      </Modal>

      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
    </>
  );
}
