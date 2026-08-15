// Supabase Edge Function: daily-reminders
// Schedule: once a day (e.g. 08:00 local time)
// Sends a push notification once when a bill/debt is 3 days from due,
// and once when it becomes 1 day overdue — never spams every day in between.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const authHeader = req.headers.get("authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (authHeader && authHeader !== `Bearer ${serviceKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const appUrl = Deno.env.get("APP_URL") ?? "https://jrf.jordyrea.my.id";
  const now = new Date();
  const today = now.getDate();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const todayStr = `${currentMonthPrefix}-${String(today).padStart(2, "0")}`;
  const todayMidnightUtc = new Date(`${todayStr}T00:00:00.000Z`).getTime();

  async function notify(householdId: string, title: string, body: string, url: string) {
    await fetch(`${appUrl}/api/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ household_id: householdId, title, body, url }),
    }).catch(() => {});
  }

  let billReminders = 0;
  let debtReminders = 0;

  // ── Bills: due_day is a day-of-month ────────────────────────────────────
  const { data: bills } = await supabase
    .from("bills")
    .select("id, household_id, name, due_day, last_paid_date")
    .eq("is_active", true)
    .not("due_day", "is", null);

  for (const b of bills ?? []) {
    if (b.last_paid_date?.startsWith(currentMonthPrefix)) continue;

    const diff = b.due_day! - today; // + = days until due, - = days overdue
    if (diff === 3) {
      await notify(b.household_id, "🔔 Bill Due Soon", `${b.name} is due in 3 days.`, "/bills");
      billReminders++;
    } else if (diff === -1) {
      await notify(b.household_id, "⚠️ Bill Overdue", `${b.name} is overdue.`, "/bills");
      billReminders++;
    }
  }

  // ── Debts: due_date is a full date ──────────────────────────────────────
  const { data: debts } = await supabase
    .from("debts")
    .select("id, household_id, description, amount, due_date")
    .eq("is_settled", false)
    .not("due_date", "is", null);

  for (const d of debts ?? []) {
    const dueMidnightUtc = new Date(`${d.due_date}T00:00:00.000Z`).getTime();
    const diffDays = Math.round((dueMidnightUtc - todayMidnightUtc) / 86400000);
    const label = d.description || `debt of Rp${d.amount}`;

    if (diffDays === 3) {
      await notify(d.household_id, "🔔 Debt Due Soon", `${label} is due in 3 days.`, "/debts");
      debtReminders++;
    } else if (diffDays === -1) {
      await notify(d.household_id, "⚠️ Debt Overdue", `${label} is overdue.`, "/debts");
      debtReminders++;
    }
  }

  return new Response(JSON.stringify({ ok: true, billReminders, debtReminders }), { status: 200 });
});
