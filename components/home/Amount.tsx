"use client";

import { formatIDR } from "@/lib/format";
import { useBalanceVisibility } from "@/components/home/BalanceVisibilityContext";

export function Amount({ value, className }: { value: number; className?: string }) {
  const { hidden } = useBalanceVisibility();
  return <span className={className}>{hidden ? "Rp ••••••" : formatIDR(value)}</span>;
}
