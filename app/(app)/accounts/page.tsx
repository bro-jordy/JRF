import { createClient } from "@/lib/supabase/server";
import { AddAccountForm } from "@/components/accounts/AddAccountForm";
import { AccountRow } from "@/components/accounts/AccountRow";
import { BackLink } from "@/components/ui/BackLink";

type Account = {
  id: string;
  name: string;
  type: string;
  owner_id: string;
  is_liability: boolean;
  opening_balance: number;
  credit_limit: number | null;
  is_main: boolean;
};

export default async function AccountsPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: balances }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("id, name, type, owner_id, is_liability, opening_balance, credit_limit, is_main")
        .eq("is_archived", false)
        .order("created_at"),
      supabase.from("account_balances").select("account_id, balance"),
      supabase.from("profiles").select("id, display_name"),
    ]);

  const balanceByAccount = new Map(
    balances?.map((b) => [b.account_id, b.balance]) ?? []
  );
  const nameByOwner = new Map(
    profiles?.map((p) => [p.id, p.display_name]) ?? []
  );
  const owners = profiles?.map((p) => ({ id: p.id, display_name: p.display_name })) ?? [];

  const accountsByOwner = new Map<string, Account[]>();
  for (const account of (accounts as Account[] | null) ?? []) {
    const list = accountsByOwner.get(account.owner_id) ?? [];
    list.push(account);
    accountsByOwner.set(account.owner_id, list);
  }
  for (const list of accountsByOwner.values()) {
    list.sort((a, b) => Number(b.is_main) - Number(a.is_main));
  }

  return (
    <main className="flex flex-col gap-6 px-4 pt-6">
      <BackLink />
      <h1 className="text-xl font-semibold">Accounts</h1>

      <AddAccountForm owners={owners} />

      {[...accountsByOwner.entries()].map(([ownerId, ownerAccounts]) => (
        <section key={ownerId} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-neutral-500">
            {nameByOwner.get(ownerId) ?? "Unknown"}
          </h2>
          <div className="flex flex-col gap-2">
            {ownerAccounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                balance={balanceByAccount.get(account.id) ?? 0}
                owners={owners}
              />
            ))}
          </div>
        </section>
      ))}

      {(accounts?.length ?? 0) === 0 && (
        <p className="text-sm text-neutral-500">Belum ada account.</p>
      )}
    </main>
  );
}
