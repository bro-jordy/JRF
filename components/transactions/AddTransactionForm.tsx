"use client";

import { useRef, useState } from "react";
import { createTransaction } from "@/app/(app)/transactions/actions";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { Toast, Spinner, type ToastState } from "@/components/ui/Toast";
import { todayStr } from "@/lib/date";

type Account = { id: string; name: string };
type Category = { id: string; name: string; type: "income" | "expense" };
type SavingGoal = { id: string; name: string };

const TYPES = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
];

export function AddTransactionForm({
  accounts,
  categories,
  savingGoals,
  defaultAccountId,
}: {
  accounts: Account[];
  categories: Category[];
  savingGoals: SavingGoal[];
  defaultAccountId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("expense");
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);

  async function handleAction(formData: FormData) {
    // Belt-and-suspenders against double taps: the disabled attribute below
    // covers the common case, but this ref check is synchronous and closes
    // the race window a fast double-tap can slip through before React
    // re-renders the disabled button.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPending(true);

    try {
      const result = await createTransaction({ error: null }, formData);

      if (result.error) {
        setError(result.error);
        setToast({ message: "Gagal simpan transaksi", variant: "error" });
        return;
      }

      setError(null);
      setToast({ message: "Sukses simpan transaksi", variant: "success" });
      formRef.current?.reset();
      setType("expense");
      setOpen(false);
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Add Transaction"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
          <path d="M10 3.5a.75.75 0 0 1 .75.75v5h5a.75.75 0 0 1 0 1.5h-5v5a.75.75 0 0 1-1.5 0v-5h-5a.75.75 0 0 1 0-1.5h5v-5A.75.75 0 0 1 10 3.5Z" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Transaction">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="type" className="text-sm font-medium">
              Type
            </label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={SELECT_CLASS}
              style={SELECT_CHEVRON}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="account_id" className="text-sm font-medium">
              {type === "transfer" ? "From Account" : "Account"}
            </label>
            <select
              id="account_id"
              name="account_id"
              required
              defaultValue={defaultAccountId}
              className={SELECT_CLASS}
              style={SELECT_CHEVRON}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {type === "transfer" ? (
            <>
              <div className="flex flex-col gap-1">
                <label htmlFor="destination_account_id" className="text-sm font-medium">
                  To Account
                </label>
                <select
                  id="destination_account_id"
                  name="destination_account_id"
                  required
                  className={SELECT_CLASS}
                  style={SELECT_CHEVRON}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {savingGoals.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="saving_goal_id" className="text-sm font-medium">
                    Saving Goal (optional)
                  </label>
                  <select
                    id="saving_goal_id"
                    name="saving_goal_id"
                    defaultValue=""
                    className={SELECT_CLASS}
                    style={SELECT_CHEVRON}
                  >
                    <option value="">None</option>
                    {savingGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <label htmlFor="category_id" className="text-sm font-medium">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                required
                className={SELECT_CLASS}
                style={SELECT_CHEVRON}
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <AmountInput id="amount" name="amount" label="Amount" />

          <div className="flex flex-col gap-1">
            <label htmlFor="transaction_date" className="text-sm font-medium">
              Date
            </label>
            <input
              id="transaction_date"
              name="transaction_date"
              type="date"
              required
              defaultValue={todayStr()}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </label>
            <input id="description" name="description" className={FIELD_CLASS} />
          </div>

          <Toggle
            label="Recurring monthly"
            name="is_recurring"
            checked={isRecurring}
            onChange={setIsRecurring}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending && <Spinner />}
            {pending ? "Saving..." : "Save"}
          </button>
        </form>
      </Modal>

      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
    </>
  );
}
