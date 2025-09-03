import { db } from "./db";
import { dailyTasks, notifications } from "@shared/schema";
import { eq, and, isNull, lte, gt } from "drizzle-orm";

interface ReminderNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  createdAt: Date;
  taskId?: number;
}

class TaskReminderService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("🔔 Task Reminder Service started");
    
    // Check for due tasks every minute
    this.intervalId = setInterval(() => {
      this.checkDueTasks().catch(console.error);
    }, 60000); // 1 minute
    
    // Also check immediately on start
    this.checkDueTasks().catch(console.error);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("🔔 Task Reminder Service stopped");
  }

  private async checkDueTasks() {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Find tasks that are scheduled for the current time and not completed
      const dueTasks = await db
        .select()
        .from(dailyTasks)
        .where(
          and(
            eq(dailyTasks.isCompleted, false),
            eq(dailyTasks.scheduledTime, currentTime)
          )
        );

      for (const task of dueTasks) {
        await this.sendTaskReminder(task);
        
        // For now, we'll skip tracking to avoid database issues
      }

      // Also check for overdue tasks (scheduled time passed but not completed)
      const overdueTime = new Date(now.getTime() - 30 * 60000); // 30 minutes ago
      const overdueTimeStr = overdueTime.toTimeString().slice(0, 5);
      
      const overdueTasks = await db
        .select()
        .from(dailyTasks)
        .where(
          and(
            eq(dailyTasks.isCompleted, false),
            lte(dailyTasks.scheduledTime, overdueTimeStr),
            gt(dailyTasks.scheduledTime, '00:00') // Has a scheduled time
          )
        );

      for (const task of overdueTasks) {
        await this.sendOverdueReminder(task);
        
        // For now, we'll skip tracking to avoid database issues
      }

    } catch (error) {
      console.error("Error checking due tasks:", error);
    }
  }

  private async sendTaskReminder(task: any) {
    try {
      const reminderNotification = {
        userId: task.userId,
        type: 'task_reminder',
        title: `⏰ Time for: ${task.title}`,
        message: `Your task "${task.title}" is scheduled for now. ${task.estimatedMinutes} minutes estimated.`,
        priority: 'high',
        isRead: false,
        createdAt: new Date(),
        metadata: {
          taskId: task.id,
          taskCategory: task.category,
          estimatedMinutes: task.estimatedMinutes,
          pointValue: task.pointValue
        }
      };

      await db.insert(notifications).values(reminderNotification);
      
      console.log(`🔔 Task reminder sent: ${task.title} for user ${task.userId}`);
    } catch (error) {
      console.error("Error sending task reminder:", error);
    }
  }

  private async sendOverdueReminder(task: any) {
    try {
      const overdueNotification = {
        userId: task.userId,
        type: 'task_overdue',
        title: `⚠️ Overdue: ${task.title}`,
        message: `Your task "${task.title}" was scheduled for ${task.scheduledTime} and is now overdue. You can still complete it today!`,
        priority: 'high',
        isRead: false,
        createdAt: new Date(),
        metadata: {
          taskId: task.id,
          taskCategory: task.category,
          scheduledTime: task.scheduledTime,
          pointValue: task.pointValue
        }
      };

      await db.insert(notifications).values(overdueNotification);
      
      console.log(`⚠️ Overdue reminder sent: ${task.title} for user ${task.userId}`);
    } catch (error) {
      console.error("Error sending overdue reminder:", error);
    }
  }

  // Method to manually trigger reminder check (useful for testing)
  async checkNow() {
    await this.checkDueTasks();
  }

  // Reset reminders for a new day (called at midnight)
  async resetDailyReminders() {
    try {
      await db
        .update(dailyTasks)
        .set({ 
          lastReminderSent: null,
          lastOverdueReminder: null
        });
      
      console.log("🔄 Daily reminders reset for new day");
    } catch (error) {
      console.error("Error resetting daily reminders:", error);
    }
  }
}

export const taskReminderService = new TaskReminderService();