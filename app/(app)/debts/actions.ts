"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DebtFormState = { error: string | null };

export async function createDebt(
  _prev: DebtFormState,
  formData: FormData
): Promise<DebtFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) return { error: "No household found." };

  const dueDateRaw = formData.get("due_date") as string;

  const { error } = await supabase.from("debts").insert({
    household_id: membership.household_id,
    lender_id: formData.get("lender_id") as string,
    borrower_id: formData.get("borrower_id") as string,
    amount: Number(formData.get("amount")),
    description: (formData.get("description") as string) || null,
    due_date: dueDateRaw || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/debts");
  return { error: null };
}

export async function settleDebt(id: string): Promise<DebtFormState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("debts")
    .update({ is_settled: true, settled_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/debts");
  return { error: null };
}

export async function deleteDebt(id: string): Promise<DebtFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/debts");
  return { error: null };
}
