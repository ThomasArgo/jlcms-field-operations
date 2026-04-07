import { supabase, requireSupabase } from "../lib/supabaseClient";

const recurringTable = "recurring_weekly_schedule";
const oneOffTable = "oneoff_schedule_blocks";

export async function getRecurringWeeklySchedule() {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(recurringTable)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createRecurringWeeklySchedule(payload) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(recurringTable)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecurringWeeklySchedule(id, updates) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(recurringTable)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecurringWeeklySchedule(id) {
  const client = supabase || requireSupabase();
  const { error } = await client.from(recurringTable).delete().eq("id", id);

  if (error) throw error;
  return true;
}

export async function getOneOffScheduleBlocks() {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(oneOffTable)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createOneOffScheduleBlock(payload) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(oneOffTable)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOneOffScheduleBlock(id, updates) {
  const client = supabase || requireSupabase();
  const { data, error } = await client
    .from(oneOffTable)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteOneOffScheduleBlock(id) {
  const client = supabase || requireSupabase();
  const { error } = await client.from(oneOffTable).delete().eq("id", id);

  if (error) throw error;
  return true;
}
