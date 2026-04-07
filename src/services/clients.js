import { supabase, requireSupabase } from "../lib/supabaseClient";

const TABLE = "clients";

export async function getClients() {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createClientRecord(payload) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClientRecord(id, updates) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .update(updates)
    .eq("legacy_client_id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClientRecord(id) {
  const client = supabase || requireSupabase();
  const { error } = await client.from(TABLE).delete().eq("legacy_client_id", id);

  if (error) throw error;
  return true;
}
