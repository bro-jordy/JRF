"use client";

import { useRef, useState } from "react";
import { updateTransaction, deleteTransaction } from "@/app/(app)/transactions/actions";
import { formatIDR } from "@/lib/format";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { Toggle } from "@/components/ui/Toggle";

type Account = { id: string; name: string };
type Category = { id: string; name: string; type: "income" | "expense" };
type SavingGoal = { id: string; name: string };

type Transaction = {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string | null;
  transaction_date: string;
  account_id: string;
  destination_account_id: string | null;
  category_id: string | null;
  saving_goal_id: string | null;
  is_recurring: boolean;
};

const TYPES = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
];

export function TransactionRow({
  transaction,
  accounts,
  categories,
  savingGoals,
  label,
  sublabel,
  amountColor,
  amountSign,
}: {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  savingGoals: SavingGoal[];
  label: string;
  sublabel: string | null;
  amountColor: string;
  amountSign: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(transaction.type);
  const [isRecurring, setIsRecurring] = useState(transaction.is_recurring);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const filteredCategories = categories.filter((c) => c.type === type);

  async function handleAction(formData: FormData) {
    setPending(true);
    const result = await updateTransaction(transaction.id, { error: null }, formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setError(null);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-neutral-200 p-4 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{label}</p>
            {transaction.is_recurring && (
              <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">↻</span>
            )}
          </div>
          {sublabel && <p className="text-xs text-neutral-500">{sublabel}</p>}
          <p className="text-xs text-neutral-400">{transaction.transaction_date}</p>
        </div>
        <p className={`text-sm font-semibold ${amountColor}`}>
          {amountSign}
          {formatIDR(transaction.amount)}
        </p>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Transaction">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`type-${transaction.id}`} className="text-sm font-medium">
              Type
            </label>
            <select
              id={`type-${transaction.id}`}
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as Transaction["type"])}
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
            <label htmlFor={`account-${transaction.id}`} className="text-sm font-medium">
              {type === "transfer" ? "From Account" : "Account"}
            </label>
            <select
              id={`account-${transaction.id}`}
              name="account_id"
              required
              defaultValue={transaction.account_id}
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
                <label htmlFor={`dest-${transaction.id}`} className="text-sm font-medium">
                  To Account
                </label>
                <select
                  id={`dest-${transaction.id}`}
                  name="destination_account_id"
                  required
                  defaultValue={transaction.destination_account_id ?? ""}
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
                  <label htmlFor={`goal-${transaction.id}`} className="text-sm font-medium">
                    Saving Goal (optional)
                  </label>
                  <select
                    id={`goal-${transaction.id}`}
                    name="saving_goal_id"
                    defaultValue={transaction.saving_goal_id ?? ""}
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
              <label htmlFor={`category-${transaction.id}`} className="text-sm font-medium">
                Category
              </label>
              <select
                id={`category-${transaction.id}`}
                name="category_id"
                required
                defaultValue={transaction.category_id ?? ""}
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

          <AmountInput
            id={`amount-${transaction.id}`}
            name="amount"
            label="Amount"
            defaultValue={transaction.amount}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor={`date-${transaction.id}`} className="text-sm font-medium">
              Date
            </label>
            <input
              id={`date-${transaction.id}`}
              name="transaction_date"
              type="date"
              required
              defaultValue={transaction.transaction_date}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`desc-${transaction.id}`} className="text-sm font-medium">
              Description (optional)
            </label>
            <input
              id={`desc-${transaction.id}`}
              name="description"
              defaultValue={transaction.description ?? ""}
              className={FIELD_CLASS}
            />
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
            className="mt-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>

          <ConfirmDeleteButton
            onConfirm={async () => {
              await deleteTransaction(transaction.id);
              setOpen(false);
            }}
          />
        </form>
      </Modal>
    </>
  );
}
