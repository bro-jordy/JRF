import { createClient } from "@/lib/supabase/server";
import { monthRange, yearRange } from "@/lib/date";
import { BalanceVisibilityProvider } from "@/components/home/BalanceVisibilityContext";
import { HideBalanceButton } from "@/components/home/HideBalanceButton";
import { MoreMenuButton } from "@/components/home/MoreMenuButton";
import { PeriodToggle } from "@/components/home/PeriodToggle";
import { Amount } from "@/components/home/Amount";
import { ExpenseBreakdownChart, type Slice } from "@/components/home/ExpenseBreakdownChart";

type Account = {
  id: string;
  name: string;
  type: string;
  owner_id: string;
  is_liability: boolean;
  is_main: boolean;
};

type Balance = { account_id: string; balance: number };

type Profile = { id: string; display_name: string };

type CreditCardSummary = {
  account_id: string;
  name: string;
  owner_id: string;
  credit_limit: number | null;
  outstanding: number;
  available_limit: number | null;
  utilization: number | null;
};

type GoalProgress = {
  saving_goal_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  status: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; offset?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const period = params.period === "year" || params.period === "month" ? params.period : "all";
  const offset = Math.max(0, Number(params.offset) || 0);

  let periodLabel: string | null = null;
  let periodTransactionsQuery = supabase
    .from("transactions")
    .select("type, amount, saving_goal_id, category_id");
  if (period === "month") {
    const { from, to, label } = monthRange(offset);
    periodTransactionsQuery = periodTransactionsQuery
      .gte("transaction_date", from)
      .lte("transaction_date", to);
    periodLabel = label;
  } else if (period === "year") {
    const { from, to, label } = yearRange(offset);
    periodTransactionsQuery = periodTransactionsQuery
      .gte("transaction_date", from)
      .lte("transaction_date", to);
    periodLabel = label;
  }

  const [
    { data: accounts },
    { data: balances },
    { data: profiles },
    { data: creditCards },
    { data: goals },
    { data: categories },
    { data: periodTransactions },
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, owner_id, is_liability, is_main")
      .eq("is_archived", false),
    supabase.from("account_balances").select("account_id, balance"),
    supabase.from("profiles").select("id, display_name"),
    supabase.from("credit_card_summary").select("*"),
    supabase.from("saving_goal_progress").select("*").eq("status", "active"),
    supabase.from("categories").select("id, name"),
    periodTransactionsQuery,
  ]);

  const balanceByAccount = new Map(
    (balances as Balance[] | null)?.map((b) => [b.account_id, b.balance]) ?? []
  );
  const nameByOwner = new Map(
    (profiles as Profile[] | null)?.map((p) => [p.id, p.display_name]) ?? []
  );

  const accountList = (accounts as Account[] | null) ?? [];
  const totalBalance = accountList.reduce((sum, a) => {
    const balance = balanceByAccount.get(a.id) ?? 0;
    return sum + (a.is_liability ? -balance : balance);
  }, 0);

  const accountsByOwner = new Map<string, Account[]>();
  for (const account of accountList) {
    const list = accountsByOwner.get(account.owner_id) ?? [];
    list.push(account);
    accountsByOwner.set(account.owner_id, list);
  }
  for (const list of accountsByOwner.values()) {
    list.sort((a, b) => Number(b.is_main) - Number(a.is_main));
  }

  const activeAccountIds = new Set(accountList.map((a) => a.id));
  const activeCreditCards = ((creditCards as CreditCardSummary[] | null) ?? []).filter((cc) =>
    activeAccountIds.has(cc.account_id)
  );

  const periodIncome = (periodTransactions ?? [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const periodExpense = (periodTransactions ?? [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const periodSaving = (periodTransactions ?? [])
    .filter((t) => t.type === "transfer" && t.saving_goal_id)
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryNameById = new Map(categories?.map((c) => [c.id, c.name]) ?? []);
  const expenseByCategory = new Map<string, number>();
  for (const t of periodTransactions ?? []) {
    if (t.type !== "expense") continue;
    const key = t.category_id ?? "uncategorized";
    expenseByCategory.set(key, (expenseByCategory.get(key) ?? 0) + t.amount);
  }
  const sortedExpenseCategories = [...expenseByCategory.entries()].sort((a, b) => b[1] - a[1]);
  const topCategories = sortedExpenseCategories.slice(0, 5);
  const otherTotal = sortedExpenseCategories
    .slice(5)
    .reduce((sum, [, amount]) => sum + amount, 0);
  const expenseChartData: Slice[] = [
    ...topCategories.map(([id, amount]) => ({
      label: categoryNameById.get(id) ?? "Uncategorized",
      amount,
    })),
    ...(otherTotal > 0 ? [{ label: "Other", amount: otherTotal }] : []),
  ];

  return (
    <BalanceVisibilityProvider>
      <main className="flex flex-col gap-6 px-4 pt-6">
        <div>
          <div className="flex items-center justify-between px-1">
            <p className="text-lg font-semibold tracking-wide text-neutral-400">
              #READYinloveforever
            </p>
            <MoreMenuButton />
          </div>

          <div className="mt-2 rounded-xl border border-neutral-200 p-4">
            <h1 className="text-sm font-medium text-neutral-500">Family Overview</h1>
            <div className="mt-1 flex items-center justify-between">
              <Amount value={totalBalance} className="text-3xl font-semibold" />
              <HideBalanceButton />
            </div>

            <div className="mt-4 flex justify-end">
              <PeriodToggle period={period} offset={offset} label={periodLabel} />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <StatTile label="Income" value={periodIncome} />
              <StatTile label="Expense" value={periodExpense} />
              <StatTile label="Saving" value={periodSaving} />
            </div>
          </div>
        </div>

        <ExpenseBreakdownChart data={expenseChartData} total={periodExpense} />

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-neutral-500">Accounts</h2>
          {[...accountsByOwner.entries()].map(([ownerId, ownerAccounts]) => (
            <div key={ownerId} className="rounded-xl border border-neutral-200 p-4">
              <p className="text-sm font-medium">{nameByOwner.get(ownerId) ?? "Unknown"}</p>
              <ul className="mt-2 flex flex-col gap-2">
                {ownerAccounts.map((account) => (
                  <li key={account.id} className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-neutral-600">
                      {account.name}
                      {account.is_main && <span className="text-amber-500">★</span>}
                    </span>
                    <Amount
                      value={balanceByAccount.get(account.id) ?? 0}
                      className="font-medium"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {accountList.length === 0 && (
            <p className="text-sm text-neutral-500">Belum ada account.</p>
          )}
        </section>

        {activeCreditCards.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-neutral-500">Credit Cards</h2>
            {activeCreditCards.map((cc) => (
              <div key={cc.account_id} className="rounded-xl border border-neutral-200 p-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{cc.name}</span>
                  <span className="text-neutral-500">{nameByOwner.get(cc.owner_id)}</span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-sm text-neutral-600">
                  <span>Outstanding</span>
                  <Amount value={cc.outstanding} />
                  {cc.credit_limit != null && (
                    <>
                      <span>/</span>
                      <Amount value={cc.credit_limit} />
                    </>
                  )}
                </p>
                {cc.utilization != null && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100">
                    <div
                      className="h-1.5 rounded-full bg-neutral-900"
                      style={{ width: `${Math.min(cc.utilization * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {(goals?.length ?? 0) > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-neutral-500">Saving Goals</h2>
            {(goals as GoalProgress[]).map((goal) => {
              const progress =
                goal.target_amount > 0
                  ? Math.min(goal.current_amount / goal.target_amount, 1)
                  : 0;
              return (
                <div key={goal.saving_goal_id} className="rounded-xl border border-neutral-200 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Amount value={goal.current_amount} />
                      <span>/</span>
                      <Amount value={goal.target_amount} />
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100">
                    <div
                      className="h-1.5 rounded-full bg-neutral-900"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </BalanceVisibilityProvider>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <Amount value={value} className="mt-1 block text-sm font-semibold" />
    </div>
  );
}
