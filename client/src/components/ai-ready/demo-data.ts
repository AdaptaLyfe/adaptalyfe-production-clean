import type { PreparationStep, RoutineProgressData } from "./types";

/**
 * One coherent fictional day for future demos. This data stays isolated from
 * authenticated queries and is only used when a presentation needs a safe
 * visual state but the account has no schedule data yet.
 */
export const ethanDemoDay = {
  userName: "Ethan",
  currentActivity: "Morning preparation",
  currentActivityDetail: "A few simple steps to get ready.",
  nextEvent: {
    title: "School",
    time: "8:30 AM",
    detail: "Before you leave",
  },
  laterEvent: {
    title: "Soccer practice",
    time: "4:30 PM",
    detail: "A little time to prepare this afternoon.",
  },
  preparationSteps: [
    { id: "dressed", label: "Get dressed", completed: true },
    { id: "teeth", label: "Brush teeth", completed: true },
    { id: "lunch", label: "Pack lunch", completed: false },
    { id: "bag", label: "Check school bag", completed: false },
  ] satisfies PreparationStep[],
  routine: {
    title: "Morning preparation",
    currentStep: "Pack lunch",
    completedSteps: 2,
    totalSteps: 4,
    estimatedRemainingMinutes: 10,
    state: "in-progress",
    guidance: "One step at a time is enough.",
  } satisfies RoutineProgressData,
  guidance: "You have time before school. Want to continue your morning preparation?",
};