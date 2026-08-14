"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BudgetFormState = { error: string | null };

export async function upsertBudget(
  _prevState: BudgetFormState,
  formData: FormData
): Promise<BudgetFormState> {
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

  const { error } = await supabase.from("budgets").upsert(
    {
      household_id: membership.household_id,
      category_id: formData.get("category_id") as string,
      month: formData.get("month") as string,
      amount: Number(formData.get("amount")),
    },
    { onConflict: "household_id,category_id,month" }
  );

  if (error) return { error: error.message };

  revalidatePath("/budget");
  revalidatePath("/");
  return { error: null };
}

export async function deleteBudget(id: string): Promise<BudgetFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/budget");
  revalidatePath("/");
  return { error: null };
}
