"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { triggerBudgetCheck } from "@/lib/push/budgetCheck";

export type TransactionFormState = { error: string | null };

export async function createTransaction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) return { error: "No household found." };

  const type = formData.get("type") as string;
  const savingGoalId = formData.get("saving_goal_id") as string;

  const { error } = await supabase.from("transactions").insert({
    household_id: membership.household_id,
    owner_id: user.id,
    type,
    account_id: formData.get("account_id") as string,
    destination_account_id:
      type === "transfer" ? (formData.get("destination_account_id") as string) : null,
    category_id: type === "transfer" ? null : (formData.get("category_id") as string),
    saving_goal_id: type === "transfer" && savingGoalId ? savingGoalId : null,
    amount: Number(formData.get("amount")),
    description: (formData.get("description") as string) || null,
    transaction_date: formData.get("transaction_date") as string,
    is_recurring: formData.get("is_recurring") === "true",
  });

  if (error) return { error: error.message };

  revalidatePath("/transactions");
  revalidatePath("/");
  revalidatePath("/accounts");

  // Fire budget check async for expense transactions (non-blocking)
  if (type === "expense") {
    triggerBudgetCheck(membership.household_id).catch(() => {});
  }

  return { error: null };
}

export async function updateTransaction(
  id: string,
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const supabase = await createClient();

  const type = formData.get("type") as string;
  const savingGoalId = formData.get("saving_goal_id") as string;

  const { error } = await supabase
    .from("transactions")
    .update({
      type,
      account_id: formData.get("account_id") as string,
      destination_account_id:
        type === "transfer" ? (formData.get("destination_account_id") as string) : null,
      category_id: type === "transfer" ? null : (formData.get("category_id") as string),
      saving_goal_id: type === "transfer" && savingGoalId ? savingGoalId : null,
      amount: Number(formData.get("amount")),
      description: (formData.get("description") as string) || null,
      transaction_date: formData.get("transaction_date") as string,
      is_recurring: formData.get("is_recurring") === "true",
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/transactions");
  revalidatePath("/");
  revalidatePath("/accounts");
  return { error: null };
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/transactions");
  revalidatePath("/");
  revalidatePath("/accounts");
}
