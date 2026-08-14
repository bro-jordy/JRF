"use client";

import { useState } from "react";

export function ConfirmDeleteButton({
  onConfirm,
  label = "Delete",
}: {
  onConfirm: () => void | Promise<void>;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 p-3">
      <span className="text-sm text-neutral-500">Yakin hapus?</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium"
        >
          Batal
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            await onConfirm();
          }}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "..." : "Ya, hapus"}
        </button>
      </div>
    </div>
  );
}
