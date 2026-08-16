"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Renderless — subscribes to transactions changes for this household and
 * calls router.refresh() so Home/Transactions re-fetch live instead of
 * needing a manual page reload. Mount once per page.
 */
export function RealtimeTransactionsRefresher({ householdId }: { householdId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`transactions-changes-${householdId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `household_id=eq.${householdId}`,
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, router]);

  return null;
}
