"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { triggerBudgetCheck } from "@/lib/push/budgetCheck";

export type BillFormState = { error: string | null };

export async function createBill(
  _prev: BillFormState,
  formData: FormData
): Promise<BillFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) return { error: "No household found." };

  const amountRaw = formData.get("amount") as string;
  const dueDayRaw = formData.get("due_day") as string;
  const categoryRaw = formData.get("category_id") as string;

  const { error } = await supabase.from("bills").insert({
    household_id: membership.household_id,
    name: formData.get("name") as string,
    amount: amountRaw ? Number(amountRaw) : null,
    due_day: dueDayRaw ? Number(dueDayRaw) : null,
    category_id: categoryRaw || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/bills");
  return { error: null };
}

export async function updateBill(
  id: string,
  _prev: BillFormState,
  formData: FormData
): Promise<BillFormState> {
  const supabase = await createClient();

  const amountRaw = formData.get("amount") as string;
  const dueDayRaw = formData.get("due_day") as string;
  const categoryRaw = formData.get("category_id") as string;

  const { error } = await supabase
    .from("bills")
    .update({
      name: formData.get("name") as string,
      amount: amountRaw ? Number(amountRaw) : null,
      due_day: dueDayRaw ? Number(dueDayRaw) : null,
      category_id: categoryRaw || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/bills");
  return { error: null };
}

export async function payBill(
  id: string,
  _prev: BillFormState,
  formData: FormData
): Promise<BillFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) return { error: "No household found." };

  const accountId = formData.get("account_id") as string;
  const categoryId = formData.get("category_id") as string;
  const amount = Number(formData.get("amount"));
  const paidDate = formData.get("paid_date") as string;
  const billName = formData.get("bill_name") as string;

  if (!accountId) return { error: "Pilih account dulu." };
  if (!categoryId) return { error: "Pilih kategori dulu." };
  if (!amount || amount <= 0) return { error: "Amount harus lebih dari 0." };

  const { error: txError } = await supabase.from("transactions").insert({
    household_id: membership.household_id,
    owner_id: user.id,
    type: "expense",
    account_id: accountId,
    category_id: categoryId,
    amount,
    description: billName,
    transaction_date: paidDate,
  });
  if (txError) return { error: txError.message };

  const { error: billError } = await supabase
    .from("bills")
    .update({ last_paid_date: paidDate })
    .eq("id", id);
  if (billError) return { error: billError.message };

  revalidatePath("/bills");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/");

  triggerBudgetCheck(membership.household_id).catch(() => {});

  return { error: null };
}

export async function deleteBill(id: string): Promise<BillFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("bills").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/bills");
  return { error: null };
}
