"use client";

import { useRef, useState } from "react";
import { updateCategory, archiveCategory, restoreCategory } from "@/app/(app)/categories/actions";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { SaveButton } from "@/components/ui/SaveButton";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { saveWithFeedback } from "@/lib/hooks/saveForm";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  is_archived: boolean;
};

export function CategoryRow({ category }: { category: Category }) {
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
        () => updateCategory(category.id, { error: null }, formData),
        {
          entity: "kategori",
          setToast,
          onSuccess: () => setOpen(false),
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
        className="flex w-full items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 text-left"
      >
        <span className="text-sm font-medium">{category.name}</span>
        <span
          className={`text-xs font-medium ${
            category.type === "income" ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {category.type}
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Category">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`name-${category.id}`} className="text-sm font-medium">
              Name
            </label>
            <input
              id={`name-${category.id}`}
              name="name"
              required
              defaultValue={category.name}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`type-${category.id}`} className="text-sm font-medium">
              Type
            </label>
            <select
              id={`type-${category.id}`}
              name="type"
              defaultValue={category.type}
              className={SELECT_CLASS}
              style={SELECT_CHEVRON}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <SaveButton
              pending={pending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            />
            {category.is_archived ? (
              <button
                type="button"
                onClick={async () => {
                  await restoreCategory(category.id);
                  setOpen(false);
                }}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium"
              >
                Restore
              </button>
            ) : (
              <ConfirmDeleteButton
                label="Archive"
                onConfirm={async () => {
                  await archiveCategory(category.id);
                  setOpen(false);
                }}
              />
            )}
          </div>
        </form>
      </Modal>

      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
    </>
  );
}
