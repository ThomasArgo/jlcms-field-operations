import { supabase, requireSupabase } from "../lib/supabaseClient";

const TABLE = "vendors";

export async function getVendors() {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createVendor(payload) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVendor(id, updates) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .update(updates)
    .eq("legacy_vendor_id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVendor(id) {
  const client = supabase || requireSupabase();
  const { error } = await client.from(TABLE).delete().eq("legacy_vendor_id", id);

  if (error) throw error;
  return true;
}
