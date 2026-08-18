"use client";

import { useRef, useState } from "react";
import { updateAccount, archiveAccount } from "@/app/(app)/accounts/actions";
import { formatIDR } from "@/lib/format";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { Toggle } from "@/components/ui/Toggle";
import { SaveButton } from "@/components/ui/SaveButton";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { saveWithFeedback } from "@/lib/hooks/saveForm";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABEL } from "@/lib/account-types";

type Account = {
  id: string;
  name: string;
  type: string;
  owner_id: string;
  is_liability: boolean;
  opening_balance: number;
  credit_limit: number | null;
  is_main: boolean;
};

export function AccountRow({
  account,
  balance,
  owners,
}: {
  account: Account;
  balance: number;
  owners: { id: string; display_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(account.type);
  const [isMain, setIsMain] = useState(account.is_main);
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
        () => updateAccount(account.id, { error: null }, formData),
        {
          entity: "akun",
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
        onClick={() => {
          setType(account.type);
          setIsMain(account.is_main);
          setOpen(true);
        }}
        className="flex w-full items-center justify-between rounded-xl border border-neutral-200 p-4 text-left"
      >
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium">
            {account.name}
            {account.is_main && <span className="text-amber-500">★</span>}
          </p>
          <p className="text-xs text-neutral-500">
            {ACCOUNT_TYPE_LABEL[account.type] ?? account.type}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{formatIDR(balance)}</p>
          {account.credit_limit != null && (
            <p className="text-xs text-neutral-500">limit {formatIDR(account.credit_limit)}</p>
          )}
        </div>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Account">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`name-${account.id}`} className="text-sm font-medium">
              Name
            </label>
            <input
              id={`name-${account.id}`}
              name="name"
              required
              defaultValue={account.name}
              className={FIELD_CLASS}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`type-${account.id}`} className="text-sm font-medium">
              Type
            </label>
            <select
              id={`type-${account.id}`}
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={SELECT_CLASS}
              style={SELECT_CHEVRON}
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`owner-${account.id}`} className="text-sm font-medium">
              Owner
            </label>
            <select
              id={`owner-${account.id}`}
              name="owner_id"
              required
              defaultValue={account.owner_id}
              className={SELECT_CLASS}
              style={SELECT_CHEVRON}
            >
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.display_name}
                </option>
              ))}
            </select>
          </div>

          <AmountInput
            id={`opening_balance-${account.id}`}
            name="opening_balance"
            label={type === "credit_card" ? "Opening Outstanding" : "Opening Balance"}
            defaultValue={account.opening_balance}
          />

          {type === "credit_card" && (
            <AmountInput
              id={`credit_limit-${account.id}`}
              name="credit_limit"
              label="Credit Limit"
              defaultValue={account.credit_limit ?? undefined}
            />
          )}

          <Toggle
            checked={isMain}
            onChange={setIsMain}
            label="Jadikan Akun Utama"
            name="is_main"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <SaveButton pending={pending} />

          <ConfirmDeleteButton
            onConfirm={async () => {
              await archiveAccount(account.id);
              setOpen(false);
            }}
          />
        </form>
      </Modal>

      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
    </>
  );
}
