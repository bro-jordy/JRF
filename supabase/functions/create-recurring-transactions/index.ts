// Supabase Edge Function: create-recurring-transactions
// Schedule: run on the 1st of every month via pg_cron or Supabase Dashboard cron
// Duplicates all is_recurring=true transactions from last month into current month

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  // Allow cron invocation (no auth header needed from scheduler)
  // but protect manual calls with service role key
  const authHeader = req.headers.get("authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (authHeader && authHeader !== `Bearer ${serviceKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based

  // Last month
  const lastMonthDate = new Date(currentYear, currentMonth - 2, 1);
  const lastYear = lastMonthDate.getFullYear();
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastMonthFrom = `${lastYear}-${String(lastMonth).padStart(2, "0")}-01`;
  const lastMonthTo = `${lastYear}-${String(lastMonth).padStart(2, "0")}-31`;

  // Current month prefix
  const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  // Fetch all recurring transactions from last month
  const { data: recurring, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("is_recurring", true)
    .gte("transaction_date", lastMonthFrom)
    .lte("transaction_date", lastMonthTo);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  if (!recurring?.length) {
    return new Response(JSON.stringify({ ok: true, created: 0 }), { status: 200 });
  }

  // Check which ones already exist this month (avoid duplicates)
  const { data: existing } = await supabase
    .from("transactions")
    .select("description, account_id, amount, type")
    .eq("is_recurring", true)
    .gte("transaction_date", `${currentMonthPrefix}-01`)
    .lte("transaction_date", `${currentMonthPrefix}-31`);

  const existingKeys = new Set(
    (existing ?? []).map((t) => `${t.description}|${t.account_id}|${t.amount}|${t.type}`)
  );

  const toInsert = recurring
    .filter((t) => {
      const key = `${t.description}|${t.account_id}|${t.amount}|${t.type}`;
      return !existingKeys.has(key);
    })
    .map((t) => {
      // Keep same day of month, just change year+month
      const originalDay = t.transaction_date.slice(8, 10);
      return {
        household_id: t.household_id,
        owner_id: t.owner_id,
        type: t.type,
        account_id: t.account_id,
        destination_account_id: t.destination_account_id,
        category_id: t.category_id,
        saving_goal_id: t.saving_goal_id,
        amount: t.amount,
        description: t.description,
        transaction_date: `${currentMonthPrefix}-${originalDay}`,
        is_recurring: true,
      };
    });

  if (!toInsert.length) {
    return new Response(JSON.stringify({ ok: true, created: 0, skipped: recurring.length }), { status: 200 });
  }

  const { error: insertError } = await supabase.from("transactions").insert(toInsert);
  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  // Send push notification to each household
  const householdIds = [...new Set(toInsert.map((t) => t.household_id))];
  const appUrl = Deno.env.get("APP_URL") ?? "https://jrf.jordyrea.my.id";

  for (const hhId of householdIds) {
    const count = toInsert.filter((t) => t.household_id === hhId).length;
    await fetch(`${appUrl}/api/push/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        household_id: hhId,
        title: "🔄 Recurring Transactions Created",
        body: `${count} recurring transaction${count > 1 ? "s" : ""} added for this month.`,
        url: "/transactions",
      }),
    });
  }

  return new Response(JSON.stringify({ ok: true, created: toInsert.length }), { status: 200 });
});
