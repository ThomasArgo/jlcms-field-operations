import { supabase, requireSupabase } from "../lib/supabaseClient";

const TABLE = "teams";

export async function getTeams() {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTeam(payload) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTeam(id, updates) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .update(updates)
    .eq("legacy_team_id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTeam(id) {
  const client = supabase || requireSupabase();
  const { error } = await client.from(TABLE).delete().eq("legacy_team_id", id);

  if (error) throw error;
  return true;
}
