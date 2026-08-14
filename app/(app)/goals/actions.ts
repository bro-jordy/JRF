"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createGoal(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) return;

  const targetDate = formData.get("target_date") as string;

  await supabase.from("saving_goals").insert({
    household_id: membership.household_id,
    name: formData.get("name") as string,
    target_amount: Number(formData.get("target_amount")),
    target_date: targetDate || null,
    created_by: user.id,
  });

  revalidatePath("/goals");
  revalidatePath("/");
}

export async function updateGoal(id: string, formData: FormData) {
  const supabase = await createClient();
  const targetDate = formData.get("target_date") as string;

  await supabase
    .from("saving_goals")
    .update({
      name: formData.get("name") as string,
      target_amount: Number(formData.get("target_amount")),
      target_date: targetDate || null,
    })
    .eq("id", id);

  revalidatePath("/goals");
  revalidatePath("/");
}

export async function archiveGoal(id: string) {
  const supabase = await createClient();
  await supabase.from("saving_goals").update({ status: "archived" }).eq("id", id);
  revalidatePath("/goals");
  revalidatePath("/");
}
