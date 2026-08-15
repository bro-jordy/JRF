// Supabase Edge Function: monthly-maintenance
// Schedule: 1st of every month (a few minutes after create-recurring-transactions)
// 1. Refreshes investment_holdings.current_value for every holding with a ticker
// 2. Writes a net_worth_snapshots row for every household for the current month

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function fetchPrice(ticker: string): Promise<number | null> {
  // Try IDX (.JK suffix) first, fallback to bare ticker — mirrors the manual
  // "Update Price" button in the app (app/(app)/investments/actions.ts).
  const suffixes = [".JK", ""];
  for (const suffix of suffixes) {
    try {
      const symbol = encodeURIComponent(`${ticker}${suffix}`);
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      if (!res.ok) continue;
      const json = await res.json();
      const p = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (p != null) return p;
    } catch {
      continue;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (authHeader && authHeader !== `Bearer ${serviceKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = { pricesUpdated: 0, priceErrors: 0, snapshotsWritten: 0 };

  // ── 1. Refresh investment prices ────────────────────────────────────────
  const { data: holdings } = await supabase
    .from("investment_holdings")
    .select("id, ticker")
    .not("ticker", "is", null);

  for (const h of holdings ?? []) {
    if (!h.ticker) continue;
    const price = await fetchPrice(h.ticker);
    if (price == null) {
      results.priceErrors++;
      continue;
    }

    const { data: entries } = await supabase
      .from("investment_entries")
      .select("units")
      .eq("holding_id", h.id);
    const totalUnits = (entries ?? []).reduce((s, e) => s + (e.units ?? 0), 0);
    const newValue = totalUnits > 0 ? price * totalUnits : price;

    const { error } = await supabase
      .from("investment_holdings")
      .update({ current_value: newValue })
      .eq("id", h.id);
    if (!error) results.pricesUpdated++;
  }

  // ── 2. Net worth snapshot per household ─────────────────────────────────
  const { data: households } = await supabase.from("households").select("id");
  const now = new Date();
  const snapshotMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const appUrl = Deno.env.get("APP_URL") ?? "https://jrf.jordyrea.my.id";

  for (const hh of households ?? []) {
    const [{ data: accounts }, { data: balances }, { data: hhHoldings }] = await Promise.all([
      supabase
        .from("accounts")
        .select("id, is_liability")
        .eq("household_id", hh.id)
        .eq("is_archived", false),
      supabase.from("account_balances").select("account_id, balance").eq("household_id", hh.id),
      supabase.from("investment_holdings").select("current_value").eq("household_id", hh.id),
    ]);

    const balanceByAccount = new Map((balances ?? []).map((b) => [b.account_id, b.balance]));
    let totalAssets = 0;
    let totalLiabilities = 0;
    for (const acc of accounts ?? []) {
      const bal = balanceByAccount.get(acc.id) ?? 0;
      if (acc.is_liability) totalLiabilities += bal;
      else totalAssets += bal;
    }
    for (const h of hhHoldings ?? []) totalAssets += h.current_value;
    const netWorth = totalAssets - totalLiabilities;

    const { error } = await supabase.from("net_worth_snapshots").upsert(
      {
        household_id: hh.id,
        snapshot_month: snapshotMonth,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: netWorth,
      },
      { onConflict: "household_id,snapshot_month" }
    );

    if (!error) {
      results.snapshotsWritten++;
      await fetch(`${appUrl}/api/push/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({
          household_id: hh.id,
          title: "📊 Net Worth Snapshot Saved",
          body: `${snapshotMonth} net worth recorded automatically.`,
          url: "/networth",
        }),
      }).catch(() => {});
    }
  }

  return new Response(JSON.stringify({ ok: true, ...results }), { status: 200 });
});
