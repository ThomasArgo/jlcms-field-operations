import { supabase, requireSupabase } from "../lib/supabaseClient";

const TABLE = "users";

export async function getUsers() {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createUser(payload) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUser(id, updates) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .update(updates)
    .eq("legacy_user_id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUser(id) {
  const client = supabase || requireSupabase();
  const { error } = await client.from(TABLE).delete().eq("legacy_user_id", id);

  if (error) throw error;
  return true;
}
