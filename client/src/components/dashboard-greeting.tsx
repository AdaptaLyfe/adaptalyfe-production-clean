import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import type { DailyTask, User } from "@shared/schema";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function ProgressRing({ value }: { value: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0 w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem]">
      <circle className="ring-track" cx="36" cy="36" r={radius} fill="none" stroke="#ccfbf1" strokeWidth="8" />
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        stroke="#14b8a6"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
      />
      <text className="ring-label" x="36" y="41" textAnchor="middle" fill="#0f766e" fontSize="15" fontWeight="700">
        {value}%
      </text>
    </svg>
  );
}

const TILE = "rounded-2xl bg-white border border-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] px-4 sm:px-5 py-3 flex items-center gap-3 sm:gap-4 min-w-0";

/** Greeting + Today's Progress + Current Streak — first row of the dashboard. */
export default function DashboardGreeting() {
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });
  const { data: tasksData } = useQuery<DailyTask[]>({ queryKey: ["/api/daily-tasks"] });
  const tasks = Array.isArray(tasksData) ? tasksData : [];
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mt-1">
          {getGreeting()}, {user?.name || "there"}! <span aria-hidden>👋</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1.5">Here&apos;s your plan for today. One step at a time.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:flex lg:shrink-0">
        <div className={TILE}>
          <ProgressRing value={progress} />
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">Today&apos;s Progress</p>
            <p className="text-xs sm:text-sm text-slate-500 truncate">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </div>
        </div>
        <div className={TILE}>
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <Flame className="h-6 w-6 sm:h-7 sm:w-7 text-orange-500" />
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
              {user?.streakDays || 0} days
            </p>
            <p className="text-xs sm:text-sm font-medium text-slate-700 truncate">Current Streak</p>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5 truncate">Keep going! You&apos;ve got this.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
