"use client";

import { useRef, useState } from "react";
import { updateCategory, archiveCategory, restoreCategory } from "@/app/(app)/categories/actions";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  is_archived: boolean;
};

export function CategoryRow({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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
        <form
          ref={formRef}
          action={async (formData) => {
            await updateCategory(category.id, formData);
            setOpen(false);
          }}
          className="flex flex-col gap-3"
        >
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

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
            >
              Save
            </button>
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
    </>
  );
}
