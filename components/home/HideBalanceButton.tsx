"use client";

import { useBalanceVisibility } from "@/components/home/BalanceVisibilityContext";

export function HideBalanceButton() {
  const { hidden, toggle } = useBalanceVisibility();

  return (
    <button
      onClick={toggle}
      aria-label={hidden ? "Show balance" : "Hide balance"}
      className="flex h-8 w-8 items-center justify-center text-neutral-400"
    >
      {hidden ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path
            fillRule="evenodd"
            d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.29 10.29 0 0 0 3.296-3.836.75.75 0 0 0 0-.68A10.75 10.75 0 0 0 10 3.5c-1.363 0-2.66.29-3.836.812L3.28 2.22ZM7.53 6.47l1.15 1.15a2.5 2.5 0 0 1 3.7 3.7l1.15 1.15a4 4 0 0 0-5.999-5.999ZM4.582 7.696 6.6 9.714a4 4 0 0 0 5.686 5.686l1.618 1.618A10.72 10.72 0 0 1 10 18.5a10.75 10.75 0 0 1-9.05-4.938.75.75 0 0 1 0-.68 10.3 10.3 0 0 1 3.632-3.186Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path d="M10 3.5c-4.575 0-8.268 3.13-9.542 6.938a.75.75 0 0 0 0 .524C1.732 14.77 5.425 17.9 10 17.9s8.268-3.13 9.542-6.938a.75.75 0 0 0 0-.524C18.268 6.63 14.575 3.5 10 3.5Zm0 11.4a4.9 4.9 0 1 1 0-9.8 4.9 4.9 0 0 1 0 9.8Zm0-7.8a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Z" />
        </svg>
      )}
    </button>
  );
}
