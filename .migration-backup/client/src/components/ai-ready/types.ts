import type { ReactNode } from "react";

export type DemoUiState =
  | "idle"
  | "contextual"
  | "suggested"
  | "in-progress"
  | "completed"
  | "transition"
  | "encouragement";

export type GuideTone = "calm" | "focus" | "success" | "transition" | "support";

export interface GuideActionData {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export interface GuideMessageData {
  message: string;
  context?: string;
  state?: DemoUiState;
  tone?: GuideTone;
}

export interface ContextualSuggestionData extends GuideMessageData {
  title: string;
  action?: GuideActionData;
}

export interface PreparationStep {
  id: string;
  label: string;
  completed?: boolean;
  detail?: string;
}

export interface RoutineProgressData {
  title: string;
  currentStep?: string;
  completedSteps: number;
  totalSteps: number;
  estimatedRemainingMinutes?: number;
  state?: DemoUiState;
  guidance?: string;
}

export interface GuideInsightData {
  message: string;
  context?: string;
  sourceLabel?: string;
  state?: DemoUiState;
}