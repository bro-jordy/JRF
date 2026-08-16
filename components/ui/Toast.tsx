"use client";

import { useEffect } from "react";

export type ToastState = { message: string; variant: "success" | "error" };

export function Toast({ toast, onDone }: { toast: ToastState; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 flex justify-center">
      <div
        className={`rounded-lg border bg-white px-4 py-2 text-sm font-medium shadow-lg ${
          toast.variant === "success"
            ? "border-emerald-200 text-emerald-600"
            : "border-red-200 text-red-600"
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} animate-spin`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
