import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, PartyPopper, Quote, Receipt } from "lucide-react";
import type { Bill, DailyTask } from "@shared/schema";
import { formatCurrency, getDailyMotivationalQuote, getDaysUntilDue } from "@/lib/utils";

const CARD = "rounded-3xl bg-white/80 border border-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]";

/* ───────────────────────── Coming up (bills + weekly) ───────────────────────── */

function daysUntil(dateLike: string | Date, today: Date) {
  return Math.ceil((new Date(dateLike).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
function dueLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function ComingUpCard() {
  const { data: tasksData } = useQuery<DailyTask[]>({ queryKey: ["/api/daily-tasks"] });
  const { data: billsData } = useQuery<Bill[]>({ queryKey: ["/api/bills"] });
  const tasks = Array.isArray(tasksData) ? tasksData : [];
  const bills = Array.isArray(billsData) ? billsData : [];
  const today = new Date();

  const pendingDaily = tasks.filter((t) => (t.frequency === "daily" || !t.frequency) && !t.isCompleted);
  const weeklyDueSoon = tasks.filter((t) => {
    if (t.frequency !== "weekly" || t.isCompleted || !t.dueDate) return false;
    const d = daysUntil(t.dueDate, today);
    return d >= 0 && d <= 2;
  });
  const billsDueSoon = bills
    .filter((b) => {
      if (b.isPaid) return false;
      const d = getDaysUntilDue(Number(b.dueDate));
      return d >= 0 && d <= 3;
    })
    .sort((a, b) => getDaysUntilDue(Number(a.dueDate)) - getDaysUntilDue(Number(b.dueDate)));
  const allClear = pendingDaily.length === 0 && weeklyDueSoon.length === 0 && billsDueSoon.length === 0;
  const quote = getDailyMotivationalQuote();

  return (
    <section className={`${CARD} p-5 flex flex-col gap-4`}>
      <div className="flex items-center gap-3">
        <span className="h-11 w-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
          <Bell className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Coming Up</h3>
          <p className="text-xs text-slate-500">Bills and weekly tasks due soon</p>
        </div>
      </div>

      {billsDueSoon.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Bills due · {billsDueSoon.length}</p>
          <ul className="space-y-2">
            {billsDueSoon.map((b) => {
              const d = getDaysUntilDue(Number(b.dueDate));
              return (
                <li key={b.id}>
                  <Link href="/financial">
                    <span className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 cursor-pointer hover:border-orange-200">
                      <span className="h-9 w-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <Receipt className="h-4 w-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-slate-900 truncate">{b.name}</span>
                        <span className="block text-xs text-slate-500">{formatCurrency(Number(b.amount))}</span>
                      </span>
                      <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                        d <= 1 ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {dueLabel(d)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {weeklyDueSoon.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Weekly tasks due · {weeklyDueSoon.length}</p>
          <ul className="space-y-2">
            {weeklyDueSoon.map((t) => (
              <li key={t.id}>
                <Link href="/daily-tasks">
                  <span className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 cursor-pointer hover:border-violet-200">
                    <span className="h-9 w-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <span className="flex-1 min-w-0 text-sm font-semibold text-slate-900 truncate">{t.title}</span>
                    <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200">
                      {dueLabel(daysUntil(t.dueDate as unknown as string, today))}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {billsDueSoon.length === 0 && weeklyDueSoon.length === 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/80 border border-emerald-100 px-4 py-3">
          <PartyPopper className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">{allClear ? "All caught up!" : "Nothing due soon"}</p>
            <p className="text-xs text-emerald-700/80">
              {allClear ? "No urgent tasks or deadlines today." : "No bills or weekly tasks due in the next few days."}
            </p>
          </div>
        </div>
      )}

      <div className="mt-auto rounded-2xl bg-gradient-to-br from-teal-50 to-sky-50 border border-teal-100 p-4">
        <Quote className="h-5 w-5 text-teal-500 mb-2" />
        <p className="text-sm text-slate-700 italic leading-relaxed">“{quote.quote}”</p>
        <p className="text-xs text-slate-500 mt-1.5">— {quote.author}</p>
      </div>
    </section>
  );
}

/* ───────────────────────── Section ───────────────────────── */

export default function DashboardExtras() {
  return <ComingUpCard />;
}
