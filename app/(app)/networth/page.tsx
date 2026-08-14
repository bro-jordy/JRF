import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/ui/BackLink";
import { NetWorthChart } from "@/components/networth/NetWorthChart";
import { takeSnapshot } from "@/app/(app)/networth/actions";
import { formatIDR } from "@/lib/format";

export default async function NetWorthPage() {
  const supabase = await createClient();

  const [{ data: snapshots }, { data: accounts }, { data: balances }, { data: holdings }] =
    await Promise.all([
      supabase
        .from("net_worth_snapshots")
        .select("snapshot_month, total_assets, total_liabilities, net_worth")
        .order("snapshot_month", { ascending: true })
        .limit(24),
      supabase.from("accounts").select("id, name, is_liability").eq("is_archived", false),
      supabase.from("account_balances").select("account_id, balance"),
      supabase.from("investment_holdings").select("name, current_value"),
    ]);

  const balanceByAccount = new Map((balances ?? []).map((b) => [b.account_id, b.balance]));

  let totalAssets = 0;
  let totalLiabilities = 0;
  for (const acc of accounts ?? []) {
    const bal = balanceByAccount.get(acc.id) ?? 0;
    if (acc.is_liability) totalLiabilities += bal;
    else totalAssets += bal;
  }
  for (const h of holdings ?? []) totalAssets += h.current_value;

  const netWorth = totalAssets - totalLiabilities;

  return (
    <main className="flex flex-col gap-6 px-4 pt-6 pb-24">
      <div className="flex items-center gap-3">
        <BackLink href="/more" />
        <h1 className="text-xl font-semibold">Net Worth</h1>
      </div>

      {/* Current breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Assets</p>
          <p className="mt-1 text-sm font-semibold text-emerald-600">{formatIDR(totalAssets)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Liabilities</p>
          <p className="mt-1 text-sm font-semibold text-red-500">{formatIDR(totalLiabilities)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Net Worth</p>
          <p className={`mt-1 text-sm font-semibold ${netWorth >= 0 ? "text-neutral-900" : "text-red-500"}`}>
            {formatIDR(netWorth)}
          </p>
        </div>
      </div>

      {/* Timeline chart */}
      <NetWorthChart snapshots={snapshots ?? []} />

      {/* Snapshot button */}
      <form action={async () => { "use server"; await takeSnapshot(); }}>
        <button
          type="submit"
          className="w-full rounded-xl border border-neutral-200 py-3 text-sm font-medium text-neutral-700"
        >
          📸 Save Snapshot for This Month
        </button>
      </form>

      {/* Snapshot history table */}
      {(snapshots?.length ?? 0) > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">History</h2>
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-xs text-neutral-500">
                  <th className="px-3 py-2 text-left">Month</th>
                  <th className="px-3 py-2 text-right">Assets</th>
                  <th className="px-3 py-2 text-right">Liabilities</th>
                  <th className="px-3 py-2 text-right">Net Worth</th>
                </tr>
              </thead>
              <tbody>
                {[...(snapshots ?? [])].reverse().map((s) => (
                  <tr key={s.snapshot_month} className="border-b border-neutral-100 last:border-0">
                    <td className="px-3 py-2 font-medium">{s.snapshot_month}</td>
                    <td className="px-3 py-2 text-right text-emerald-600">{formatIDR(s.total_assets)}</td>
                    <td className="px-3 py-2 text-right text-red-500">{formatIDR(s.total_liabilities)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatIDR(s.net_worth)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
