import { createClient } from "@/lib/supabase/server";
import { AddBudgetForm } from "@/components/budget/AddBudgetForm";
import { BudgetRow } from "@/components/budget/BudgetRow";
import { BackLink } from "@/components/ui/BackLink";
import { currentMonthStr } from "@/lib/date";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const month = params.month ?? currentMonthStr();

  const [{ data: categories }, { data: budgets }, { data: transactions }] = await Promise.all([
    supabase.from("categories").select("id, name, type").eq("is_archived", false),
    supabase.from("budgets").select("id, category_id, month, amount").eq("month", month),
    supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("type", "expense")
      .gte("transaction_date", `${month}-01`)
      .lte("transaction_date", `${month}-31`),
  ]);

  // sum spent per category
  const spentByCategoryId = new Map<string, number>();
  for (const t of transactions ?? []) {
    if (!t.category_id) continue;
    spentByCategoryId.set(t.category_id, (spentByCategoryId.get(t.category_id) ?? 0) + t.amount);
  }

  // prev/next month nav
  const [year, mon] = month.split("-").map(Number);
  const prevDate = new Date(year, mon - 2, 1);
  const nextDate = new Date(year, mon, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <main className="flex flex-col gap-6 px-4 pt-6 pb-24">
      <div className="flex items-center gap-3">
        <BackLink href="/more" />
        <h1 className="text-xl font-semibold">Budget</h1>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <a href={`/budget?month=${prevMonth}`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm">
          ‹ Prev
        </a>
        <p className="text-sm font-medium">{monthLabel}</p>
        <a href={`/budget?month=${nextMonth}`} className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm">
          Next ›
        </a>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{(budgets ?? []).length} budgets set</p>
        <AddBudgetForm categories={categories ?? []} />
      </div>

      {(budgets ?? []).length === 0 ? (
        <p className="text-center text-sm text-neutral-400 py-8">No budgets set for this month.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {(budgets ?? []).map((b) => (
            <BudgetRow
              key={b.id}
              budget={b}
              categories={categories ?? []}
              spent={spentByCategoryId.get(b.category_id) ?? 0}
            />
          ))}
        </div>
      )}
    </main>
  );
}
