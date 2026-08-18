"use client";

import { useRef, useState } from "react";
import { createCategory } from "@/app/(app)/categories/actions";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { SaveButton } from "@/components/ui/SaveButton";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { saveWithFeedback } from "@/lib/hooks/saveForm";

export function AddCategoryForm() {
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
      const result = await saveWithFeedback(() => createCategory({ error: null }, formData), {
        entity: "kategori",
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
        + Add Category
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Category">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input id="name" name="name" required className={FIELD_CLASS} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="type" className="text-sm font-medium">
              Type
            </label>
            <select id="type" name="type" required className={SELECT_CLASS} style={SELECT_CHEVRON}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <SaveButton pending={pending} />
        </form>
      </Modal>

      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
    </>
  );
}
