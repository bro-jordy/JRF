import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/more/LogoutButton";
import { PushSubscribeButton } from "@/components/notifications/PushSubscribeButton";

const MENU = [
  { href: "/accounts", label: "Accounts" },
  { href: "/goals", label: "Saving Goals" },
  { href: "/categories", label: "Categories" },
  { href: "/budget", label: "Budget" },
  { href: "/report", label: "Monthly Report" },
  { href: "/investments", label: "Investments" },
  { href: "/debts", label: "Debts" },
  { href: "/bills", label: "Bills" },
  { href: "/networth", label: "Net Worth" },
];

export default async function MorePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user!.id).single(),
    supabase
      .from("household_members")
      .select("household_id, households(name)")
      .eq("user_id", user!.id)
      .single(),
  ]);

  const household = membership?.households as unknown as { name: string } | null;

  return (
    <main className="flex flex-col gap-6 px-4 pt-6">
      <h1 className="text-xl font-semibold">More</h1>

      <div className="rounded-xl border border-neutral-200 p-4">
        <p className="text-sm font-medium">{profile?.display_name ?? "-"}</p>
        <p className="text-sm text-neutral-500">{user?.email}</p>
        {household && (
          <p className="mt-2 text-xs text-neutral-400">Household: {household.name}</p>
        )}
      </div>

      <nav className="flex flex-col overflow-hidden rounded-xl border border-neutral-200">
        {MENU.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between px-4 py-3 text-sm font-medium ${
              i > 0 ? "border-t border-neutral-100" : ""
            }`}
          >
            {item.label}
            <span className="text-neutral-400">›</span>
          </Link>
        ))}
      </nav>

      <PushSubscribeButton />
      <LogoutButton />
    </main>
  );
}
