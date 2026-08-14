import { createClient } from "@/lib/supabase/server";
import { AddTransactionForm } from "@/components/transactions/AddTransactionForm";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { ExportCSVButton } from "@/components/transactions/ExportCSVButton";

type Transaction = {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string | null;
  transaction_date: string;
  account_id: string;
  destination_account_id: string | null;
  category_id: string | null;
  saving_goal_id: string | null;
  is_recurring: boolean;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; from?: string; to?: string; owner?: string; search?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const type = params.type ?? "all";
  const from = params.from ?? "";
  const to = params.to ?? "";
  const owner = params.owner ?? "all";
  const search = params.search ?? "";

  const [
    { data: accounts },
    { data: profiles },
    { data: categories },
    { data: savingGoals },
    { data: userResult },
  ] = await Promise.all([
    supabase.from("accounts").select("id, name, owner_id, is_main").eq("is_archived", false),
    supabase.from("profiles").select("id, display_name"),
    supabase.from("categories").select("id, name, type").eq("is_archived", false),
    supabase.from("saving_goals").select("id, name").eq("status", "active"),
    supabase.auth.getUser(),
  ]);

  const currentUserId = userResult.user?.id;
  const defaultAccountId =
    (accounts ?? []).find((a) => a.owner_id === currentUserId && a.is_main)?.id ??
    (accounts ?? []).find((a) => a.owner_id === currentUserId)?.id;

  const ownerAccountIds =
    owner !== "all" ? (accounts ?? []).filter((a) => a.owner_id === owner).map((a) => a.id) : null;

  let transactions: Transaction[] | null = [];
  if (!ownerAccountIds || ownerAccountIds.length > 0) {
    let transactionsQuery = supabase
      .from("transactions")
      .select(
        "id, type, amount, description, transaction_date, account_id, destination_account_id, category_id, saving_goal_id, is_recurring"
      )
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (type !== "all") transactionsQuery = transactionsQuery.eq("type", type);
    if (from) transactionsQuery = transactionsQuery.gte("transaction_date", from);
    if (to) transactionsQuery = transactionsQuery.lte("transaction_date", to);
    if (ownerAccountIds) transactionsQuery = transactionsQuery.in("account_id", ownerAccountIds);
    if (search) transactionsQuery = transactionsQuery.ilike("description", `%${search}%`);

    ({ data: transactions } = await transactionsQuery);
  }

  const accountNameById = new Map(accounts?.map((a) => [a.id, a.name]) ?? []);
  const categoryNameById = new Map(categories?.map((c) => [c.id, c.name]) ?? []);
  const typedCategories =
    (categories as { id: string; name: string; type: "income" | "expense" }[] | null) ?? [];

  const AMOUNT_COLOR: Record<Transaction["type"], string> = {
    income: "text-emerald-600",
    expense: "text-red-600",
    transfer: "text-neutral-600",
  };
  const AMOUNT_SIGN: Record<Transaction["type"], string> = {
    income: "+",
    expense: "-",
    transfer: "",
  };

  return (
    <main className="flex flex-col gap-6 px-4 pt-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <ExportCSVButton />
      </div>

      <TransactionFilters
        type={type}
        from={from}
        to={to}
        owner={owner}
        search={search}
        owners={profiles ?? []}
      />

      {(accounts?.length ?? 0) === 0 ? (
        <p className="text-sm text-neutral-500">
          Buat account dulu di tab Accounts sebelum catat transaksi.
        </p>
      ) : (
        <AddTransactionForm
          accounts={accounts ?? []}
          categories={typedCategories}
          savingGoals={savingGoals ?? []}
          defaultAccountId={defaultAccountId}
        />
      )}

      <div className="flex flex-col gap-2">
        {(transactions ?? []).map((t) => {
          const label =
            t.type === "transfer"
              ? `${accountNameById.get(t.account_id) ?? "?"} → ${accountNameById.get(t.destination_account_id ?? "") ?? "?"}`
              : t.description || categoryNameById.get(t.category_id ?? "") || "-";
          const sublabel =
            t.type === "transfer"
              ? t.description
              : `${accountNameById.get(t.account_id) ?? "?"} · ${categoryNameById.get(t.category_id ?? "") ?? "-"}`;

          return (
            <TransactionRow
              key={t.id}
              transaction={t}
              accounts={accounts ?? []}
              categories={typedCategories}
              savingGoals={savingGoals ?? []}
              label={label}
              sublabel={sublabel}
              amountColor={AMOUNT_COLOR[t.type]}
              amountSign={AMOUNT_SIGN[t.type]}
            />
          );
        })}

        {(transactions?.length ?? 0) === 0 && (
          <p className="text-sm text-neutral-500">Belum ada transaksi.</p>
        )}
      </div>
    </main>
  );
}
