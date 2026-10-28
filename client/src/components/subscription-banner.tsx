import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertTriangle, ArrowRight, Clock, X } from "lucide-react";
import type { User } from "@shared/schema";

export default function SubscriptionBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });
  const { data: subscription } = useQuery<any>({ queryKey: ["/api/subscription"] });

  // Don't show banner if dismissed, user not loaded, user has active subscription, or user is admin
  const isAdmin = user?.accountType === "admin" || user?.username === "admin" || user?.name?.toLowerCase().includes("admin");
  if (isDismissed || !user || !subscription || subscription.status === "active" || isAdmin) {
    return null;
  }

  const trialDaysLeft = subscription.trialDaysLeft || 0;
  const isTrialExpired = trialDaysLeft === 0;
  const isTrialExpiringSoon = trialDaysLeft <= 2 && trialDaysLeft > 0;

  // Only show banner if trial is expiring soon or expired
  if (!isTrialExpired && !isTrialExpiringSoon) {
    return null;
  }

  const daysText = `${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"}`;
  const tone = isTrialExpired
    ? { wrap: "bg-rose-50/80 border-rose-100", tile: "bg-rose-100 text-rose-600", title: "text-rose-900", text: "text-rose-700/90", chip: "bg-rose-100 text-rose-700" }
    : { wrap: "bg-amber-50/80 border-amber-100", tile: "bg-amber-100 text-amber-600", title: "text-slate-900", text: "text-slate-600", chip: "bg-amber-100 text-amber-800" };

  return (
    <div
      role="status"
      className={`rounded-2xl border ${tone.wrap} shadow-[0_8px_30px_rgba(15,23,42,0.04)] px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${tone.tile}`}>
          {isTrialExpired ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-semibold ${tone.title}`}>
              {isTrialExpired ? "Free Trial Expired" : "Trial Ending Soon"}
            </p>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${tone.chip}`}>
              {isTrialExpired ? "Action Required" : `${daysText} left`}
            </span>
          </div>
          <p className={`text-sm ${tone.text}`}>
            {isTrialExpired
              ? "Your free trial has ended. Subscribe now to continue using Adaptalyfe features."
              : `Your free trial ends in ${daysText}. Subscribe now to avoid interruption.`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 pl-[52px] lg:pl-0">
        {!isTrialExpired && (
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white/70"
          >
            Remind Me Later
          </button>
        )}
        <Link href="/subscription">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 cursor-pointer transition-colors">
            View Plans
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setIsDismissed(true)}
          className="ml-1 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/70"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
