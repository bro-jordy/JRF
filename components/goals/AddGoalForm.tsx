"use client";

import { useRef, useState } from "react";
import { createGoal } from "@/app/(app)/goals/actions";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { SaveButton } from "@/components/ui/SaveButton";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { saveWithFeedback } from "@/lib/hooks/saveForm";

export function AddGoalForm() {
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
      const result = await saveWithFeedback(() => createGoal({ error: null }, formData), {
        entity: "goal",
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
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium"
      >
        + Add Goal
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Goal">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input id="name" name="name" required className={FIELD_CLASS} />
          </div>

          <AmountInput id="target_amount" name="target_amount" label="Target Amount" />

          <div className="flex flex-col gap-1">
            <label htmlFor="target_date" className="text-sm font-medium">
              Target Date (optional)
            </label>
            <input id="target_date" name="target_date" type="date" className={FIELD_CLASS} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <SaveButton pending={pending} />
        </form>
      </Modal>

      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
    </>
  );
}
