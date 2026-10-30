import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Check, ChevronDown, ChevronRight, CalendarDays, CalendarClock, CalendarRange,
  Clock, Heart, Lightbulb, ListChecks, Moon, Phone, PlayCircle, ArrowRight, Sparkles, Star, Sun,
  SunMedium, Wind,
} from "lucide-react";
import type { Appointment, CalendarEvent, DailyTask, MoodEntry } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { trackMoodEntry } from "@/lib/firebase";
import { useToggleDailyTask } from "@/hooks/useToggleDailyTask";
import { moodMessages } from "@/components/mood-module";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Period = "morning" | "afternoon" | "evening" | "night" | "anytime";
type ScheduleView = "daily" | "weekly" | "monthly";

const moodOptions = [
  { value: 1, emoji: "😢", label: "Sad" },
  { value: 2, emoji: "😐", label: "Okay" },
  { value: 3, emoji: "😊", label: "Good" },
  { value: 4, emoji: "😃", label: "Great" },
  { value: 5, emoji: "🤩", label: "Amazing" },
];

const PERIODS: { id: Period; shortLabel: string; label: string; icon: typeof Sun; iconClass: string; subtitle: string }[] = [
  { id: "morning", shortLabel: "Morning", label: "Morning Routine", icon: Sun, iconClass: "text-amber-500", subtitle: "Get ready for the day. A few simple steps." },
  { id: "afternoon", shortLabel: "Afternoon", label: "Afternoon Routine", icon: SunMedium, iconClass: "text-orange-400", subtitle: "Keep the day moving. A few simple steps." },
  { id: "evening", shortLabel: "Evening", label: "Evening Routine", icon: Moon, iconClass: "text-violet-500", subtitle: "Wind down and get ready for tomorrow." },
  { id: "night", shortLabel: "Night", label: "Night Routine", icon: Sparkles, iconClass: "text-purple-500", subtitle: "Settle in for the night. A few simple steps." },
  { id: "anytime", shortLabel: "Anytime", label: "Anytime", icon: Star, iconClass: "text-slate-400", subtitle: "Flexible tasks you can do whenever." },
];

const SCHEDULE_VIEWS: { id: ScheduleView; label: string; icon: typeof CalendarDays; title: string }[] = [
  { id: "daily", label: "Daily", icon: CalendarDays, title: "Today's Schedule" },
  { id: "weekly", label: "Weekly", icon: CalendarRange, title: "This Week" },
  { id: "monthly", label: "Monthly", icon: CalendarClock, title: "This Month" },
];

const RESOURCES = [
  { href: "/resources", title: "Breathing Exercise", sub: "Take a moment to relax", icon: Wind, tile: "bg-violet-100 text-violet-600" },
  { href: "/resources", title: "Coping Strategies", sub: "Helpful ideas for your day", icon: Lightbulb, tile: "bg-violet-100 text-violet-600" },
  { href: "/caregiver", title: "Trusted Contacts", sub: "People who can support you", icon: Phone, tile: "bg-rose-100 text-rose-600" },
];

function taskPeriod(task: DailyTask): Period {
  const raw = String(task.category || "").toLowerCase();
  if (raw.includes("anytime") || raw.includes("any time")) return "anytime";
  if (raw.includes("afternoon") || raw.includes("noon")) return "afternoon";
  if (raw.includes("evening")) return "evening";
  if (raw.includes("night")) return "night";
  if (raw.includes("morning")) return "morning";
  const time = String(task.scheduledTime || "").trim();
  if (!time) return "anytime";
  const hour = Number(time.split(":")[0]);
  if (Number.isNaN(hour)) return "anytime";
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night"; // 21:00 – 04:59
}

/** Daily / Weekly / Monthly by task.frequency */
function taskMatchesView(task: DailyTask, view: ScheduleView): boolean {
  const freq = String(task.frequency || "daily").toLowerCase();
  if (view === "daily") return freq === "daily" || !task.frequency;
  return freq === view;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export default function DashboardHomeLayout() {
  const [period, setPeriod] = useState<Period>("morning");
  const [scheduleView, setScheduleView] = useState<ScheduleView>("daily");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [pendingMood, setPendingMood] = useState<number | null>(null);
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scheduleOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setScheduleOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [scheduleOpen]);

  const { data: tasksData } = useQuery<DailyTask[]>({ queryKey: ["/api/daily-tasks"] });
  const { data: todayMood } = useQuery<MoodEntry>({ queryKey: ["/api/mood-entries/today"] });
  const { data: appointmentsData } = useQuery<Appointment[]>({ queryKey: ["/api/appointments"] });
  const { data: eventsData } = useQuery<CalendarEvent[]>({ queryKey: ["/api/calendar-events"] });

  const tasks = Array.isArray(tasksData) ? tasksData : [];
  const appointments = Array.isArray(appointmentsData) ? appointmentsData : [];
  const events = Array.isArray(eventsData) ? eventsData : [];

  const periodMeta = PERIODS.find((p) => p.id === period)!;
  const viewMeta = SCHEDULE_VIEWS.find((v) => v.id === scheduleView)!;

  const periodTasks = useMemo(
    () =>
      tasks
        .filter((t) => taskPeriod(t) === period && taskMatchesView(t, scheduleView))
        .sort((a, b) => Number(!!a.isCompleted) - Number(!!b.isCompleted)),
    [tasks, period, scheduleView],
  );
  const periodDone = periodTasks.filter((t) => t.isCompleted).length;
  const periodProgress = periodTasks.length ? Math.round((periodDone / periodTasks.length) * 100) : 0;
  const minutesLeft = periodTasks
    .filter((t) => !t.isCompleted)
    .reduce((sum, t) => sum + (Number(t.estimatedMinutes) || 0), 0);

  const scheduleItems = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + (scheduleView === "monthly" ? 30 : scheduleView === "weekly" ? 7 : 1));
    const fmtTime = (d: Date) =>
      scheduleView === "daily"
        ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
        : d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

    const fromAppointments = appointments
      .map((a) => ({ a, d: new Date(a.appointmentDate || "") }))
      .filter(({ d }) => !Number.isNaN(d.getTime()) && d >= start && d < end)
      .map(({ a, d }) => ({
        id: `appt-${a.id}`,
        sort: d.getTime(),
        time: a.appointmentDate?.includes("T") || scheduleView !== "daily" ? fmtTime(d) : "All day",
        title: a.title || "Appointment",
        sub: a.location || a.provider || a.description || "",
        kind: "appointment" as const,
      }));

    const fromEvents = events
      .map((e) => ({ e, d: new Date(e.startDate || "") }))
      .filter(({ d }) => !Number.isNaN(d.getTime()) && d >= start && d < end)
      .map(({ e, d }) => ({
        id: `evt-${e.id}`,
        sort: d.getTime(),
        time: e.allDay && scheduleView === "daily" ? "All day" : fmtTime(d),
        title: e.title || "Event",
        sub: e.description || e.location || "",
        kind: "event" as const,
      }));

    // Show matching tasks on Weekly / Monthly
    const fromTasks =
      scheduleView === "daily"
        ? []
        : tasks
            .filter((t) => taskMatchesView(t, scheduleView))
            .map((t, i) => {
              const due = t.dueDate ? new Date(t.dueDate) : null;
              const sort = due && !Number.isNaN(due.getTime()) ? due.getTime() : start.getTime() + i;
              return {
                id: `task-${t.id}`,
                sort,
                time: due && !Number.isNaN(due.getTime()) ? fmtTime(due) : cap(scheduleView),
                title: t.title || "Task",
                sub: t.description || `${cap(taskPeriod(t))} · ${t.estimatedMinutes ? `${t.estimatedMinutes} min` : "Flexible"}`,
                kind: "task" as const,
              };
            });

    return [...fromAppointments, ...fromEvents, ...fromTasks].sort((x, y) => x.sort - y.sort).slice(0, 6);
  }, [appointments, events, tasks, scheduleView]);

  const moodMutation = useMutation({
    mutationFn: async (mood: number) => apiRequest("POST", "/api/mood-entries", { mood }),
    onSuccess: (_data, moodValue) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mood-entries/today"] });
      setShowMoodDialog(true);
      try {
        trackMoodEntry(moodValue, moodOptions.find((m) => m.value === moodValue)?.label || "unknown");
      } catch {
        // analytics is best-effort
      }
    },
  });

  const toggleTask = useToggleDailyTask();

  const firstIncomplete = periodTasks.find((t) => !t.isCompleted);
  const routineDone = periodTasks.length > 0 && !firstIncomplete;
  const continueLabel = firstIncomplete
    ? `Continue ${period} routine`
    : routineDone
      ? `${cap(period)} routine complete`
      : "Open daily tasks";

  const PeriodIcon = periodMeta.icon;
  const ViewIcon = viewMeta.icon;

  return (
    <div className="space-y-5 lg:flex lg:flex-1 lg:flex-col">
      <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5 lg:flex-1">
        {/* ── Routine + Schedule ─────────────────────────────── */}
        <section className="flex flex-col rounded-3xl bg-white/80 border border-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div
              className="flex flex-1 flex-wrap gap-1.5"
              role="tablist"
              aria-label="Routine period"
            >
              {PERIODS.map((p) => {
                const Icon = p.icon;
                const active = period === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    title={p.label}
                    onClick={() => setPeriod(p.id)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[15px] transition-colors ${
                      active
                        ? "bg-teal-50 text-slate-900 font-semibold shadow-[inset_0_-3px_0_0_#14b8a6]"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${p.iconClass}`} />
                    <span>{p.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative self-end sm:self-start shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setScheduleOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 sm:px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                aria-haspopup="listbox"
                aria-expanded={scheduleOpen}
                aria-label="Task frequency"
              >
                <CalendarDays className="h-4 w-4" />
                <span>{viewMeta.label}</span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
              {scheduleOpen && (
                <div className="absolute right-0 top-12 z-30 w-48 rounded-xl border border-slate-200 bg-white shadow-xl py-1.5" role="listbox">
                  {SCHEDULE_VIEWS.map((v) => {
                    const Icon = v.icon;
                    const count = tasks.filter((t) => taskMatchesView(t, v.id)).length;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        role="option"
                        aria-selected={scheduleView === v.id}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setScheduleView(v.id);
                          setScheduleOpen(false);
                        }}
                      >
                        <Check className={`h-4 w-4 ${scheduleView === v.id ? "text-slate-800" : "invisible"}`} />
                        <Icon className="h-4 w-4 text-slate-600" />
                        <span className="flex-1 text-left">{v.label}</span>
                        <span className="tabular-nums text-slate-400 text-xs">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Routine card */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <PeriodIcon className={`h-7 w-7 shrink-0 ${periodMeta.iconClass}`} />
                  <h3 className="text-xl font-bold text-slate-900 truncate">{periodMeta.label}</h3>
                </div>
                <span
                  className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full border ${
                    routineDone
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {routineDone ? "Done" : "In progress"}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2">{periodMeta.subtitle}</p>

              <div className="mt-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">{periodDone} of {periodTasks.length} steps</span>
                  <span className="font-semibold text-slate-900">{periodProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-teal-50 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${periodProgress}%` }} />
                </div>
              </div>

              <ul className={`mt-4 space-y-2.5 pr-0.5 ${periodTasks.length === 0 ? "flex flex-1 flex-col" : "max-h-64 overflow-y-auto"}`}>
                {periodTasks.length === 0 && (
                  <li className="flex min-h-[96px] flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500">
                    No {scheduleView} {period} steps yet.
                  </li>
                )}
                {periodTasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 text-left rounded-xl border border-slate-100 bg-white px-3.5 py-3 hover:border-teal-200 hover:bg-teal-50/30 transition-colors disabled:opacity-70"
                      onClick={() => toggleTask.toggle(task)}
                      disabled={toggleTask.isPending}
                    >
                      {task.isCompleted ? (
                        <span className="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="h-6 w-6 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                      <span className={`flex-1 text-sm ${task.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {task.title || "Task"}
                      </span>
                      {!task.isCompleted && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-5">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {minutesLeft > 0 ? `About ${minutesLeft} min left` : "Nothing left right now"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-teal-500" />
                    One step at a time is enough.
                  </span>
                </div>
                <Link href="/daily-tasks">
                  <span className="flex items-center justify-between gap-3 w-full rounded-2xl bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white px-5 h-14 cursor-pointer shadow-sm transition-colors">
                    <PlayCircle className="h-6 w-6 shrink-0" />
                    <span className="flex-1 min-w-0 text-center font-semibold truncate">{continueLabel}</span>
                    <ArrowRight className="h-5 w-5 shrink-0" />
                  </span>
                </Link>
              </div>
            </div>

            {/* Schedule column */}
            <div className="flex flex-col gap-4">
              <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center">
                    <ViewIcon className="h-5 w-5 text-sky-600" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{viewMeta.title}</h3>
                </div>

                <ol className="relative space-y-3 before:absolute before:left-[6px] before:top-4 before:bottom-4 before:w-px before:bg-slate-200">
                  <li className="relative pl-6">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-teal-600 ring-4 ring-white" />
                    <Link href="/daily-tasks">
                      <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/80 px-4 py-3 cursor-pointer hover:bg-emerald-50">
                        <PeriodIcon className={`h-6 w-6 mt-1 shrink-0 ${periodMeta.iconClass}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-teal-700">Now</p>
                            <span className="shrink-0 whitespace-nowrap text-[11px] font-medium px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                              {routineDone ? "Done" : "In progress"}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-900">{cap(period)} routine</p>
                          <p className="text-sm text-slate-500 truncate">{periodMeta.subtitle}</p>
                        </div>
                      </div>
                    </Link>
                  </li>

                  {scheduleItems.map((item) => (
                    <li key={item.id} className="relative pl-6">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-sky-400 ring-4 ring-white" />
                      <Link href={item.kind === "task" ? "/daily-tasks" : "/calendar"}>
                        <div className="flex items-center gap-3 rounded-2xl px-2 py-2 cursor-pointer hover:bg-slate-50">
                          <span
                            className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                              item.kind === "appointment"
                                ? "bg-violet-100 text-violet-600"
                                : item.kind === "task"
                                  ? "bg-teal-100 text-teal-600"
                                  : "bg-sky-100 text-sky-600"
                            }`}
                          >
                            {item.kind === "appointment" ? (
                              <CalendarClock className="h-5 w-5" />
                            ) : item.kind === "task" ? (
                              <ListChecks className="h-5 w-5" />
                            ) : (
                              <CalendarDays className="h-5 w-5" />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-sky-600">{item.time}</p>
                            <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                            {item.sub && <p className="text-sm text-slate-500 truncate">{item.sub}</p>}
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                        </div>
                      </Link>
                    </li>
                  ))}

                  {scheduleItems.length === 0 && (
                    <li className="relative pl-6">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-slate-300 ring-4 ring-white" />
                      <Link href="/calendar">
                        <p className="px-2 py-2 text-sm text-slate-500 hover:text-slate-700 cursor-pointer">
                          Nothing else scheduled. <span className="text-sky-600 font-medium">Open calendar</span>
                        </p>
                      </Link>
                    </li>
                  )}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mood + Quick Resources ─────────────────────────── */}
        <aside className="rounded-3xl border border-white bg-gradient-to-b from-rose-50 via-orange-50/40 to-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-5 lg:grid lg:grid-cols-2 lg:gap-8 2xl:block">
          <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-rose-100 flex items-center justify-center">
                <Heart className="h-5 w-5 text-rose-500" />
              </span>
              <h3 className="text-xl font-bold text-slate-900">Mood Check-in</h3>
            </div>
            {todayMood ? (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">Logged</span>
            ) : (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-rose-100 text-rose-600">Required</span>
            )}
          </div>
          <p className="text-lg text-slate-800 mt-5 mb-1">How are you feeling today?</p>
          <p className={`text-xs mb-4 ${todayMood ? "text-emerald-700" : "text-rose-600"}`}>
            {todayMood
              ? "Your mood has been recorded for today."
              : "Daily check-in required — complete it to continue using Adaptalyfe."}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {moodOptions.map((opt) => {
              const selected = todayMood?.mood === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={!!todayMood || moodMutation.isPending}
                  onClick={() => {
                    setPendingMood(opt.value);
                    moodMutation.mutate(opt.value);
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border bg-white py-3 shadow-sm transition ${
                    selected ? "border-teal-400 ring-2 ring-teal-200" : "border-slate-100 hover:border-rose-200 hover:-translate-y-0.5"
                  } ${todayMood && !selected ? "opacity-40" : ""}`}
                >
                  <span className="text-2xl sm:text-3xl leading-none">{opt.emoji}</span>
                  <span className="text-[11px] text-slate-600">{opt.label}</span>
                </button>
              );
            })}
          </div>

          </div>

          <div className="h-px bg-rose-100 my-6 lg:hidden 2xl:block" />

          <div>
          <h3 className="text-base font-bold text-slate-900 mb-3">Quick Resources</h3>
          <div className="space-y-3">
            {RESOURCES.map((r) => {
              const Icon = r.icon;
              return (
                <Link key={r.title} href={r.href}>
                  <span className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3.5 cursor-pointer hover:border-violet-200 transition-colors">
                    <span className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${r.tile}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-slate-900">{r.title}</span>
                      <span className="block text-sm text-slate-500 truncate">{r.sub}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                  </span>
                </Link>
              );
            })}
          </div>
          </div>
        </aside>
      </div>

      {pendingMood && moodMessages[pendingMood] && (
        <Dialog open={showMoodDialog} onOpenChange={setShowMoodDialog}>
          <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden gap-0">
            <div className={`bg-gradient-to-r ${moodMessages[pendingMood].color} px-6 py-5`}>
              <DialogHeader className="text-left">
                <div className="flex items-center gap-3">
                  <span className="text-4xl leading-none">{moodOptions.find((m) => m.value === pendingMood)?.emoji}</span>
                  <div>
                    <DialogTitle className="text-white text-xl">{moodMessages[pendingMood].title}</DialogTitle>
                    <p className="text-white/85 text-sm mt-1">
                      You're feeling {moodOptions.find((m) => m.value === pendingMood)?.label.toLowerCase()} today
                    </p>
                  </div>
                </div>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-4">
              <DialogDescription className="text-base text-slate-700 leading-relaxed">
                {moodMessages[pendingMood].message}
              </DialogDescription>
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">Daily Tip</p>
                  <p className="text-sm text-amber-700">{moodMessages[pendingMood].tip}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMoodDialog(false)}
                className={`w-full rounded-xl bg-gradient-to-r ${moodMessages[pendingMood].color} text-white font-semibold py-3 hover:opacity-90`}
              >
                Got it, thanks!
              </button>
              <p className="text-xs text-slate-400 text-center">Your mood has been recorded for today.</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
