import { db } from "./db";
import { dailyTasks, users } from "@shared/schema";
import { evaluateAndSurfaceProactiveGuidance } from "./proactive-guidance.js";
import { logSanitizedError } from "./safe-logging.js";

/**
 * The existing minute-based worker is intentionally kept as the scheduling
 * mechanism. The decision layer selects at most one useful notification per
 * user and handles preferences and idempotency before anything is inserted.
 */
class TaskReminderService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log("🔔 Proactive Guidance Service started");

    this.intervalId = setInterval(() => {
      this.checkDueTasks().catch((error) =>
        logSanitizedError("proactive-guidance.worker", error),
      );
    }, 60000);

    this.checkDueTasks().catch((error) =>
      logSanitizedError("proactive-guidance.worker", error),
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("🔔 Proactive Guidance Service stopped");
  }

  private async checkDueTasks() {
    try {
      const now = new Date();
      const userRows = await db.select({ id: users.id }).from(users);

      for (const user of userRows) {
        try {
          const result = await evaluateAndSurfaceProactiveGuidance(user.id, now);
          if (result.notification) {
            console.log("Proactive guidance notification created");
          }
        } catch (error) {
          // One malformed user's data should not stop guidance for everyone else.
          logSanitizedError("proactive-guidance.evaluate", error);
        }
      }
    } catch (error) {
      logSanitizedError("proactive-guidance.check", error);
    }
  }

  // Method to manually trigger a guidance check (useful for testing).
  async checkNow() {
    await this.checkDueTasks();
  }

  // Preserve the existing maintenance hook for recurring task state.
  async resetDailyReminders() {
    try {
      await db
        .update(dailyTasks)
        .set({
          lastReminderSent: null,
          lastOverdueReminder: null,
        });

      console.log("🔄 Daily reminder state reset");
    } catch (error) {
      logSanitizedError("proactive-guidance.reset", error);
    }
  }
}

export const taskReminderService = new TaskReminderService();