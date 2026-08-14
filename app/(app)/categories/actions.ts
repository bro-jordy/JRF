"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCategory(formData: FormData) {
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

  await supabase.from("categories").insert({
    household_id: membership.household_id,
    name: formData.get("name") as string,
    type: formData.get("type") as string,
  });

  revalidatePath("/categories");
  revalidatePath("/transactions");
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient();

  await supabase
    .from("categories")
    .update({
      name: formData.get("name") as string,
      type: formData.get("type") as string,
    })
    .eq("id", id);

  revalidatePath("/categories");
  revalidatePath("/transactions");
}

export async function archiveCategory(id: string) {
  const supabase = await createClient();

  await supabase.from("categories").update({ is_archived: true }).eq("id", id);

  revalidatePath("/categories");
  revalidatePath("/transactions");
}

export async function restoreCategory(id: string) {
  const supabase = await createClient();

  await supabase.from("categories").update({ is_archived: false }).eq("id", id);

  revalidatePath("/categories");
}
