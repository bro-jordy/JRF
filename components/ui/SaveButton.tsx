"use client";

import { Spinner } from "@/components/ui/Toast";

export function SaveButton({
  pending,
  label = "Save",
  pendingLabel = "Saving...",
  className = "mt-1 flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50",
}: {
  pending: boolean;
  label?: string;
  pendingLabel?: string;
  className?: string;
}) {
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Spinner />}
      {pending ? pendingLabel : label}
    </button>
  );
}
