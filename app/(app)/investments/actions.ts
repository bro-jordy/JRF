"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type InvestmentFormState = { error: string | null };

export async function createHolding(
  _prevState: InvestmentFormState,
  formData: FormData
): Promise<InvestmentFormState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) return { error: "No household found." };

  const { error } = await supabase.from("investment_holdings").insert({
    household_id: membership.household_id,
    owner_id: user.id,
    name: formData.get("name") as string,
    ticker: (formData.get("ticker") as string) || null,
    current_value: Number(formData.get("current_value")),
  });

  if (error) return { error: error.message };
  revalidatePath("/investments");
  revalidatePath("/");
  return { error: null };
}

export async function updateHoldingValue(
  id: string,
  _prevState: InvestmentFormState,
  formData: FormData
): Promise<InvestmentFormState> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("investment_holdings")
    .update({
      name: formData.get("name") as string,
      ticker: (formData.get("ticker") as string) || null,
      current_value: Number(formData.get("current_value")),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/investments");
  revalidatePath("/");
  return { error: null };
}

export async function deleteHolding(id: string): Promise<InvestmentFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("investment_holdings").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/investments");
  revalidatePath("/");
  return { error: null };
}

export async function addEntry(
  holdingId: string,
  _prevState: InvestmentFormState,
  formData: FormData
): Promise<InvestmentFormState> {
  const supabase = await createClient();

  const unitsRaw = formData.get("units") as string;

  const { error } = await supabase.from("investment_entries").insert({
    holding_id: holdingId,
    amount: Number(formData.get("amount")),
    units: unitsRaw ? Number(unitsRaw) : null,
    note: (formData.get("note") as string) || null,
    entry_date: formData.get("entry_date") as string,
  });

  if (error) return { error: error.message };
  revalidatePath("/investments");
  revalidatePath(`/investments/${holdingId}`);
  return { error: null };
}

export async function deleteEntry(id: string, holdingId: string): Promise<InvestmentFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("investment_entries").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/investments");
  revalidatePath(`/investments/${holdingId}`);
  return { error: null };
}
