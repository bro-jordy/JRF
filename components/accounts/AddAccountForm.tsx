"use client";

import { useRef, useState } from "react";
import { createAccount } from "@/app/(app)/accounts/actions";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS, SELECT_CLASS, SELECT_CHEVRON } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { SaveButton } from "@/components/ui/SaveButton";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { saveWithFeedback } from "@/lib/hooks/saveForm";
import { ACCOUNT_TYPES } from "@/lib/account-types";

export function AddAccountForm({
  owners,
}: {
  owners: { id: string; display_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("bank");
  const [isMain, setIsMain] = useState(false);
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
      const result = await saveWithFeedback(() => createAccount({ error: null }, formData), {
        entity: "akun",
        setToast,
        onSuccess: () => {
          formRef.current?.reset();
          setType("bank");
          setIsMain(false);
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
        + Add Account
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Account">
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
            <select
              id="type"
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
            <label htmlFor="owner_id" className="text-sm font-medium">
              Owner
            </label>
            <select
              id="owner_id"
              name="owner_id"
              required
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
            id="opening_balance"
            name="opening_balance"
            label={type === "credit_card" ? "Opening Outstanding" : "Opening Balance"}
          />

          {type === "credit_card" && (
            <AmountInput id="credit_limit" name="credit_limit" label="Credit Limit" />
          )}

          <Toggle
            checked={isMain}
            onChange={setIsMain}
            label="Jadikan Akun Utama"
            name="is_main"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <SaveButton pending={pending} />
        </form>
      </Modal>

      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
    </>
  );
}
