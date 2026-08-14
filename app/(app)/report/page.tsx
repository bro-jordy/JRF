import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/ui/BackLink";
import { formatIDR } from "@/lib/format";
import { currentMonthStr } from "@/lib/date";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const month = params.month ?? currentMonthStr();

  const [year, mon] = month.split("-").map(Number);
  const prevDate = new Date(year, mon - 2, 1);
  const nextDate = new Date(year, mon, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const [{ data: transactions }, { data: categories }, { data: profiles }] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount, category_id, owner_id")
      .gte("transaction_date", `${month}-01`)
      .lte("transaction_date", `${month}-31`),
    supabase.from("categories").select("id, name, type"),
    supabase.from("profiles").select("id, display_name"),
  ]);

  const txList = transactions ?? [];
  const categoryNameById = new Map(categories?.map((c) => [c.id, c.name]) ?? []);
  const profileNameById = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

  const totalIncome = txList.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txList.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  // Expense by category
  const expByCat = new Map<string, number>();
  for (const t of txList) {
    if (t.type !== "expense") continue;
    const key = t.category_id ?? "uncategorized";
    expByCat.set(key, (expByCat.get(key) ?? 0) + t.amount);
  }
  const topCategories = [...expByCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Expense by person
  const expByPerson = new Map<string, number>();
  const incByPerson = new Map<string, number>();
  for (const t of txList) {
    if (t.type === "expense") {
      expByPerson.set(t.owner_id, (expByPerson.get(t.owner_id) ?? 0) + t.amount);
    } else if (t.type === "income") {
      incByPerson.set(t.owner_id, (incByPerson.get(t.owner_id) ?? 0) + t.amount);
    }
  }

  const allOwnerIds = [...new Set([...expByPerson.keys(), ...incByPerson.keys()])];

  return (
    <main className="flex flex-col gap-6 px-4 pt-6 pb-24">
      <div className="flex items-center gap-3">
        <BackLink href="/more" />
        <h1 className="text-xl font-semibold">Monthly Report</h1>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <a href={`/report?month=${prevMonth}`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm">
          ‹ Prev
        </a>
        <p className="text-sm font-medium">{monthLabel}</p>
        <a href={`/report?month=${nextMonth}`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm">
          Next ›
        </a>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Income</p>
          <p className="mt-1 text-sm font-semibold text-emerald-600">{formatIDR(totalIncome)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Expense</p>
          <p className="mt-1 text-sm font-semibold text-red-500">{formatIDR(totalExpense)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Net</p>
          <p className={`mt-1 text-sm font-semibold ${net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {net >= 0 ? "+" : ""}{formatIDR(net)}
          </p>
        </div>
      </div>

      {/* Top expense categories */}
      {topCategories.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-neutral-500">Top Expense Categories</h2>
          <div className="flex flex-col gap-2">
            {topCategories.map(([id, amount]) => {
              const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
              return (
                <div key={id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{categoryNameById.get(id) ?? "Uncategorized"}</span>
                    <span className="font-medium">{formatIDR(amount)} <span className="text-xs text-neutral-400">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-neutral-100">
                    <div className="h-1.5 rounded-full bg-neutral-800" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Per person breakdown */}
      {allOwnerIds.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-neutral-500">Per Person</h2>
          <div className="flex flex-col gap-3">
            {allOwnerIds.map((ownerId) => (
              <div key={ownerId} className="rounded-xl border border-neutral-200 p-4">
                <p className="text-sm font-medium">{profileNameById.get(ownerId) ?? "Unknown"}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-emerald-600">+{formatIDR(incByPerson.get(ownerId) ?? 0)}</span>
                  <span className="text-red-500">-{formatIDR(expByPerson.get(ownerId) ?? 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {txList.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-400">No transactions this month.</p>
      )}
    </main>
  );
}
