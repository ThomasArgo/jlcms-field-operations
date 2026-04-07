import { supabase, requireSupabase } from "../lib/supabaseClient";

const TABLE = "workspace_state";

export async function getWorkspaceState(teamId) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("team_id", teamId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveWorkspaceState(teamId, data) {
  const client = supabase || requireSupabase();
  const { data: saved, error } = await client
    .from(TABLE)
    .upsert(
      {
        team_id: teamId,
        data,
        updated_at: new Date().toISOString()
      },
      { onConflict: "team_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return saved;
}
