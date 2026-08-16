"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-3H9v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" />
    </svg>
  );
}

function TransactionsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M4 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4Zm2 4a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm0 4a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2H7Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const ITEMS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/transactions", label: "Transactions", Icon: TransactionsIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 flex border-t border-neutral-200 bg-white">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] text-center text-xs font-medium ${
              active ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
