"use client";

import { useRef, useState } from "react";
import { updateGoal, archiveGoal } from "@/app/(app)/goals/actions";
import { formatIDR } from "@/lib/format";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";

type GoalProgress = {
  saving_goal_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: string;
};

export function GoalRow({ goal }: { goal: GoalProgress }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const progress =
    goal.target_amount > 0 ? Math.min(goal.current_amount / goal.target_amount, 1) : 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-neutral-200 p-4 text-left"
      >
        <div className="flex justify-between text-sm">
          <span className="font-medium">{goal.name}</span>
          <span className="text-neutral-500">
            {formatIDR(goal.current_amount)} / {formatIDR(goal.target_amount)}
          </span>
        </div>
        {goal.target_date && (
          <p className="mt-0.5 text-xs text-neutral-400">Target: {goal.target_date}</p>
        )}
        <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100">
          <div
            className="h-1.5 rounded-full bg-neutral-900"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Goal">
        <form
          ref={formRef}
          action={async (formData) => {
            await updateGoal(goal.saving_goal_id, formData);
            setOpen(false);
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={`name-${goal.saving_goal_id}`} className="text-sm font-medium">
              Name
            </label>
            <input
              id={`name-${goal.saving_goal_id}`}
              name="name"
              required
              defaultValue={goal.name}
              className={FIELD_CLASS}
            />
          </div>

          <AmountInput
            id={`target-${goal.saving_goal_id}`}
            name="target_amount"
            label="Target Amount"
            defaultValue={goal.target_amount}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor={`date-${goal.saving_goal_id}`} className="text-sm font-medium">
              Target Date (optional)
            </label>
            <input
              id={`date-${goal.saving_goal_id}`}
              name="target_date"
              type="date"
              defaultValue={goal.target_date ?? ""}
              className={FIELD_CLASS}
            />
          </div>

          <button
            type="submit"
            className="mt-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
          >
            Save
          </button>

          <ConfirmDeleteButton
            onConfirm={async () => {
              await archiveGoal(goal.saving_goal_id);
              setOpen(false);
            }}
          />
        </form>
      </Modal>
    </>
  );
}
