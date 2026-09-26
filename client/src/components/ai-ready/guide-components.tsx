import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Lightbulb,
  MoveRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  ContextualSuggestionData,
  DemoUiState,
  GuideInsightData,
  GuideMessageData,
} from "./types";

const stateLabels: Record<DemoUiState, string> = {
  idle: "Ready",
  contextual: "Context",
  suggested: "Suggested",
  "in-progress": "In progress",
  completed: "Complete",
  transition: "Next",
  encouragement: "Encouragement",
};

const toneStyles = {
  calm: {
    surface: "border-sky-100 bg-sky-50/70",
    icon: "bg-sky-100 text-sky-700",
    text: "text-sky-900",
  },
  focus: {
    surface: "border-amber-100 bg-amber-50/70",
    icon: "bg-amber-100 text-amber-700",
    text: "text-amber-900",
  },
  success: {
    surface: "border-emerald-100 bg-emerald-50/70",
    icon: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-900",
  },
  transition: {
    surface: "border-violet-100 bg-violet-50/70",
    icon: "bg-violet-100 text-violet-700",
    text: "text-violet-900",
  },
  support: {
    surface: "border-teal-100 bg-teal-50/70",
    icon: "bg-teal-100 text-teal-700",
    text: "text-teal-900",
  },
} as const;

function StateBadge({ state }: { state: DemoUiState }) {
  return (
    <Badge variant="outline" className="border-current/20 bg-white/70 text-[11px] font-medium">
      {stateLabels[state]}
    </Badge>
  );
}

export interface GuideCardProps {
  title?: string;
  description?: string;
  state?: DemoUiState;
  children: ReactNode;
  className?: string;
}

export function GuideCard({
  title = "Adaptalyfe Guide",
  description = "Proactive support for what matters next.",
  state = "contextual",
  children,
  className = "",
}: GuideCardProps) {
  return (
    <Card className={`overflow-hidden border-slate-200/80 bg-white shadow-sm ${className}`}>
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-teal-50/60 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base text-slate-900">{title}</CardTitle>
              <StateBadge state={state} />
            </div>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-5">{children}</CardContent>
    </Card>
  );
}

export function GuideMessage({
  message,
  context,
  state = "contextual",
  tone = "calm",
}: GuideMessageData) {
  const style = toneStyles[tone];

  return (
    <div className={`rounded-2xl border p-4 ${style.surface}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.icon}`}>
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          {context && (
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${style.text}`}>
              {context}
            </p>
          )}
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function GuideAction({
  label,
  description,
  icon,
  onClick,
  disabled = false,
}: {
  label: string;
  description?: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className="min-h-11 w-full justify-between rounded-xl bg-teal-700 px-4 text-left text-white shadow-sm hover:bg-teal-800 sm:w-auto"
    >
      <span className="flex min-w-0 items-center gap-2">
        {icon || <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
        <span className="min-w-0">
          <span className="block truncate font-semibold">{label}</span>
          {description && <span className="block truncate text-xs font-normal text-teal-100">{description}</span>}
        </span>
      </span>
      <ArrowRight className="ml-3 h-4 w-4 shrink-0" aria-hidden="true" />
    </Button>
  );
}

export function ContextualSuggestion({
  title,
  message,
  action,
  state = "suggested",
  tone = "focus",
}: ContextualSuggestionData) {
  const style = toneStyles[tone];

  return (
    <div className={`rounded-2xl border p-4 ${style.surface}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.icon}`}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-semibold ${style.text}`}>{title}</h3>
            <StateBadge state={state} />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{message}</p>
          {action && (
            <div className="mt-3">
              <GuideAction {...action} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TransitionPrompt({
  currentLabel,
  nextLabel,
  message,
  actionLabel,
  onAction,
}: {
  currentLabel: string;
  nextLabel: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
        <MoveRight className="h-4 w-4" aria-hidden="true" />
        Next transition
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm">{currentLabel}</span>
        <ArrowRight className="h-4 w-4 text-violet-500" aria-hidden="true" />
        <span className="rounded-lg bg-violet-100 px-2.5 py-1.5 text-violet-900">{nextLabel}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{message}</p>
      {actionLabel && (
        <Button type="button" variant="outline" onClick={onAction} className="mt-3 min-h-11 rounded-xl border-violet-200 bg-white">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function EncouragementCard({
  message,
  detail,
  state = "encouragement",
}: {
  message: string;
  detail?: string;
  state?: DemoUiState;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Heart className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-emerald-900">{message}</p>
            <StateBadge state={state} />
          </div>
          {detail && <p className="mt-1 text-sm text-slate-600">{detail}</p>}
        </div>
      </div>
    </div>
  );
}

export function GuideInsight({
  message,
  context,
  sourceLabel = "Guide insight",
  state = "contextual",
}: GuideInsightData) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">{sourceLabel}</p>
            <StateBadge state={state} />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{message}</p>
          {context && <p className="mt-2 text-xs text-slate-500">{context}</p>}
        </div>
      </div>
    </div>
  );
}