"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CategoryFormState = { error: string | null };

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
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

  const { error } = await supabase.from("categories").insert({
    household_id: membership.household_id,
    name: formData.get("name") as string,
    type: formData.get("type") as string,
  });

  if (error) return { error: error.message };

  revalidatePath("/categories");
  revalidatePath("/transactions");
  return { error: null };
}

export async function updateCategory(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({
      name: formData.get("name") as string,
      type: formData.get("type") as string,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/categories");
  revalidatePath("/transactions");
  return { error: null };
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
