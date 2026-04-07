import { supabase, requireSupabase } from "../lib/supabaseClient";

const TABLE = "inspectors";

export async function getInspectors() {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createInspector(payload) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInspector(id, updates) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .update(updates)
    .eq("legacy_inspector_id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInspector(id) {
  const client = supabase || requireSupabase();
  const { error } = await client.from(TABLE).delete().eq("legacy_inspector_id", id);

  if (error) throw error;
  return true;
}
