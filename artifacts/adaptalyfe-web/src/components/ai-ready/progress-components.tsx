import { CalendarClock, Check, Clock3, Flag, ListChecks, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { PreparationStep, RoutineProgressData } from "./types";

export function EventPreparationCard({
  title,
  time,
  detail,
  steps,
  actionLabel,
  onAction,
}: {
  title: string;
  time?: string;
  detail?: string;
  steps: PreparationStep[];
  actionLabel?: string;
  onAction?: () => void;
}) {
  const completedCount = steps.filter((step) => step.completed).length;
  const remainingCount = Math.max(steps.length - completedCount, 0);

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="px-4 pb-3 pt-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base text-slate-900">{title}</CardTitle>
              {detail && <p className="mt-1 text-sm text-slate-600">{detail}</p>}
            </div>
          </div>
          {time && <Badge variant="outline" className="shrink-0 border-violet-200 text-violet-800">{time}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 sm:px-5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Preparation</span>
          <span>{remainingCount ? `${remainingCount} remaining` : "Ready"}</span>
        </div>
        {steps.length > 0 ? (
          <ul className="space-y-2">
            {steps.map((step) => (
              <li key={step.id} className="flex items-start gap-2.5 text-sm">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  step.completed ? "bg-emerald-100 text-emerald-700" : "border border-slate-300 text-transparent"
                }`}>
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                <span className={step.completed ? "text-slate-500 line-through" : "text-slate-800"}>
                  <span className="sr-only">{step.completed ? "Completed: " : "Not completed: "}</span>
                  {step.label}
                  {step.detail && <span className="ml-1 text-xs text-slate-500">· {step.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No preparation steps are linked yet.</p>
        )}
        {actionLabel && (
          <Button type="button" onClick={onAction} variant="outline" className="min-h-11 w-full rounded-xl border-violet-200 text-violet-800 hover:bg-violet-50">
            <Flag className="h-4 w-4" aria-hidden="true" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function RoutineProgressCard({
  title,
  currentStep,
  completedSteps,
  totalSteps,
  estimatedRemainingMinutes,
  state = "in-progress",
  guidance,
}: RoutineProgressData) {
  const safeTotal = Math.max(totalSteps, 0);
  const progressValue = safeTotal > 0 ? Math.round((completedSteps / safeTotal) * 100) : 0;
  const isComplete = safeTotal > 0 && completedSteps >= safeTotal;

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="px-4 pb-3 pt-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ListChecks className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base text-slate-900">{title}</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                {isComplete ? "Routine complete" : currentStep ? `Current step: ${currentStep}` : "Ready when you are"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={isComplete ? "shrink-0 border-emerald-200 text-emerald-800" : "shrink-0 border-amber-200 text-amber-800"}>
            {state === "in-progress" && !isComplete ? "In progress" : isComplete ? "Complete" : "Ready"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 sm:px-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">{completedSteps} of {safeTotal} steps</span>
          <span className="font-semibold text-slate-900">{progressValue}%</span>
        </div>
        <Progress value={progressValue} className="h-2.5 bg-amber-100 [&>div]:bg-amber-500" aria-label={`${title} progress`} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          {estimatedRemainingMinutes !== undefined && !isComplete && (
            <span className="flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              About {estimatedRemainingMinutes} min left
            </span>
          )}
          {guidance && <span className="text-slate-600">{guidance}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function IndependenceProgressCard({
  value,
  label = "Building independence",
  detail = "Small steps and successful transitions become confidence over time.",
}: {
  value: number;
  label?: string;
  detail?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <Card className="border-slate-200/80 bg-gradient-to-br from-teal-50/80 to-white shadow-sm">
      <CardContent className="space-y-3 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-900">{label}</h3>
              <span className="text-lg font-bold text-teal-800">{safeValue}%</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{detail}</p>
          </div>
        </div>
        <Progress value={safeValue} className="h-2 bg-teal-100 [&>div]:bg-teal-600" aria-label={`${label} ${safeValue}%`} />
      </CardContent>
    </Card>
  );
}

export function TaskJourneySummary({
  completedTasks,
  totalTasks,
  nextTaskTitle,
  remainingMinutes,
}: {
  completedTasks: number;
  totalTasks: number;
  nextTaskTitle?: string;
  remainingMinutes?: number;
}) {
  const progressValue = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="border-slate-200/80 bg-gradient-to-r from-white to-teal-50/60 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">Task journey</Badge>
              <span className="text-xs font-medium text-slate-500">
                {completedTasks} complete · {Math.max(totalTasks - completedTasks, 0)} remaining
              </span>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {nextTaskTitle ? `Next manageable step: ${nextTaskTitle}` : "Your task list is ready"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {nextTaskTitle
                ? "Start when you're ready, mark it complete, and let progress build naturally."
                : "Add a task when there is something you want to remember or practice."}
            </p>
          </div>
          <div className="min-w-[150px] rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Progress</span>
              <span className="font-bold text-teal-800">{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="mt-2 h-2 bg-teal-100 [&>div]:bg-teal-600" aria-label={`Task progress ${progressValue}%`} />
            {remainingMinutes !== undefined && remainingMinutes > 0 && (
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                About {remainingMinutes} min remaining
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}