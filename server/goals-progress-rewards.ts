import type {
  AdaptAIContext,
  AiGoal,
  AiPointsActivity,
  AiSkill,
  AiTask,
} from "./ai-context.js";

function normalize(message: string): string {
  return message.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Recognize goal, progress, achievement, and reward questions. The matcher
 * deliberately excludes the more specific "how am I doing today?" task
 * request, which remains handled by Tasks/Routines.
 */
export function isGoalsProgressRewardsRequest(message: string): boolean {
  const normalized = normalize(message);
  return [
    /\bhow am i doing(?! today)\b/,
    /\bwhat progress have i made\b/,
    /\bwhat did i accomplish\b/,
    /\bam i getting better at this\b/,
    /\bwhat should i work on next\b/,
    /\b(?:goal|goals|milestone|milestones|achievement|achievements|reward|rewards)\b/,
  ].some((pattern) => pattern.test(normalized));
}

function taskProgress(context: AdaptAIContext): {
  total: number;
  completed: number;
  completedTasks: AiTask[];
} {
  const tasks = context.tasks?.today ?? [];
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.isCompleted).length,
    completedTasks: tasks.filter((task) => task.isCompleted),
  };
}

function goalPercent(goal: AiGoal): number | undefined {
  if (
    goal.currentAmount === undefined ||
    goal.targetAmount === undefined ||
    goal.targetAmount <= 0
  ) {
    return undefined;
  }
  return Math.max(0, Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)));
}

function amount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatGoal(goal: AiGoal): string {
  const status = goal.isCompleted ? "completed" : "active";
  const progress =
    goal.currentAmount !== undefined && goal.targetAmount !== undefined
      ? ` (${amount(goal.currentAmount)} of ${amount(goal.targetAmount)} recorded${goalPercent(goal) !== undefined ? `, ${goalPercent(goal)}%` : ""})`
      : "";
  return `${goal.title} (${status}${progress})`;
}

function formatSkill(skill: AiSkill): string {
  const completedMilestones = skill.milestones.filter((milestone) => milestone.isCompleted).length;
  const milestoneText =
    skill.milestones.length > 0
      ? `, ${completedMilestones} of ${skill.milestones.length} milestones completed`
      : "";
  return `${skill.skillName} (level ${skill.currentLevel} of ${skill.targetLevel}${milestoneText})`;
}

function positiveActivities(context: AdaptAIContext): AiPointsActivity[] {
  return (context.progress?.recentActivity ?? []).filter((activity) => activity.points > 0);
}

function noProgressResponse(): string {
  return "I don't have recorded goals, completed milestones, achievements, rewards, or task progress to summarize yet. You can start with one small step whenever you're ready.";
}

function taskProgressSentence(progress: {
  total: number;
  completed: number;
}): string | undefined {
  if (progress.total === 0) return undefined;
  return `You completed ${progress.completed} of your ${progress.total} planned tasks today.`;
}

function goalsSentence(goals: AiGoal[]): string | undefined {
  if (goals.length === 0) return undefined;
  const completed = goals.filter((goal) => goal.isCompleted);
  const active = goals.filter((goal) => !goal.isCompleted);
  const pieces: string[] = [];
  if (completed.length > 0) {
    pieces.push(
      completed.length === 1
        ? `You completed the goal '${completed[0].title}'.`
        : `You completed ${completed.length} goals: ${completed.map((goal) => goal.title).join(", ")}.`
    );
  }
  if (active.length > 0) {
    pieces.push(
      active.length === 1
        ? `Your active goal is ${formatGoal(active[0])}.`
        : `You have ${active.length} active goals: ${active.map(formatGoal).join("; ")}.`
    );
  }
  return pieces.join(" ");
}

function skillSentence(skills: AiSkill[]): string | undefined {
  if (skills.length === 0) return undefined;
  return skills.length === 1
    ? `Your recorded skill progress is ${formatSkill(skills[0])}.`
    : `Your recorded skill progress includes ${skills.map(formatSkill).join("; ")}.`;
}

function accomplishmentsSentence(context: AdaptAIContext): string | undefined {
  const progress = taskProgress(context);
  const completedGoals = (context.goals ?? []).filter((goal) => goal.isCompleted);
  const completedMilestones = (context.progress?.skills ?? []).flatMap((skill) =>
    skill.milestones.filter((milestone) => milestone.isCompleted).map((milestone) => milestone.title)
  );
  const achievements = context.progress?.recentAchievements ?? [];
  const items = [
    ...progress.completedTasks.slice(0, 3).map((task) => task.title),
    ...completedMilestones.slice(0, 3),
    ...achievements.slice(0, 3).map((achievement) => achievement.title),
  ];

  const taskSentence = taskProgressSentence(progress);
  if (items.length === 0 && !taskSentence && completedGoals.length === 0) return undefined;
  const completedGoalsSentence =
    completedGoals.length === 0
      ? undefined
      : completedGoals.length === 1
        ? `You completed the goal '${completedGoals[0].title}'.`
        : `You completed ${completedGoals.length} goals: ${completedGoals
            .map((goal) => goal.title)
            .join(", ")}.`;
  if (items.length === 0) return [taskSentence, completedGoalsSentence].filter(Boolean).join(" ");
  const uniqueItems = [...new Set(items)].slice(0, 6);
  return [
    taskSentence,
    completedGoalsSentence,
    `Recorded accomplishments include: ${uniqueItems.join(", ")}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function positiveProgressSentence(context: AdaptAIContext): string | undefined {
  const achievements = context.progress?.recentAchievements ?? [];
  const activities = positiveActivities(context);
  const rewards = context.progress?.recentRewards ?? [];
  const parts: string[] = [];

  if (achievements.length > 0) {
    parts.push(`Recent achievements include ${achievements.slice(0, 3).map((item) => item.title).join(", ")}`);
  }
  if (activities.length > 0) {
    const activity = activities[0];
    parts.push(
      activity.description
        ? `you earned progress recorded as '${activity.description}'`
        : `you earned ${activity.points} points`
    );
  }
  if (rewards.length > 0) {
    parts.push(
      rewards.length === 1
        ? `one active reward is recorded (${rewards[0].title})`
        : `${rewards.length} active rewards are recorded`
    );
  }
  return parts.length > 0 ? `${parts.join("; ")}.` : undefined;
}

function currentProgressResponse(context: AdaptAIContext): string {
  const progress = taskProgress(context);
  const goals = context.goals ?? [];
  const skills = context.progress?.skills ?? [];
  const parts = [
    taskProgressSentence(progress),
    goalsSentence(goals),
    skillSentence(skills),
    positiveProgressSentence(context),
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.slice(0, 4).join(" ") : noProgressResponse();
}

function nextWorkResponse(context: AdaptAIContext): string {
  const activeGoal = (context.goals ?? []).find((goal) => !goal.isCompleted);
  if (activeGoal) {
    return `A recorded goal to keep working on is ${formatGoal(activeGoal)}.`;
  }

  const developingSkill = (context.progress?.skills ?? []).find(
    (skill) => skill.currentLevel < skill.targetLevel
  );
  if (developingSkill) {
    return `A recorded skill to keep practicing is ${formatSkill(developingSkill)}.`;
  }

  const nextTask = (context.tasks?.incomplete ?? [])[0];
  if (nextTask) {
    return `A recorded next step is your task '${nextTask.title}'.`;
  }

  if ((context.goals ?? []).length > 0 || (context.progress?.skills ?? []).length > 0) {
    return "Your recorded goals and skills are complete or up to date. I don't see another incomplete goal, skill, or task to suggest.";
  }
  return "I don't have a recorded goal, skill, or task to suggest as a next step yet.";
}

/**
 * Build a concise, encouraging response entirely from existing progress data.
 * This function does not calculate an unrecorded trend or mutate achievements,
 * rewards, goals, skills, or tasks.
 */
export function buildGoalsProgressRewardsResponse(
  message: string,
  context: AdaptAIContext
): string {
  const normalized = normalize(message);
  if (normalized.includes("work on next")) return nextWorkResponse(context);
  if (normalized.includes("accomplish")) {
    return accomplishmentsSentence(context) ?? noProgressResponse();
  }
  return currentProgressResponse(context);
}