import { createTeam, getTeams, updateTeam } from "./teams";

const FIXED_LEGACY_TEAM_ID = "team-main";
const FIXED_WORKSPACE_NAME = "HCG Management LLC / Honesty Construction Group";

export async function getOrCreateWorkspaceTeam() {
  const teams = await getTeams();
  const existing =
    (teams || []).find((team) => team.legacy_team_id === FIXED_LEGACY_TEAM_ID) ||
    (teams || []).find((team) => team.team_name === FIXED_WORKSPACE_NAME);

  if (existing) return existing;

  return createTeam({
    legacy_team_id: FIXED_LEGACY_TEAM_ID,
    team_name: FIXED_WORKSPACE_NAME,
    invite_code: "",
    today_focus_custom: "",
    roles: ["ceo", "management", "operations", "member"],
    role_permissions: {},
    metadata: {
      source: "app-bootstrap"
    }
  });
}

export async function syncWorkspaceTeam(updates = {}) {
  const team = await getOrCreateWorkspaceTeam();
  return updateTeam(team.legacy_team_id || FIXED_LEGACY_TEAM_ID, updates);
}
