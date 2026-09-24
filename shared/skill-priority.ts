import { z } from "zod";

export const TRANSITION_SKILL_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type TransitionSkillPriority =
  (typeof TRANSITION_SKILL_PRIORITIES)[number];

export const transitionSkillPrioritySchema = z.enum(
  TRANSITION_SKILL_PRIORITIES,
);

export function parseNewTransitionSkillPriority(
  value: unknown,
): TransitionSkillPriority {
  return transitionSkillPrioritySchema.parse(value ?? "medium");
}

export function normalizeTransitionSkillPriority(
  value: unknown,
): TransitionSkillPriority | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  return (TRANSITION_SKILL_PRIORITIES as readonly string[]).includes(normalized)
    ? (normalized as TransitionSkillPriority)
    : null;
}