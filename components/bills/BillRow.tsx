"use client";

import { useActionState, useRef, useState } from "react";
import { updateBill, markBillPaid, deleteBill } from "@/app/(app)/bills/actions";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { formatIDR } from "@/lib/format";
import { todayStr } from "@/lib/date";

type Category = { id: string; name: string };

type Bill = {
  id: string;
  name: string;
  amount: number | null;
  due_day: number | null;
  category_id: string | null;
  last_paid_date: string | null;
  is_active: boolean;
};

export function BillRow({ bill, categories }: { bill: Bill; categories: Category[] }) {
  const [editOpen, setEditOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    updateBill.bind(null, bill.id),
    { error: null }
  );

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const paidThisMonth = bill.last_paid_date?.startsWith(currentMonth) ?? false;

  const isDueSoon =
    !paidThisMonth &&
    bill.due_day != null &&
    bill.due_day >= currentDay &&
    bill.due_day - currentDay <= 5;
  const isOverdue =
    !paidThisMonth &&
    bill.due_day != null &&
    bill.due_day < currentDay;

  async function handleMarkPaid() {
    await markBillPaid(bill.id, todayStr());
  }

  async function handleDelete() {
    await deleteBill(bill.id);
  }

  async function handleEdit(formData: FormData) {
    await action(formData);
    setEditOpen(false);
  }

  return (
    <>
      <div className={`rounded-xl border p-4 ${isOverdue ? "border-red-200 bg-red-50" : isDueSoon ? "border-amber-200 bg-amber-50" : "border-neutral-200"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{bill.name}</p>
              {paidThisMonth && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">✓ Paid</span>
              )}
              {isOverdue && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Overdue</span>
              )}
              {isDueSoon && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Due soon</span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
              {bill.amount != null && <span>{formatIDR(bill.amount)}</span>}
              {bill.due_day != null && <span>· Due: {bill.due_day}th</span>}
              {bill.last_paid_date && <span>· Last paid: {bill.last_paid_date}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 items-end">
            {!paidThisMonth && (
              <button
                onClick={handleMarkPaid}
                className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700"
              >
                Mark Paid
              </button>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Bill">
        <form ref={formRef} action={handleEdit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`bn-${bill.id}`} className="text-sm font-medium">Name</label>
            <input id={`bn-${bill.id}`} name="name" required defaultValue={bill.name} className={FIELD_CLASS} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`ba-${bill.id}`} className="text-sm font-medium">Amount (optional)</label>
            <AmountInput id={`ba-${bill.id}`} name="amount" defaultValue={bill.amount ?? undefined} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`bd-${bill.id}`} className="text-sm font-medium">Due Day (optional)</label>
            <input id={`bd-${bill.id}`} name="due_day" type="number" min={1} max={31} defaultValue={bill.due_day ?? ""} className={FIELD_CLASS} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`bc-${bill.id}`} className="text-sm font-medium">Category (optional)</label>
            <div className="relative">
              <select id={`bc-${bill.id}`} name="category_id" defaultValue={bill.category_id ?? ""} className={SELECT_CLASS} style={SELECT_CHEVRON}>
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {state.error && <p className="text-sm text-red-500">{state.error}</p>}

          <button type="submit" disabled={pending} className="rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {pending ? "Saving..." : "Save"}
          </button>
          <ConfirmDeleteButton onConfirm={handleDelete} label="Delete Bill" />
        </form>
      </Modal>
    </>
  );
}
