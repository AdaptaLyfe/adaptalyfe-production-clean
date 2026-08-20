/**
 * DailyGuideCard — Time-aware check-in briefing card
 *
 * Surfaces a Morning / Afternoon / Evening check-in with the user's
 * AI-generated day summary, task highlights grouped by time period,
 * appointments, and next action.
 *
 * States:
 *  - Loading  → skeleton matching the card shape
 *  - Error    → subtle unavailable notice
 *  - Success  → full check-in layout
 */

import {
  Sunrise,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  AlertCircle,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDailyGuide, type DailyGuideHighlight } from "@/hooks/useDailyGuide";

// ─── Time-of-day config ─────────────────────────────────────── updated: 2026-08-13 ──

type Period = "morning" | "afternoon" | "evening" | "night";

interface PeriodConfig {
  period: Period;
  label: string;
  tagline: string;
  Icon: React.ElementType;
  headerGradient: string;
  accentColor: string;
  badgeClass: string;
  sectionBorder: string;
  nextActionBg: string;
}

function getPeriodConfig(): PeriodConfig {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      period: "morning",
      label: "Morning check-in",
      tagline: "Here's what's ahead today.",
      Icon: Sunrise,
      headerGradient: "from-orange-400 via-amber-400 to-yellow-300",
      accentColor: "text-orange-600",
      badgeClass: "bg-orange-100 text-orange-700 border-orange-200",
      sectionBorder: "border-orange-100",
      nextActionBg: "bg-orange-50 border-orange-100",
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      period: "afternoon",
      label: "Afternoon update",
      tagline: "Here's how your day is going.",
      Icon: Sun,
      headerGradient: "from-blue-500 via-cyan-400 to-teal-300",
      accentColor: "text-blue-600",
      badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
      sectionBorder: "border-blue-100",
      nextActionBg: "bg-blue-50 border-blue-100",
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      period: "evening",
      label: "Evening wrap-up",
      tagline: "Here's how your day went.",
      Icon: Moon,
      headerGradient: "from-indigo-500 via-purple-500 to-violet-400",
      accentColor: "text-indigo-600",
      badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200",
      sectionBorder: "border-indigo-100",
      nextActionBg: "bg-indigo-50 border-indigo-100",
    };
  }
  return {
    period: "night",
    label: "Tonight's recap",
    tagline: "Winding down for the day.",
    Icon: Sparkles,
    headerGradient: "from-slate-600 via-indigo-700 to-purple-800",
    accentColor: "text-slate-600",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    sectionBorder: "border-slate-100",
    nextActionBg: "bg-slate-50 border-slate-100",
  };
}

// ─── Task period bucketing ────────────────────────────────────────────────────

type TaskPeriod = "morning" | "afternoon" | "evening" | "night" | "anytime";

interface TaskPeriodMeta {
  key: TaskPeriod;
  label: string;
  Icon: React.ElementType;
  iconClass: string;
  labelClass: string;
}

const TASK_PERIODS: TaskPeriodMeta[] = [
  { key: "morning",   label: "Morning",   Icon: Sunrise,  iconClass: "text-amber-500",  labelClass: "text-amber-700"  },
  { key: "afternoon", label: "Afternoon", Icon: Sun,      iconClass: "text-blue-500",   labelClass: "text-blue-700"   },
  { key: "evening",   label: "Evening",   Icon: Moon,     iconClass: "text-indigo-500", labelClass: "text-indigo-700" },
  { key: "night",     label: "Night",     Icon: Sparkles, iconClass: "text-purple-500", labelClass: "text-purple-700" },
  { key: "anytime",   label: "Anytime",   Icon: Star,     iconClass: "text-gray-400",   labelClass: "text-gray-500"   },
];

/** Return which time bucket a "HH:MM" string falls into. */
function getTaskPeriod(time: string | undefined | null): TaskPeriod {
  if (!time) return "anytime";
  const [hStr] = time.split(":");
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return "anytime";
  if (h >= 5  && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night"; // 21:00 – 04:59
}

function groupTasksByPeriod(tasks: DailyGuideHighlight[]) {
  const buckets: Record<TaskPeriod, DailyGuideHighlight[]> = {
    morning: [], afternoon: [], evening: [], night: [], anytime: [],
  };
  for (const t of tasks) {
    buckets[getTaskPeriod(t.time)].push(t);
  }
  return buckets;
}

// ─── Highlight helpers ────────────────────────────────────────────────────────

function highlightIcon(type: DailyGuideHighlight["type"]) {
  switch (type) {
    case "task":
      return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />;
    case "appointment":
      return <Calendar className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />;
    case "calendar":
      return <Clock className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />;
  }
}

function priorityBadge(priority: DailyGuideHighlight["priority"]) {
  if (!priority || priority === "normal") return null;
  return (
    <Badge
      variant="outline"
      className={`text-xs px-1.5 py-0 ml-auto shrink-0 ${
        priority === "high"
          ? "bg-red-100 text-red-700 border-red-200"
          : "bg-gray-100 text-gray-500 border-gray-200"
      }`}
    >
      {priority}
    </Badge>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DailyGuideSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <div className="h-24 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-pulse" />
      <CardContent className="p-4 space-y-3 animate-pulse">
        <div className="h-3 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-3/5" />
        <div className="border-t pt-3 space-y-2">
          <div className="h-3 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function DailyGuideUnavailable() {
  return (
    <Card className="border border-gray-200 bg-gray-50">
      <CardContent className="flex items-start gap-3 py-5">
        <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-500">
          Your Guide isn't available right now. You can still use Adaptalyfe normally.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DailyGuideCard() {
  const { data, isLoading, isError } = useDailyGuide();
  const config = getPeriodConfig();
  const { Icon } = config;

  if (isLoading) return <DailyGuideSkeleton />;
  if (isError || !data) return <DailyGuideUnavailable />;

  const { greeting, summary, highlights, nextAction } = data;

  // Split highlights by type
  const tasks        = highlights.filter((h) => h.type === "task");
  const appointments = highlights.filter((h) => h.type === "appointment");
  const events       = highlights.filter((h) => h.type === "calendar");

  // Group tasks into Morning / Afternoon / Evening / Night / Anytime
  const taskBuckets  = groupTasksByPeriod(tasks);
  const activePeriods = TASK_PERIODS.filter((p) => taskBuckets[p.key].length > 0);

  return (
    <Card className="overflow-hidden border-0 shadow-md rounded-2xl">
      {/* ── Header banner ── */}
      <div className={`bg-gradient-to-r ${config.headerGradient} px-5 pt-5 pb-6`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-5 h-5 text-white/90" aria-hidden="true" />
          <span className="text-white/90 text-xs font-semibold uppercase tracking-widest">
            {config.label}
          </span>
        </div>
        <h2 className="text-white font-bold text-xl leading-snug drop-shadow-sm">
          {greeting}
        </h2>
        <p className="text-white/80 text-sm mt-0.5">{config.tagline}</p>
      </div>

      <CardContent className="p-0">
        {/* ── AI summary ── */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>

        {/* ── Tasks by time period ── */}
        {activePeriods.length > 0 && (
          <div className={`px-5 py-3 border-b ${config.sectionBorder}`}>
            {/* Section header */}
            <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${config.accentColor}`}>
              Tasks · {tasks.length}
            </p>

            {/* One sub-block per period */}
            <div className="space-y-4">
              {activePeriods.map(({ key, label, Icon: PIcon, iconClass, labelClass }) => (
                <div key={key}>
                  {/* Period label row */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <PIcon className={`w-3.5 h-3.5 ${iconClass}`} aria-hidden="true" />
                    <span className={`text-xs font-semibold uppercase tracking-wide ${labelClass}`}>
                      {label}
                    </span>
                  </div>

                  {/* Tasks in this period */}
                  <ul className="space-y-2 pl-5">
                    {taskBuckets[key].map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        {highlightIcon(h.type)}
                        <span className="text-sm text-gray-700 flex-1 leading-snug">
                          {h.title}
                          {h.time && (
                            <span className="text-gray-400 ml-1.5 text-xs">· {h.time}</span>
                          )}
                        </span>
                        {priorityBadge(h.priority)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Appointments ── */}
        {appointments.length > 0 && (
          <div className={`px-5 py-3 border-b ${config.sectionBorder}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${config.accentColor}`}>
              Appointments · {appointments.length}
            </p>
            <ul className="space-y-2">
              {appointments.map((h, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  {highlightIcon(h.type)}
                  <span className="text-sm text-gray-700 flex-1 leading-snug">
                    {h.title}
                    {h.time && (
                      <span className="text-gray-400 ml-1.5 text-xs">· {h.time}</span>
                    )}
                  </span>
                  {priorityBadge(h.priority)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Calendar events ── */}
        {events.length > 0 && (
          <div className={`px-5 py-3 border-b ${config.sectionBorder}`}>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${config.accentColor}`}>
              Events · {events.length}
            </p>
            <ul className="space-y-2">
              {events.map((h, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  {highlightIcon(h.type)}
                  <span className="text-sm text-gray-700 flex-1 leading-snug">
                    {h.title}
                    {h.time && (
                      <span className="text-gray-400 ml-1.5 text-xs">· {h.time}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── No highlights at all ── */}
        {highlights.length === 0 && (
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-400 italic">Nothing scheduled for this period.</p>
          </div>
        )}

        {/* ── Next action ── */}
        {nextAction && (
          <div className={`mx-4 my-3 flex items-start gap-3 rounded-xl px-4 py-3 border ${config.nextActionBg}`}>
            <ArrowRight className={`w-4 h-4 shrink-0 mt-0.5 ${config.accentColor}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold leading-snug ${config.accentColor}`}>
                Up next: {nextAction.title}
              </p>
              {nextAction.reason && (
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{nextAction.reason}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
