import { z } from "zod";
import { insertDailyTaskSchema, type DailyTask } from "../shared/schema.js";
import type { IStorage } from "./storage.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const IsoDateSchema = z
  .string()
  .regex(DATE_PATTERN, "dueDate must use YYYY-MM-DD")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "dueDate must be a real calendar date");

export const CreateTaskParametersSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    dueDate: IsoDateSchema.optional(),
    dueTime: z.string().regex(TIME_PATTERN, "dueTime must use HH:MM").optional(),
  })
  .strict();

export const CompleteTaskParametersSchema = z
  .object({
    taskId: z.number().int().positive(),
  })
  .strict();

export const AdaptAIActionRequestSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("create_task"),
      parameters: CreateTaskParametersSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("complete_task"),
      parameters: CompleteTaskParametersSchema,
    })
    .strict(),
]);

export type AdaptAIActionRequest = z.infer<typeof AdaptAIActionRequestSchema>;
export type AdaptAIActionName = AdaptAIActionRequest["action"];

export interface AdaptAIActionTaskTarget {
  id: number;
  title: string;
  dueDate?: string;
  dueTime?: string;
  isCompleted: boolean;
}

export interface AdaptAIActionContext {
  dailyTasks: AdaptAIActionTaskTarget[];
}

export interface AdaptAIActionSuccess {
  success: true;
  action: AdaptAIActionRequest;
  task: DailyTask;
  message: string;
}

export class AdaptAIActionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid_action"
      | "confirmation_required"
      | "not_found"
      | "not_owned"
      | "already_completed",
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AdaptAIActionError";
  }
}

export const ADAPTAI_ACTION_DEFINITIONS = {
  create_task: {
    requiresConfirmation: true,
    description: "Create one daily task for the authenticated user.",
  },
  complete_task: {
    requiresConfirmation: true,
    description: "Mark one existing daily task complete for the authenticated user.",
  },
} as const satisfies Record<
  AdaptAIActionName,
  { requiresConfirmation: boolean; description: string }
>;

/**
 * Keep read-only task summaries on their existing deterministic path while
 * allowing clear mutation requests to reach the controlled action-capable AI
 * turn. Questions about progress intentionally return false.
 */
export function isPotentialTaskActionRequest(message: string): boolean {
  const normalized = message
    .toLowerCase()
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(what|how|did|which|show|list)\b/.test(normalized)) {
    return false;
  }

  const createIntent =
    /\b(add|create|schedule|put|set up|remind me to)\b/.test(normalized) &&
    /\b(tasks?|to do|todo|daily list)\b/.test(normalized);
  const completeIntent =
    /\b(mark|check off|complete|finish)\b/.test(normalized) &&
    /\b(tasks?|to do|todo|complete|finished|done)\b/.test(normalized);

  return createIntent || completeIntent;
}

export function parseAdaptAIAction(input: unknown): AdaptAIActionRequest {
  const parsed = AdaptAIActionRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new AdaptAIActionError(
      "That AdaptAI action is not valid.",
      "invalid_action",
      400,
    );
  }
  return parsed.data;
}

export function buildActionContext(tasks: DailyTask[]): AdaptAIActionContext {
  return {
    dailyTasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : undefined,
      dueTime: task.scheduledTime ?? undefined,
      isCompleted: task.isCompleted === true,
    })),
  };
}

export function getActionProposalMessage(
  action: AdaptAIActionRequest,
  context: AdaptAIActionContext,
): string {
  if (action.action === "create_task") {
    const dateText = action.parameters.dueDate
      ? ` for ${formatActionDate(action.parameters.dueDate)}`
      : "";
    const timeText = action.parameters.dueTime
      ? ` at ${formatActionTime(action.parameters.dueTime)}`
      : "";
    return `Sure. Should I add “${action.parameters.title}”${dateText}${timeText}?`;
  }

  const target = context.dailyTasks.find(
    (task) => task.id === action.parameters.taskId,
  );
  if (!target) {
    return "I couldn't match that task to your daily task list. Which task should I complete?";
  }

  return `Would you like me to mark “${target.title}” as complete?`;
}

export function validateActionProposal(
  action: AdaptAIActionRequest,
  context: AdaptAIActionContext,
): AdaptAIActionRequest {
  if (action.action === "complete_task") {
    const target = context.dailyTasks.find(
      (task) => task.id === action.parameters.taskId,
    );
    if (!target) {
      throw new AdaptAIActionError(
        "I couldn't match that task to your daily task list. Which task should I complete?",
        "not_found",
        422,
      );
    }
    if (target.isCompleted) {
      throw new AdaptAIActionError(
        `“${target.title}” is already marked complete.`,
        "already_completed",
        422,
      );
    }
  }
  return action;
}

export async function executeAdaptAIAction(
  input: unknown,
  authenticatedUserId: number,
  storage: Pick<
    IStorage,
    | "createDailyTask"
    | "getTaskById"
    | "completeDailyTaskIfIncomplete"
    | "updateUserPoints"
  >,
  options: { confirmed: boolean },
): Promise<AdaptAIActionSuccess> {
  if (!Number.isInteger(authenticatedUserId) || authenticatedUserId < 1) {
    throw new AdaptAIActionError(
      "Authentication is required to execute an AdaptAI action.",
      "not_owned",
      401,
    );
  }

  const action = parseAdaptAIAction(input);
  if (
    ADAPTAI_ACTION_DEFINITIONS[action.action].requiresConfirmation &&
    options.confirmed !== true
  ) {
    throw new AdaptAIActionError(
      "Please confirm this action before I make the change.",
      "confirmation_required",
      409,
    );
  }

  if (action.action === "create_task") {
    const taskData = insertDailyTaskSchema.parse({
      userId: authenticatedUserId,
      title: action.parameters.title,
      description: "",
      category: "personal_care",
      frequency: "daily",
      estimatedMinutes: 15,
      pointValue: 0,
      scheduledTime: action.parameters.dueTime ?? null,
      dueDate: action.parameters.dueDate
        ? new Date(`${action.parameters.dueDate}T00:00:00.000Z`)
        : null,
      isCompleted: false,
    });
    const task = await storage.createDailyTask(taskData);
    return {
      success: true,
      action,
      task,
      message: `Added “${task.title}” to your daily tasks.`,
    };
  }

  const existingTask = await storage.getTaskById(action.parameters.taskId);
  if (!existingTask) {
    throw new AdaptAIActionError("Task not found.", "not_found", 404);
  }
  if (existingTask.userId !== authenticatedUserId) {
    throw new AdaptAIActionError(
      "You can only update your own daily tasks.",
      "not_owned",
      403,
    );
  }
  if (existingTask.isCompleted) {
    throw new AdaptAIActionError(
      `“${existingTask.title}” is already marked complete.`,
      "already_completed",
      422,
    );
  }

  const task = await storage.completeDailyTaskIfIncomplete(
    existingTask.id,
    authenticatedUserId,
  );
  if (!task) {
    throw new AdaptAIActionError(
      `“${existingTask.title}” is already marked complete.`,
      "already_completed",
      422,
    );
  }

  if (existingTask.pointValue && existingTask.pointValue > 0) {
    try {
      await storage.updateUserPoints(
        authenticatedUserId,
        existingTask.pointValue,
        "task_completion",
        `Completed: ${existingTask.title}`,
        authenticatedUserId,
      );
    } catch (pointsError) {
      console.error("Error awarding points for AdaptAI task completion:", pointsError);
    }
  }

  return {
    success: true,
    action,
    task,
    message: `Marked “${task.title}” as complete.`,
  };
}

function formatActionDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatActionTime(value: string): string {
  const [hour, minute] = value.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}