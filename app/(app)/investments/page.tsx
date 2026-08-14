import { createClient } from "@/lib/supabase/server";
import { AddHoldingForm } from "@/components/investments/AddHoldingForm";
import { HoldingRow } from "@/components/investments/HoldingRow";
import { BackLink } from "@/components/ui/BackLink";
import { formatIDR } from "@/lib/format";

export default async function InvestmentsPage() {
  const supabase = await createClient();

  const [{ data: holdings }, { data: entries }, { data: profiles }] = await Promise.all([
    supabase.from("investment_holdings").select("id, name, ticker, current_value, owner_id").order("name"),
    supabase.from("investment_entries").select("holding_id, amount"),
    supabase.from("profiles").select("id, display_name"),
  ]);

  const profileNameById = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

  // total invested per holding
  const investedByHolding = new Map<string, number>();
  for (const e of entries ?? []) {
    investedByHolding.set(e.holding_id, (investedByHolding.get(e.holding_id) ?? 0) + e.amount);
  }

  const holdingList = (holdings ?? []).map((h) => ({
    ...h,
    owner_name: profileNameById.get(h.owner_id) ?? "Unknown",
    total_invested: investedByHolding.get(h.id) ?? 0,
  }));

  const totalCurrentValue = holdingList.reduce((s, h) => s + h.current_value, 0);
  const totalInvested = holdingList.reduce((s, h) => s + h.total_invested, 0);
  const totalGainLoss = totalCurrentValue - totalInvested;
  const isGain = totalGainLoss >= 0;

  // group by owner
  const byOwner = new Map<string, typeof holdingList>();
  for (const h of holdingList) {
    const list = byOwner.get(h.owner_id) ?? [];
    list.push(h);
    byOwner.set(h.owner_id, list);
  }

  return (
    <main className="flex flex-col gap-6 px-4 pt-6 pb-24">
      <div className="flex items-center gap-3">
        <BackLink href="/more" />
        <h1 className="text-xl font-semibold">Investments</h1>
      </div>

      {holdingList.length > 0 && (
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Total Portfolio</p>
          <p className="mt-1 text-2xl font-semibold">{formatIDR(totalCurrentValue)}</p>
          {totalInvested > 0 && (
            <p className={`mt-1 text-sm ${isGain ? "text-emerald-600" : "text-red-500"}`}>
              {isGain ? "+" : ""}{formatIDR(totalGainLoss)} vs invested {formatIDR(totalInvested)}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{holdingList.length} holdings</p>
        <AddHoldingForm />
      </div>

      {holdingList.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">No investments yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {[...byOwner.entries()].map(([ownerId, ownerHoldings]) => (
            <section key={ownerId} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-neutral-500">
                {profileNameById.get(ownerId) ?? "Unknown"}
              </h2>
              {ownerHoldings.map((h) => (
                <HoldingRow key={h.id} holding={h} />
              ))}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
