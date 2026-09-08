import assert from "node:assert/strict";
import test from "node:test";
import { buildAdaptAIContext, resolveAdaptAIAccess } from "./ai-context.js";
import { buildCaregiverContextResponse, buildCaregiverContextNote } from "./caregiver-context.js";
import type { AdaptAIContext } from "./ai-context.js";

const relationship = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  caregiverId: 2,
  userId: 1,
  relationship: "parent",
  isPrimary: false,
  isActive: true,
  ...overrides,
});

function accessStorage({
  relationships = [relationship()],
  permissions = [],
  lockedSettings = [],
}: {
  relationships?: unknown[];
  permissions?: unknown[];
  lockedSettings?: unknown[];
} = {}) {
  return {
    getCareRelationshipsByCaregiver: async () => relationships,
    getCaregiverPermissions: async () => permissions,
    getLockedUserSettings: async () => lockedSettings,
  } as any;
}

test("treats the primary user as the care recipient with full self-access", async () => {
  const access = await resolveAdaptAIAccess(1, 1, accessStorage());

  assert.equal(access.role, "care_recipient");
  assert.deepEqual(access.permittedAreas, ["progress", "mood", "medical", "financial"]);
  assert.deepEqual(access.restrictedAreas, []);
});

test("allows an authorized caregiver only the granted areas", async () => {
  const access = await resolveAdaptAIAccess(
    2,
    1,
    accessStorage({
      permissions: [
        { permissionType: "view_progress", isGranted: true },
        { permissionType: "view_financial", isGranted: true },
      ],
    })
  );

  assert.equal(access.role, "authorized_user");
  assert.deepEqual(access.permittedAreas, ["progress", "financial"]);
  assert.deepEqual(access.restrictedAreas, ["mood", "medical"]);
});

test("keeps restricted caregiver information out of the access scope", async () => {
  const access = await resolveAdaptAIAccess(
    2,
    1,
    accessStorage({
      permissions: [{ permissionType: "view_progress", isGranted: false }],
      lockedSettings: [
        {
          settingKey: "medicalDataSharing",
          isLocked: true,
          canUserView: false,
        },
      ],
    })
  );

  assert.deepEqual(access.permittedAreas, []);
  assert.deepEqual(access.restrictedAreas, ["progress", "mood", "medical", "financial"]);
});

test("rejects an unrelated user", async () => {
  await assert.rejects(
    resolveAdaptAIAccess(9, 1, accessStorage()),
    /caregiver access denied/
  );
});

test("rejects a missing relationship even when permission rows exist", async () => {
  await assert.rejects(
    resolveAdaptAIAccess(
      2,
      1,
      accessStorage({
        relationships: [],
        permissions: [{ permissionType: "view_progress", isGranted: true }],
      })
    ),
    /caregiver access denied/
  );
});

test("builds caregiver context from authorized recipient data without loading restricted areas", async () => {
  const calls: string[] = [];
  const contextStorage = {
    ...accessStorage({
      permissions: [{ permissionType: "view_progress", isGranted: true }],
    }),
    getUserById: async () => ({ id: 1, name: "Alex Johnson" }),
    getDailyTasksByUser: async () => {
      calls.push("tasks");
      return [
        { userId: 1, title: "Task 1", category: "daily", isCompleted: true, dueDate: null },
        { userId: 1, title: "Task 2", category: "daily", isCompleted: false, dueDate: null },
      ];
    },
    getTransitionSkillsByUser: async () => [],
    getExistingUserPointsBalance: async () => undefined,
    getRecentUserAchievements: async () => [],
    getActiveRewardsByUser: async () => [],
    getRecentPointsTransactionsByUser: async () => [],
  } as any;

  const context = await buildAdaptAIContext(
    1,
    { name: "Caregiver" },
    { localDate: "2026-09-04", localTime: "09:00", timezone: "Asia/Calcutta" },
    contextStorage,
    { viewerUserId: 2 }
  );

  assert.equal(context.identity.displayName, "Alex Johnson");
  assert.deepEqual(context.caregiverContext, {
    role: "authorized_user",
    relationship: "parent",
    isPrimary: false,
    permittedAreas: ["progress"],
    restrictedAreas: ["mood", "medical", "financial"],
  });
  assert.equal(context.tasks?.today.length, 2);
  assert.equal(context.medical, undefined);
  assert.equal(context.finance, undefined);
  assert.equal(context.goals, undefined);
  assert.deepEqual(calls, ["tasks"]);
});

test("summarizes authorized caregiver progress and explains denied access", () => {
  const authorizedContext: AdaptAIContext = {
    identity: { displayName: "Alex" },
    today: { date: "2026-09-04", time: "09:00", timezone: "Asia/Calcutta" },
    caregiverContext: {
      role: "authorized_user",
      relationship: "parent",
      permittedAreas: ["progress"],
      restrictedAreas: ["mood", "medical", "financial"],
    },
    tasks: {
      today: [
        { title: "One", category: "daily", isCompleted: true },
        { title: "Two", category: "daily", isCompleted: true },
        { title: "Three", category: "daily", isCompleted: false },
      ],
      incomplete: [{ title: "Three", category: "daily", isCompleted: false }],
      completed: [
        { title: "One", category: "daily", isCompleted: true },
        { title: "Two", category: "daily", isCompleted: true },
      ],
    },
  };

  assert.equal(
    buildCaregiverContextResponse("How is Alex doing?", authorizedContext),
    "Alex completed 2 of 3 tasks today."
  );
  assert.match(
    buildCaregiverContextResponse("Show me Alex's medical information", authorizedContext) ?? "",
    /does not grant AdaptAI access/
  );
  assert.match(buildCaregiverContextNote(authorizedContext) ?? "", /only information/);
});