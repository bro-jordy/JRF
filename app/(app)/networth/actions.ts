"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentMonthStr } from "@/lib/date";

export type NetWorthFormState = { error: string | null };

export async function takeSnapshot(): Promise<NetWorthFormState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) return { error: "No household found." };

  const hhId = membership.household_id;

  const [{ data: accounts }, { data: balances }, { data: holdings }] = await Promise.all([
    supabase.from("accounts").select("id, is_liability").eq("is_archived", false),
    supabase.from("account_balances").select("account_id, balance"),
    supabase.from("investment_holdings").select("current_value").eq("household_id", hhId),
  ]);

  const balanceByAccount = new Map((balances ?? []).map((b) => [b.account_id, b.balance]));

  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const acc of accounts ?? []) {
    const bal = balanceByAccount.get(acc.id) ?? 0;
    if (acc.is_liability) totalLiabilities += bal;
    else totalAssets += bal;
  }

  // Add investment current values to assets
  for (const h of holdings ?? []) {
    totalAssets += h.current_value;
  }

  const netWorth = totalAssets - totalLiabilities;

  const { error } = await supabase.from("net_worth_snapshots").upsert(
    {
      household_id: hhId,
      snapshot_month: currentMonthStr(),
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      net_worth: netWorth,
    },
    { onConflict: "household_id,snapshot_month" }
  );

  if (error) return { error: error.message };
  revalidatePath("/networth");
  return { error: null };
}
