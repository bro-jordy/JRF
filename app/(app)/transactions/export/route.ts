import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const type = searchParams.get("type") ?? "all";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const owner = searchParams.get("owner") ?? "all";
  const search = searchParams.get("search") ?? "";

  const [{ data: accounts }, { data: profiles }, { data: categories }] = await Promise.all([
    supabase.from("accounts").select("id, name, owner_id"),
    supabase.from("profiles").select("id, display_name"),
    supabase.from("categories").select("id, name"),
  ]);

  const accountNameById = new Map(accounts?.map((a) => [a.id, a.name]) ?? []);
  const accountOwnerById = new Map(accounts?.map((a) => [a.id, a.owner_id]) ?? []);
  const profileNameById = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);
  const categoryNameById = new Map(categories?.map((c) => [c.id, c.name]) ?? []);

  const ownerAccountIds =
    owner !== "all" ? (accounts ?? []).filter((a) => a.owner_id === owner).map((a) => a.id) : null;

  let query = supabase
    .from("transactions")
    .select("id, type, amount, description, transaction_date, account_id, destination_account_id, category_id")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (type !== "all") query = query.eq("type", type);
  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);
  if (ownerAccountIds) query = query.in("account_id", ownerAccountIds);
  if (search) query = query.ilike("description", `%${search}%`);

  const { data: transactions } = await query;

  const rows = (transactions ?? []).map((t) => {
    const owner = profileNameById.get(accountOwnerById.get(t.account_id) ?? "") ?? "";
    const account = accountNameById.get(t.account_id) ?? "";
    const destination = t.destination_account_id ? accountNameById.get(t.destination_account_id) ?? "" : "";
    const category = t.category_id ? categoryNameById.get(t.category_id) ?? "" : "";
    return [
      t.transaction_date,
      t.type,
      t.amount,
      t.description ?? "",
      account,
      destination,
      category,
      owner,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  const header = ["Date", "Type", "Amount", "Description", "Account", "Destination", "Category", "Owner"].join(",");
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jrf-transactions.csv"`,
    },
  });
}
