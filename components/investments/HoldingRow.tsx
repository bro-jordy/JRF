"use client";

import { useRef, useState } from "react";
import { updateHoldingValue, deleteHolding } from "@/app/(app)/investments/actions";
import { AmountInput } from "@/components/ui/AmountInput";
import { FIELD_CLASS } from "@/components/ui/form-styles";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { SaveButton } from "@/components/ui/SaveButton";
import { Toast, type ToastState } from "@/components/ui/Toast";
import { saveWithFeedback } from "@/lib/hooks/saveForm";
import { formatIDR } from "@/lib/format";
import Link from "next/link";

type Holding = {
  id: string;
  name: string;
  ticker: string | null;
  current_value: number;
  owner_name: string;
  total_invested: number;
};

export function HoldingRow({ holding }: { holding: Holding }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);

  const gainLoss = holding.current_value - holding.total_invested;
  const gainPct = holding.total_invested > 0
    ? ((gainLoss / holding.total_invested) * 100).toFixed(1)
    : null;
  const isGain = gainLoss >= 0;

  async function handleAction(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPending(true);

    try {
      const result = await saveWithFeedback(
        () => updateHoldingValue(holding.id, { error: null }, formData),
        {
          entity: "investasi",
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

  async function handleDelete() {
    await deleteHolding(holding.id);
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 p-4">
        <Link href={`/investments/${holding.id}`} className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{holding.name}</p>
            {holding.ticker && (
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
                {holding.ticker}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400">{holding.owner_name}</p>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="font-semibold">{formatIDR(holding.current_value)}</span>
            {gainPct !== null && (
              <span className={`text-xs ${isGain ? "text-emerald-600" : "text-red-500"}`}>
                {isGain ? "+" : ""}{formatIDR(gainLoss)} ({isGain ? "+" : ""}{gainPct}%)
              </span>
            )}
          </div>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="ml-3 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs"
        >
          Edit
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Holding">
        <form ref={formRef} action={handleAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`hn-${holding.id}`} className="text-sm font-medium">Name</label>
            <input id={`hn-${holding.id}`} name="name" required defaultValue={holding.name} className={FIELD_CLASS} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`ht-${holding.id}`} className="text-sm font-medium">Ticker (optional)</label>
            <input id={`ht-${holding.id}`} name="ticker" defaultValue={holding.ticker ?? ""} className={FIELD_CLASS} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`hv-${holding.id}`} className="text-sm font-medium">Current Market Value</label>
            <AmountInput id={`hv-${holding.id}`} name="current_value" required defaultValue={holding.current_value} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <SaveButton
            pending={pending}
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
          />

          <ConfirmDeleteButton onConfirm={handleDelete} label="Delete Holding" />
        </form>
      </Modal>

      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
    </>
  );
}
