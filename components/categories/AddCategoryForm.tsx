"use client";

import { useRef, useState } from "react";
import { createCategory } from "@/app/(app)/categories/actions";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";

export function AddCategoryForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium"
      >
        + Add Category
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Category">
        <form
          ref={formRef}
          action={async (formData) => {
            await createCategory(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="flex flex-col gap-3"
        >
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

          <button
            type="submit"
            className="mt-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
          >
            Save
          </button>
        </form>
      </Modal>
    </>
  );
}
