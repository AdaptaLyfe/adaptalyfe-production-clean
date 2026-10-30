import { Button } from "@/components/ui/button";
import { Check, Crown, Lock, Sparkles } from "lucide-react";
import { Link } from "wouter";

interface PremiumFeaturePromptProps {
  title: string;
  description: string;
  feature: string;
  requiredPlan: 'premium' | 'family';
  className?: string;
}

const PLAN_INFO = {
  premium: {
    name: "Premium",
    price: "$12.99/month or $129.99/year",
    perks: ["Health records & documents", "Meals, medications & student planner", "Life skills & rewards"],
  },
  family: {
    name: "Family",
    price: "$24.99/month or $249.99/year",
    perks: ["Everything in Premium", "Caregiver messaging", "Up to 5 family member accounts"],
  },
} as const;

/** Shown in place of a page the current plan doesn't include. */
export default function PremiumFeaturePrompt({
  title,
  description,
  requiredPlan,
  className = "",
}: PremiumFeaturePromptProps) {
  const plan = PLAN_INFO[requiredPlan];
  const PlanIcon = requiredPlan === "family" ? Crown : Sparkles;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-10 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-indigo-50 via-violet-50/40 to-transparent" />

      <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25">
        <Lock className="h-7 w-7 text-white" />
      </div>

      <span className="relative inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
        <PlanIcon className="h-3.5 w-3.5" />
        {plan.name} feature
      </span>

      <h2 className="relative mt-3 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
      <p className="relative mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{description}</p>

      <ul className="relative mx-auto mt-6 max-w-xs space-y-2 text-left">
        {plan.perks.map((perk) => (
          <li key={perk} className="flex items-center gap-2.5 text-sm text-slate-700">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            {perk}
          </li>
        ))}
      </ul>

      <div className="relative mt-7">
        <Link href={`/subscription?plan=${requiredPlan}`}>
          <Button className="h-11 w-full rounded-xl text-base font-semibold">
            Upgrade to {plan.name}
          </Button>
        </Link>
        <div className="mt-4">
          <Link href="/subscription">
            <span className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Compare all plans
            </span>
          </Link>
        </div>
        <p className="mt-2 text-xs text-slate-500">{plan.price} · Cancel anytime</p>
      </div>
    </div>
  );
}
