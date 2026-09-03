import assert from "node:assert/strict";
import test from "node:test";
import { buildAdaptAIContext } from "./ai-context.js";

test("buildAdaptAIContext uses only the authenticated user's storage scope", async () => {
  const authenticatedUserId = 42;
  const calledUserIds: number[] = [];

  const assertAuthenticatedScope = (userId: number) => {
    calledUserIds.push(userId);
    assert.equal(userId, authenticatedUserId);
  };

  const contextStorage = {
    getUserById: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return { id: authenticatedUserId, name: "Alex Johnson" };
    },
    getDailyTasksByUser: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return [
        {
          userId: authenticatedUserId,
          title: "Take a walk",
          description: "A short walk outside",
          category: "health",
          frequency: "daily",
          estimatedMinutes: 20,
          scheduledTime: "09:00",
          isCompleted: false,
          dueDate: null,
        },
      ];
    },
    getAppointmentsByDate: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return [];
    },
    getNextAppointment: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return undefined;
    },
    getMedicationsByUser: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return [];
    },
    getSavingsGoalsByUser: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return [];
    },
    getRecentMoodEntriesByUser: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return [];
    },
    getRecentSleepSessionsByUser: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return [];
    },
    getMealPlansByDate: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return [];
    },
    getActiveShoppingItems: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return [];
    },
    getRelevantBillsByUser: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return [];
    },
    getExistingUserPointsBalance: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return undefined;
    },
    getRecentUserAchievements: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return [];
    },
    getActiveRewardsByUser: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return [];
    },
    getRecentPointsTransactionsByUser: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return [];
    },
    getUserPreferences: async (userId: number) => {
      assertAuthenticatedScope(userId);
      return {
        userId: authenticatedUserId,
        behaviorPatterns: {
          preferredTaskTime: "morning",
        },
        accessibilitySettings: {
          highContrast: true,
          voiceEnabled: true,
          notificationToken: "must-not-leak",
        },
        notificationSettings: {
          privateContact: "must-not-leak",
        },
      };
    },
  } as any;

  const context = await buildAdaptAIContext(
    authenticatedUserId,
    { name: "Alex Johnson" },
    { localDate: "2026-09-03", localTime: "09:30", timezone: "Asia/Calcutta" },
    contextStorage
  );

  assert.ok(calledUserIds.length > 0);
  assert.ok(calledUserIds.every((userId) => userId === authenticatedUserId));
  assert.equal(context.identity.displayName, "Alex Johnson");
  assert.equal(context.today.date, "2026-09-03");
  assert.equal(context.tasks?.incomplete[0]?.title, "Take a walk");
  assert.equal(context.preferences?.behavior?.preferredTaskTime, "morning");
  assert.equal(context.preferences?.accessibility?.highContrast, true);

  const serializedContext = JSON.stringify(context);
  assert.doesNotMatch(serializedContext, /userId|password|notificationToken|privateContact/);
});