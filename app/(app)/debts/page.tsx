import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/ui/BackLink";
import { AddDebtForm } from "@/components/debts/AddDebtForm";
import { DebtRow } from "@/components/debts/DebtRow";
import { formatIDR } from "@/lib/format";

export default async function DebtsPage() {
  const supabase = await createClient();

  const [{ data: debts }, { data: profiles }] = await Promise.all([
    supabase
      .from("debts")
      .select("id, lender_id, borrower_id, amount, description, due_date, is_settled, settled_at")
      .order("is_settled", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name"),
  ]);

  const nameById = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

  const debtList = (debts ?? []).map((d) => ({
    ...d,
    lender_name: nameById.get(d.lender_id) ?? "Unknown",
    borrower_name: nameById.get(d.borrower_id) ?? "Unknown",
  }));

  const unsettled = debtList.filter((d) => !d.is_settled);
  const settled = debtList.filter((d) => d.is_settled);
  const totalUnsettled = unsettled.reduce((s, d) => s + d.amount, 0);

  return (
    <main className="flex flex-col gap-6 px-4 pt-6 pb-24">
      <div className="flex items-center gap-3">
        <BackLink href="/more" />
        <h1 className="text-xl font-semibold">Debts</h1>
      </div>

      {unsettled.length > 0 && (
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-xs text-neutral-500">Total Unsettled</p>
          <p className="mt-1 text-2xl font-semibold text-red-500">{formatIDR(totalUnsettled)}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{unsettled.length} unsettled</p>
        <AddDebtForm profiles={profiles ?? []} />
      </div>

      {unsettled.length === 0 && settled.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-400">No debts recorded.</p>
      )}

      {unsettled.length > 0 && (
        <div className="flex flex-col gap-3">
          {unsettled.map((d) => <DebtRow key={d.id} debt={d} />)}
        </div>
      )}

      {settled.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-neutral-400">Settled</h2>
          {settled.map((d) => <DebtRow key={d.id} debt={d} />)}
        </section>
      )}
    </main>
  );
}
