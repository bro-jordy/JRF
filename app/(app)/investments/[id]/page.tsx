import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/ui/BackLink";
import { AddEntryForm } from "@/components/investments/AddEntryForm";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { formatIDR } from "@/lib/format";
import { deleteEntry } from "@/app/(app)/investments/actions";

type Props = { params: Promise<{ id: string }> };

export default async function InvestmentDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: holding }, { data: entries }] = await Promise.all([
    supabase
      .from("investment_holdings")
      .select("id, name, ticker, current_value, owner_id")
      .eq("id", id)
      .single(),
    supabase
      .from("investment_entries")
      .select("id, amount, units, note, entry_date")
      .eq("holding_id", id)
      .order("entry_date", { ascending: false }),
  ]);

  if (!holding) notFound();

  const totalInvested = (entries ?? []).reduce((s, e) => s + e.amount, 0);
  const gainLoss = holding.current_value - totalInvested;
  const gainPct = totalInvested > 0 ? ((gainLoss / totalInvested) * 100).toFixed(1) : null;
  const isGain = gainLoss >= 0;

  return (
    <main className="flex flex-col gap-6 px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackLink href="/investments" />
        <div>
          <h1 className="text-xl font-semibold">{holding.name}</h1>
          {holding.ticker && (
            <span className="text-xs text-neutral-400">{holding.ticker}</span>
          )}
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-neutral-200 p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-neutral-500">Market Value</p>
            <p className="text-2xl font-semibold">{formatIDR(holding.current_value)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Invested</p>
            <p className="text-sm font-medium">{formatIDR(totalInvested)}</p>
          </div>
        </div>
        {gainPct !== null && (
          <div className={`rounded-lg px-3 py-2 text-sm font-medium ${isGain ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {isGain ? "▲" : "▼"} {isGain ? "+" : ""}{formatIDR(gainLoss)} ({isGain ? "+" : ""}{gainPct}%)
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">History</h2>
        <AddEntryForm holdingId={holding.id} />
      </div>

      {(entries ?? []).length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">No entries yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {(entries ?? []).map((e) => {
            const isBuy = e.amount >= 0;
            async function handleDelete() {
              "use server";
              await deleteEntry(e.id, id);
            }
            return (
              <div key={e.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isBuy ? "text-emerald-600" : "text-red-500"}`}>
                      {isBuy ? "+" : ""}{formatIDR(e.amount)}
                    </span>
                    {e.units != null && (
                      <span className="text-xs text-neutral-400">{e.units} units</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-neutral-400">{e.entry_date}</span>
                    {e.note && <span className="text-xs text-neutral-500">· {e.note}</span>}
                  </div>
                </div>
                <ConfirmDeleteButton onConfirm={handleDelete} label="Delete" />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
