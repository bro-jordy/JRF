"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AccountFormState = { error: string | null };

export async function createAccount(
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
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
  const creditLimitRaw = formData.get("credit_limit");
  const ownerId = formData.get("owner_id") as string;
  const isMain = formData.get("is_main") === "true";

  if (isMain) {
    await supabase.from("accounts").update({ is_main: false }).eq("owner_id", ownerId);
  }

  const { error } = await supabase.from("accounts").insert({
    household_id: membership.household_id,
    owner_id: ownerId,
    name: formData.get("name") as string,
    type,
    is_liability: type === "credit_card",
    credit_limit:
      type === "credit_card" && creditLimitRaw ? Number(creditLimitRaw) : null,
    opening_balance: Number(formData.get("opening_balance") || 0),
    is_main: isMain,
  });

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/transactions");
  return { error: null };
}

export async function updateAccount(
  id: string,
  _prevState: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const supabase = await createClient();

  const type = formData.get("type") as string;
  const creditLimitRaw = formData.get("credit_limit");
  const ownerId = formData.get("owner_id") as string;
  const isMain = formData.get("is_main") === "true";

  if (isMain) {
    await supabase
      .from("accounts")
      .update({ is_main: false })
      .eq("owner_id", ownerId)
      .neq("id", id);
  }

  const { error } = await supabase
    .from("accounts")
    .update({
      name: formData.get("name") as string,
      type,
      owner_id: ownerId,
      is_liability: type === "credit_card",
      credit_limit:
        type === "credit_card" && creditLimitRaw ? Number(creditLimitRaw) : null,
      opening_balance: Number(formData.get("opening_balance") || 0),
      is_main: isMain,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/transactions");
  return { error: null };
}

export async function archiveAccount(id: string) {
  const supabase = await createClient();
  await supabase.from("accounts").update({ is_archived: true }).eq("id", id);
  revalidatePath("/accounts");
  revalidatePath("/");
  revalidatePath("/transactions");
}
