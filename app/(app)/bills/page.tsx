import { createClient } from "@/lib/supabase/server";
import { BackLink } from "@/components/ui/BackLink";
import { AddBillForm } from "@/components/bills/AddBillForm";
import { BillRow } from "@/components/bills/BillRow";

export default async function BillsPage() {
  const supabase = await createClient();

  const [{ data: bills }, { data: categories }, { data: accounts }, { data: userResult }] =
    await Promise.all([
      supabase
        .from("bills")
        .select("id, name, amount, due_day, category_id, last_paid_date, is_active")
        .eq("is_active", true)
        .order("due_day", { ascending: true, nullsFirst: false }),
      supabase.from("categories").select("id, name").eq("type", "expense").eq("is_archived", false),
      supabase.from("accounts").select("id, name, owner_id, is_main").eq("is_archived", false),
      supabase.auth.getUser(),
    ]);

  const currentUserId = userResult.user?.id;
  const defaultAccountId =
    (accounts ?? []).find((a) => a.owner_id === currentUserId && a.is_main)?.id ??
    (accounts ?? []).find((a) => a.owner_id === currentUserId)?.id;

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const billList = bills ?? [];
  const unpaid = billList.filter((b) => !b.last_paid_date?.startsWith(currentMonth));
  const paid = billList.filter((b) => b.last_paid_date?.startsWith(currentMonth));

  return (
    <main className="flex flex-col gap-6 px-4 pt-6 pb-24">
      <div className="flex items-center gap-3">
        <BackLink href="/more" />
        <h1 className="text-xl font-semibold">Bills</h1>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {unpaid.length} unpaid · {paid.length} paid this month
        </p>
        <AddBillForm categories={categories ?? []} />
      </div>

      {billList.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-400">No bills yet.</p>
      )}

      {unpaid.length > 0 && (
        <div className="flex flex-col gap-3">
          {unpaid.map((b) => (
            <BillRow
              key={b.id}
              bill={b}
              categories={categories ?? []}
              accounts={accounts ?? []}
              defaultAccountId={defaultAccountId}
            />
          ))}
        </div>
      )}

      {paid.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-neutral-400">Paid This Month</h2>
          {paid.map((b) => (
            <BillRow
              key={b.id}
              bill={b}
              categories={categories ?? []}
              accounts={accounts ?? []}
              defaultAccountId={defaultAccountId}
            />
          ))}
        </section>
      )}
    </main>
  );
}
