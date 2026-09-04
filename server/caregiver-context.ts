import type { AdaptAIContext, CaregiverContextArea } from "./ai-context.js";

function normalize(message: string): string {
  return message.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
}

function requestedAreas(message: string): CaregiverContextArea[] {
  const normalized = normalize(message);
  const areas: CaregiverContextArea[] = [];

  if (/\b(?:medical|medication|medications|allerg|condition|doctor|appointment)\b/.test(normalized)) {
    areas.push("medical");
  }
  if (/\b(?:financial|finance|bill|bills|budget|money|payment|savings?)\b/.test(normalized)) {
    areas.push("financial");
  }
  if (/\b(?:mood|sleep|feeling|feelings|wellbeing|well-being)\b/.test(normalized)) {
    areas.push("mood");
  }
  if (/\b(?:task|tasks|progress|completed|completion|achievement|routine|accomplish|goal|goals)\b/.test(normalized)) {
    areas.push("progress");
  }
  return areas;
}

function areaLabel(area: CaregiverContextArea): string {
  switch (area) {
    case "medical":
      return "medical information";
    case "financial":
      return "financial information";
    case "mood":
      return "mood and sleep information";
    default:
      return "progress information";
  }
}

function restrictedAreaResponse(context: AdaptAIContext, area: CaregiverContextArea): string {
  return `I can’t share ${context.identity.displayName}’s ${areaLabel(
    area
  )} because this caregiver relationship does not grant AdaptAI access to it.`;
}

function isProgressSummaryRequest(message: string): boolean {
  const normalized = normalize(message);
  return /\b(?:how is .* doing|what did .* (?:complete|accomplish)|progress|completed tasks?|task completion|what has .* done)\b/.test(
    normalized
  );
}

/**
 * Return a deterministic caregiver summary or a permission explanation.
 * Returning undefined lets the normal AdaptAI modules handle requests that
 * are not caregiver-specific.
 */
export function buildCaregiverContextResponse(
  message: string,
  context: AdaptAIContext
): string | undefined {
  if (context.caregiverContext?.role === "care_recipient") return undefined;

  const areas = requestedAreas(message);
  const restrictedArea = areas.find((area) =>
    context.caregiverContext?.restrictedAreas.includes(area)
  );
  if (restrictedArea) return restrictedAreaResponse(context, restrictedArea);

  if (!isProgressSummaryRequest(message)) return undefined;
  if (!context.caregiverContext?.permittedAreas.includes("progress")) {
    return restrictedAreaResponse(context, "progress");
  }

  const tasks = context.tasks?.today ?? [];
  const completed = tasks.filter((task) => task.isCompleted).length;
  return `${context.identity.displayName} completed ${completed} of ${tasks.length} tasks today.`;
}

export function buildCaregiverContextNote(context: AdaptAIContext): string | undefined {
  const caregiverContext = context.caregiverContext;
  if (!caregiverContext || caregiverContext.role === "care_recipient") return undefined;
  if (caregiverContext.restrictedAreas.length === 0) return undefined;
  return "This briefing includes only information you’re authorized to view.";
}