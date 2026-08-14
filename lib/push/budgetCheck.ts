import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { currentMonthStr } from "@/lib/date";

if (
  process.env.VAPID_EMAIL &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function triggerBudgetCheck(householdId: string) {
  try {
    const supabase = await createClient();
    const month = currentMonthStr();

    const [{ data: budgets }, { data: transactions }, { data: categories }, { data: members }] =
      await Promise.all([
        supabase.from("budgets").select("category_id, amount").eq("household_id", householdId).eq("month", month),
        supabase
          .from("transactions")
          .select("category_id, amount")
          .eq("type", "expense")
          .gte("transaction_date", `${month}-01`)
          .lte("transaction_date", `${month}-31`),
        supabase.from("categories").select("id, name"),
        supabase.from("household_members").select("user_id").eq("household_id", householdId),
      ]);

    if (!budgets?.length || !members?.length) return;

    const spentByCategory = new Map<string, number>();
    for (const t of transactions ?? []) {
      if (!t.category_id) continue;
      spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + t.amount);
    }

    const catNameById = new Map(categories?.map((c) => [c.id, c.name]) ?? []);

    const notifications: { title: string; body: string }[] = [];
    for (const b of budgets) {
      const spent = spentByCategory.get(b.category_id) ?? 0;
      const pct = spent / b.amount;
      const name = catNameById.get(b.category_id) ?? "Category";
      if (spent > b.amount) {
        notifications.push({ title: "⚠️ Budget Exceeded", body: `${name}: over budget!` });
      } else if (pct >= 0.8) {
        notifications.push({ title: "📊 Budget Alert", body: `${name}: ${Math.round(pct * 100)}% used` });
      }
    }

    if (!notifications.length) return;

    const userIds = members.map((m) => m.user_id);
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .in("user_id", userIds);

    if (!subs?.length) return;

    for (const notif of notifications) {
      const payload = JSON.stringify({ ...notif, url: "/budget" });
      await Promise.allSettled(
        subs.map((sub) =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
        )
      );
    }
  } catch {
    // Non-fatal — don't break the transaction flow
  }
}
