import { defaultRolePermissions, hasPermission, normalizeRoleKey, normalizeRolePermissionsMap } from "./App";

describe("permission enforcement", () => {
  const buildTeam = (roles, rolePermissions) => ({
    teamId: "team-main",
    roles,
    rolePermissions
  });

  test("CEO always has full access", () => {
    const team = buildTeam(["ceo", "member"], defaultRolePermissions());
    const ceo = { id: "u1", role: "CEO" };

    expect(hasPermission(ceo, team, "schedule", "add")).toBe(true);
    expect(hasPermission(ceo, team, "schedule", "edit")).toBe(true);
    expect(hasPermission(ceo, team, "schedule", "delete")).toBe(true);
  });

  test("operations manager / project manager gets full schedule and task access when enabled", () => {
    const role = "Operations Manager / Project Manager";
    const normalizedRole = normalizeRoleKey(role);
    const permissions = normalizeRolePermissionsMap({
      [normalizedRole]: {
        schedule: { view: true, add: true, edit: true, delete: true },
        permanentSchedule: { view: true, add: true, edit: true, delete: true }
      }
    }, [role]);
    const team = buildTeam([role], permissions);
    const user = { id: "u2", role };

    expect(hasPermission(user, team, "schedule", "add")).toBe(true);
    expect(hasPermission(user, team, "schedule", "edit")).toBe(true);
    expect(hasPermission(user, team, "schedule", "delete")).toBe(true);
    expect(hasPermission(user, team, "permanentSchedule", "add")).toBe(true);
    expect(hasPermission(user, team, "permanentSchedule", "edit")).toBe(true);
    expect(hasPermission(user, team, "permanentSchedule", "delete")).toBe(true);
  });

  test("coordinator / compliance / support keeps explicit granted permissions", () => {
    const role = "Coordinator / Compliance / Support";
    const normalizedRole = normalizeRoleKey(role);
    const team = buildTeam([role], normalizeRolePermissionsMap({
      [normalizedRole]: {
        schedule: { view: true, add: true, edit: true, delete: true },
        team: { view: true, add: false, edit: true, delete: false }
      }
    }, [role]));
    const user = { id: "u3", role };

    expect(hasPermission(user, team, "schedule", "add")).toBe(true);
    expect(hasPermission(user, team, "schedule", "edit")).toBe(true);
    expect(hasPermission(user, team, "team", "edit")).toBe(true);
  });

  test("member follows stored permissions instead of a hardcoded view-only override", () => {
    const permissions = normalizeRolePermissionsMap({
      member: {
        schedule: { view: true, add: true, edit: true, delete: false }
      }
    }, ["member"]);
    const team = buildTeam(["member"], permissions);
    const user = { id: "u4", role: "member" };

    expect(hasPermission(user, team, "schedule", "add")).toBe(true);
    expect(hasPermission(user, team, "schedule", "edit")).toBe(true);
    expect(hasPermission(user, team, "schedule", "delete")).toBe(false);
  });

  test("limited roles stay blocked where permissions are off", () => {
    const role = "Field Viewer";
    const normalizedRole = normalizeRoleKey(role);
    const team = buildTeam([role], normalizeRolePermissionsMap({
      [normalizedRole]: {
        schedule: { view: true, add: false, edit: false, delete: false }
      }
    }, [role]));
    const user = { id: "u5", role };

    expect(hasPermission(user, team, "schedule", "view")).toBe(true);
    expect(hasPermission(user, team, "schedule", "add")).toBe(false);
    expect(hasPermission(user, team, "schedule", "edit")).toBe(false);
    expect(hasPermission(user, team, "schedule", "delete")).toBe(false);
  });
});
