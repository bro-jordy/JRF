"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type GoalFormState = { error: string | null };

export async function createGoal(
  _prevState: GoalFormState,
  formData: FormData
): Promise<GoalFormState> {
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

  const targetDate = formData.get("target_date") as string;

  const { error } = await supabase.from("saving_goals").insert({
    household_id: membership.household_id,
    name: formData.get("name") as string,
    target_amount: Number(formData.get("target_amount")),
    target_date: targetDate || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/goals");
  revalidatePath("/");
  return { error: null };
}

export async function updateGoal(
  id: string,
  _prevState: GoalFormState,
  formData: FormData
): Promise<GoalFormState> {
  const supabase = await createClient();
  const targetDate = formData.get("target_date") as string;

  const { error } = await supabase
    .from("saving_goals")
    .update({
      name: formData.get("name") as string,
      target_amount: Number(formData.get("target_amount")),
      target_date: targetDate || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/goals");
  revalidatePath("/");
  return { error: null };
}

export async function archiveGoal(id: string) {
  const supabase = await createClient();
  await supabase.from("saving_goals").update({ status: "archived" }).eq("id", id);
  revalidatePath("/goals");
  revalidatePath("/");
}
