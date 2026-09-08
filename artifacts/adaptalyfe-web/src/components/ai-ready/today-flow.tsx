import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Appointment, CalendarEvent, DailyTask, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ethanDemoDay } from "./demo-data";
import {
  ContextualSuggestion,
  EncouragementCard,
  GuideCard,
  GuideInsight,
  TransitionPrompt,
} from "./guide-components";
import {
  EventPreparationCard,
  IndependenceProgressCard,
  RoutineProgressCard,
} from "./progress-components";

type TimelineItem = {
  id: string;
  title: string;
  time?: string;
  detail?: string;
  kind: "appointment" | "event" | "task";
  startsAt: Date | null;
};

function toValidDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(value: Date | null) {
  if (!value) return undefined;
  return value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateContext(date: Date) {
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatMinutes(value: number | undefined) {
  return value ? `${value} min` : undefined;
}

async function fetchRequired<T>(url: string): Promise<T> {
  const response = await apiRequest("GET", url);
  const data = await response.json() as T | null;

  if (data === null || data === undefined) {
    throw new Error(`${url} returned unavailable data`);
  }

  return data;
}

function isSameLocalDay(value: Date | null, reference: Date) {
  return Boolean(
    value &&
      value.getFullYear() === reference.getFullYear() &&
      value.getMonth() === reference.getMonth() &&
      value.getDate() === reference.getDate(),
  );
}

function createLiveTimeline(
  appointments: Appointment[],
  calendarEvents: CalendarEvent[],
  tasks: DailyTask[],
) {
  const today = new Date();
  const todayDate = today.toLocaleDateString("en-CA");
  const appointmentItems: TimelineItem[] = appointments
    .filter((appointment) => {
      const startsAt = toValidDate(appointment.appointmentDate);
      return !appointment.isCompleted && isSameLocalDay(startsAt, today);
    })
    .map((appointment) => {
      const startsAt = toValidDate(appointment.appointmentDate);
      return {
        id: `appointment-${appointment.id}`,
        title: appointment.title,
        time: formatTime(startsAt),
        detail: appointment.location || appointment.provider || undefined,
        kind: "appointment" as const,
        startsAt,
      };
    });

  const eventItems: TimelineItem[] = calendarEvents
    .filter((event) => {
      const startsAt = toValidDate(event.startDate);
      const endsAt = toValidDate(event.endDate);
      return !event.isCompleted && (
        isSameLocalDay(startsAt, today) ||
        isSameLocalDay(endsAt, today) ||
        Boolean(startsAt && endsAt && startsAt < today && endsAt > today)
      );
    })
    .map((event) => {
      const startsAt = toValidDate(event.startDate);
      return {
        id: `event-${event.id}`,
        title: event.title,
        time: event.allDay ? "All day" : formatTime(startsAt),
        detail: event.location || event.category || undefined,
        kind: "event" as const,
        startsAt: event.allDay ? null : startsAt,
      };
    });

  const taskItems: TimelineItem[] = tasks
    .filter((task) => !task.isCompleted && task.scheduledTime)
    .map((task) => {
      const startsAt = toValidDate(`${todayDate}T${task.scheduledTime}`);
      return {
        id: `task-${task.id}`,
        title: task.title,
        time: startsAt ? formatTime(startsAt) : undefined,
        detail: task.category,
        kind: "task" as const,
        startsAt,
      };
    });

  return [...appointmentItems, ...eventItems, ...taskItems].sort((a, b) => {
    if (!a.startsAt && !b.startsAt) return 0;
    if (!a.startsAt) return 1;
    if (!b.startsAt) return -1;
    return a.startsAt.getTime() - b.startsAt.getTime();
  });
}

function TodaySection({
  eyebrow,
  title,
  detail,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{title}</h2>
          {detail && <p className="mt-1 text-sm leading-relaxed text-slate-600">{detail}</p>}
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

function TimelineItemRow({ item }: { item: TimelineItem }) {
  const Icon = item.kind === "task" ? ListChecks : CalendarDays;
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium text-slate-800">{item.title}</p>
        {item.detail && <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>}
      </div>
      {item.time && <Badge variant="outline" className="shrink-0 border-slate-200 text-xs text-slate-600">{item.time}</Badge>}
    </div>
  );
}

export default function TodayFlowCard() {
  const [, setLocation] = useLocation();
  const userQuery = useQuery<User>({
    queryKey: ["/api/user", "today-flow"],
    queryFn: () => fetchRequired<User>("/api/user"),
    retry: false,
  });
  const tasksQuery = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks", "today-flow"],
    queryFn: () => fetchRequired<DailyTask[]>("/api/daily-tasks"),
    retry: false,
  });
  const appointmentsQuery = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", "today-flow"],
    queryFn: () => fetchRequired<Appointment[]>("/api/appointments"),
    retry: false,
  });
  const calendarQuery = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events", "today-flow"],
    queryFn: () => fetchRequired<CalendarEvent[]>("/api/calendar-events"),
    retry: false,
  });

  const user = userQuery.data;
  const tasks = Array.isArray(tasksQuery.data) ? tasksQuery.data : [];
  const appointments = Array.isArray(appointmentsQuery.data) ? appointmentsQuery.data : [];
  const calendarEvents = Array.isArray(calendarQuery.data) ? calendarQuery.data : [];
  const isLoading = userQuery.isLoading || tasksQuery.isLoading || appointmentsQuery.isLoading || calendarQuery.isLoading;
  const hasQueryError = userQuery.isError || tasksQuery.isError || appointmentsQuery.isError || calendarQuery.isError;
  const queriesResolved = userQuery.isSuccess && tasksQuery.isSuccess && appointmentsQuery.isSuccess && calendarQuery.isSuccess;
  const hasAccountScheduleData = tasks.length > 0 || appointments.length > 0 || calendarEvents.length > 0;

  const liveTimeline = useMemo(
    () => createLiveTimeline(appointments, calendarEvents, tasks),
    [appointments, calendarEvents, tasks],
  );

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200/80 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-8 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-100" />
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="h-32 rounded-2xl bg-slate-100" />
              <div className="h-32 rounded-2xl bg-slate-100" />
              <div className="h-32 rounded-2xl bg-slate-100" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasQueryError) {
    return (
      <GuideCard
        title="Your day at a glance"
        description="Your existing information stays safe while this view reconnects."
        state="idle"
      >
        <div className="space-y-4">
          <GuideInsight
            sourceLabel="Live information unavailable"
            state="idle"
            message="We couldn't load every part of your day just now. No fictional schedule is being shown in its place."
            context="Try again to reconnect your tasks, appointments, and calendar."
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-xl border-teal-200 text-teal-800"
            onClick={() => {
              void userQuery.refetch();
              void tasksQuery.refetch();
              void appointmentsQuery.refetch();
              void calendarQuery.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      </GuideCard>
    );
  }

  const isDemo = queriesResolved && !hasAccountScheduleData;
  const displayName = isDemo ? ethanDemoDay.userName : user?.name || "there";
  const now = new Date();
  const pendingTasks = tasks.filter((task) => !task.isCompleted);
  const completedTasks = tasks.filter((task) => task.isCompleted);
  const taskProgress = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const nextTimelineItem: TimelineItem | undefined = isDemo
    ? {
        id: "demo-school",
        title: ethanDemoDay.nextEvent.title,
        time: ethanDemoDay.nextEvent.time,
        detail: ethanDemoDay.nextEvent.detail,
        kind: "event",
        startsAt: null,
      }
    : liveTimeline.find((item) => !item.startsAt || item.startsAt >= now);
  const laterTimelineItem: TimelineItem | undefined = isDemo
    ? {
        id: "demo-soccer",
        title: ethanDemoDay.laterEvent.title,
        time: ethanDemoDay.laterEvent.time,
        detail: ethanDemoDay.laterEvent.detail,
        kind: "event",
        startsAt: null,
      }
    : liveTimeline.filter((item) => item !== nextTimelineItem).find((item) => !item.startsAt || item.startsAt >= now);
  const currentTask = isDemo ? null : pendingTasks[0];
  const preparationSteps = isDemo
    ? ethanDemoDay.preparationSteps
    : pendingTasks.slice(0, 4).map((task) => ({
        id: `task-${task.id}`,
        label: task.title,
        completed: false,
        detail: formatMinutes(task.estimatedMinutes),
      }));
  const routineData = isDemo
    ? ethanDemoDay.routine
    : {
        title: "Today's task progress",
        currentStep: currentTask?.title,
        completedSteps: completedTasks.length,
        totalSteps: tasks.length,
        estimatedRemainingMinutes: pendingTasks.reduce((total, task) => total + (task.estimatedMinutes || 0), 0) || undefined,
        state: pendingTasks.length ? ("in-progress" as const) : ("completed" as const),
        guidance: pendingTasks.length ? "Choose one manageable next step." : "You made space for what matters today.",
      };

  const hasUpcoming = Boolean(nextTimelineItem);
  const guidanceMessage = isDemo
    ? ethanDemoDay.guidance
    : nextTimelineItem
      ? `${nextTimelineItem.title} is coming up${nextTimelineItem.time ? ` at ${nextTimelineItem.time}` : ""}. Start with one small preparation step.`
      : currentTask
        ? `Start with “${currentTask.title}” when you're ready.`
        : "Your schedule is clear. This is a good moment to choose what matters most.";

  return (
    <div className="space-y-4" data-testid="today-flow-card">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-teal-700" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">Today</p>
            {isDemo && <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[11px] text-teal-800">Demo preview</Badge>}
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Let's look at today, {displayName}</h2>
          <p className="mt-1 text-sm text-slate-600">{formatDateContext(now)} · One step at a time.</p>
        </div>
        <Button type="button" variant="outline" className="min-h-11 rounded-xl border-slate-200" onClick={() => setLocation("/daily-tasks")}>
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          Open tasks
        </Button>
      </div>

      <GuideCard
        title="Your day, brought together"
        description="A calm view of what matters now, what comes next, and how you're progressing."
        state={hasUpcoming ? "contextual" : "idle"}
      >
        <div className="space-y-4">
          <GuideMessageWrapper message={guidanceMessage} hasUpcoming={hasUpcoming} />

          <div className="grid gap-3 lg:grid-cols-3">
            <TodaySection
              eyebrow="Now"
              title={isDemo ? ethanDemoDay.currentActivity : currentTask?.title || "A clear moment"}
              detail={isDemo ? ethanDemoDay.currentActivityDetail : currentTask ? currentTask.description : "Choose a task or enjoy a pause before what comes next."}
              icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
            >
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {currentTask?.estimatedMinutes ? `About ${currentTask.estimatedMinutes} min` : isDemo ? "Gentle pace" : "No rush"}
              </div>
            </TodaySection>

            <TodaySection
              eyebrow="Next"
              title={nextTimelineItem?.title || "Nothing scheduled yet"}
              detail={nextTimelineItem?.detail || "Your Guide will keep this space ready as your day fills in."}
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              {nextTimelineItem?.time && <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-800">{nextTimelineItem.time}</Badge>}
            </TodaySection>

            <TodaySection
              eyebrow="Later"
              title={laterTimelineItem?.title || "Room for what matters"}
              detail={laterTimelineItem?.detail || "Progress is built from small, repeatable steps."}
              icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            >
              {laterTimelineItem?.time && <Badge variant="outline" className="border-slate-200 text-slate-600">{laterTimelineItem.time}</Badge>}
            </TodaySection>
          </div>

          {nextTimelineItem && (
            <TransitionPrompt
              currentLabel={isDemo ? ethanDemoDay.currentActivity : currentTask?.title || "Now"}
              nextLabel={nextTimelineItem.title}
              message={isDemo ? "You have time before school. Preparing a little now can make the transition easier." : guidanceMessage}
              actionLabel={nextTimelineItem.kind === "task" ? "Open tasks" : "Open calendar"}
              onAction={() => setLocation(nextTimelineItem.kind === "task" ? "/daily-tasks" : "/calendar")}
            />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <EventPreparationCard
              title={isDemo ? ethanDemoDay.nextEvent.title : nextTimelineItem?.title || "Next activity"}
              time={isDemo ? ethanDemoDay.nextEvent.time : nextTimelineItem?.time}
              detail={isDemo ? ethanDemoDay.nextEvent.detail : nextTimelineItem ? "Related tasks and preparation in one place." : "Add an event to start a preparation path."}
              steps={preparationSteps}
              actionLabel={preparationSteps.length ? "Continue preparation" : undefined}
              onAction={() => setLocation("/daily-tasks")}
            />
            <RoutineProgressCard {...routineData} />
          </div>

          <IndependenceProgressCard
            value={isDemo ? 50 : taskProgress}
            label={isDemo ? "Building confidence" : "Today's progress"}
            detail={isDemo ? "Every completed step helps make the next transition feel more familiar." : `${completedTasks.length} of ${tasks.length} tasks complete. Progress is about consistency, not perfection.`}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <ContextualSuggestion
              title="Your primary next action"
              message={guidanceMessage}
              tone="support"
              action={{
                id: "today-primary-action",
                label: isDemo ? "Start preparation" : currentTask ? "Open next task" : "Open tasks",
                description: "Keep it simple",
                icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
                onClick: () => setLocation("/daily-tasks"),
              }}
            />
            <EncouragementCard
              message={isDemo ? "You do not have to do everything at once." : completedTasks.length ? "Nice work making progress today." : "A small start still counts."}
              detail="Adaptalyfe is here to support the next step, not rush the whole day."
            />
          </div>

          {liveTimeline.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Your timeline</p>
                <Button type="button" variant="link" className="h-auto p-0 text-xs text-teal-800" onClick={() => setLocation("/calendar")}>
                  View calendar
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {liveTimeline.slice(0, 4).map((item) => <TimelineItemRow item={item} key={item.id} />)}
              </div>
            </div>
          )}

          <GuideInsight
            message={isDemo ? "This demo state is ready to receive real Guide recommendations later." : "This presentation is powered by your existing tasks and schedule. Future Guide intelligence can add richer context without changing the experience."}
            context="Proactive guidance stays separate from AdaptAI chat."
            sourceLabel="Future-ready foundation"
          />
        </div>
      </GuideCard>
    </div>
  );
}

function GuideMessageWrapper({ message, hasUpcoming }: { message: string; hasUpcoming: boolean }) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
        {hasUpcoming ? "A helpful next step" : "A gentle check-in"}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate-700">{message}</p>
      <p className="mt-3 flex items-center gap-2 text-xs font-medium text-teal-800">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Guidance, not pressure
      </p>
    </div>
  );
}