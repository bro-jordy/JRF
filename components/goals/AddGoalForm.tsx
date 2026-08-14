"use client";

import { useRef, useState } from "react";
import { createGoal } from "@/app/(app)/goals/actions";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";

export function AddGoalForm() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium"
      >
        + Add Goal
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Goal">
        <form
          ref={formRef}
          action={async (formData) => {
            await createGoal(formData);
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

          <AmountInput id="target_amount" name="target_amount" label="Target Amount" />

          <div className="flex flex-col gap-1">
            <label htmlFor="target_date" className="text-sm font-medium">
              Target Date (optional)
            </label>
            <input id="target_date" name="target_date" type="date" className={FIELD_CLASS} />
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
