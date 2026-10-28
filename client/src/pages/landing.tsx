import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Brain,
  Users,
  Shield,
  Heart,
  ArrowRight,
  CheckCircle,
  UserPlus,
  QrCode,
  Star,
  Zap,
  Target,
  Key,
  DollarSign,
  Smile,
  Flame,
  Check,
  Smartphone,
  CreditCard,
  KeyRound,
  Sparkles,
  GraduationCap,
  HeartHandshake,
  FileText,
  CalendarDays,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getAuthenticatedUser } from "@/lib/queryClient";
import { FREE_TRIAL_DAYS } from "@shared/subscription";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [invitationCode, setInvitationCode] = useState<string>("");
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const { toast } = useToast();

  useEffect(() => {
    console.log("Landing page loaded - URL:", window.location.href);
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    console.log("Invitation code detected:", code);
    if (code) {
      setInvitationCode(code);
    }
  }, []);

  const { data: invitation } = useQuery({
    queryKey: [`/api/invitation/${invitationCode}`],
    enabled: !!invitationCode,
  }) as { data?: { userName: string } };

  const handleJoinWithInvitation = () => {
    localStorage.setItem("pendingInvitation", invitationCode);
    setLocation(`/register?code=${invitationCode}`);
  };

  const handleJoinWithCode = async () => {
    if (!joinCodeInput.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter an invitation code",
        variant: "destructive",
      });
      return;
    }

    // Store the code and redirect
    localStorage.setItem("pendingInvitation", joinCodeInput.trim());
    setLocation(`/register?code=${joinCodeInput.trim()}`);
  };

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLoginClick = async () => {
    if (isCheckingLogin) return;

    setIsCheckingLogin(true);
    try {
      const user = await getAuthenticatedUser();
      setLocation(user ? "/dashboard" : "/login");
    } catch (error) {
      // Preserve the normal login flow if the session check is temporarily
      // unavailable instead of blocking the user at the landing page.
      console.warn("Unable to check existing session before login navigation", error);
      setLocation("/login");
    } finally {
      setIsCheckingLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fe]">
      {/* Header */}
      <header className="android-header fixed inset-x-0 top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-md shadow-violet-500/20 sm:h-10 sm:w-10">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-xl font-bold text-gray-900">Adaptalyfe</h1>
                <p className="text-[9px] sm:text-xs text-gray-500 hidden sm:block">
                  Grow with Guidance. Thrive with Confidence.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    aria-label="Join with code"
                    className="group h-10 sm:h-11 rounded-full px-3.5 sm:px-5 text-sm font-semibold tracking-[-0.01em] transition-all duration-200 hover:-translate-y-px active:translate-y-0 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 border border-violet-200/80 bg-violet-50/70 text-violet-700 hover:border-violet-300 hover:bg-violet-100 hover:text-violet-800 hover:shadow-sm"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm ring-1 ring-violet-100 sm:mr-2">
                      <KeyRound className="h-3.5 w-3.5" />
                    </span>
                    <span className="hidden sm:inline">Join with Code</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-blue-600" />
                      Join with Invitation Code
                    </DialogTitle>
                    <DialogDescription>
                      Enter your invitation code to create an account and join
                      your caregiver's support network.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invitation-code">Invitation Code</Label>
                      <Input
                        id="invitation-code"
                        placeholder="Enter code (e.g., ABC123)"
                        value={joinCodeInput}
                        onChange={(e) =>
                          setJoinCodeInput(e.target.value.toUpperCase())
                        }
                        className="font-mono text-center text-lg tracking-wider"
                        maxLength={6}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsJoinModalOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleJoinWithCode}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        Join Now
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                type="button"
                variant="ghost"
                onClick={handleLoginClick}
                disabled={isCheckingLogin}
                className="group h-10 sm:h-11 rounded-full px-3.5 sm:px-5 text-sm font-semibold tracking-[-0.01em] transition-all duration-200 hover:-translate-y-px active:translate-y-0 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 border border-slate-200 bg-white text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:border-slate-300 hover:bg-white hover:text-slate-900 hover:shadow-md"
              >
                Sign In
              </Button>
              <Link href="/register">
                <Button className="group h-10 sm:h-11 rounded-full px-3.5 sm:px-5 text-sm font-semibold tracking-[-0.01em] transition-all duration-200 hover:-translate-y-px active:translate-y-0 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 relative overflow-hidden border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-[0_8px_20px_-6px_rgba(109,40,217,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_12px_26px_-6px_rgba(109,40,217,0.65),inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-110">
                  Get Started
                  <ArrowRight className="ml-1.5 hidden h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 sm:inline" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden pt-24 sm:pt-28 lg:pt-32 pb-14 sm:pb-16 lg:pb-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_60%_at_0%_100%,rgba(196,181,253,0.45),transparent_70%),radial-gradient(45%_55%_at_100%_0%,rgba(165,243,252,0.55),transparent_70%),radial-gradient(40%_40%_at_60%_40%,rgba(224,231,255,0.7),transparent_75%),linear-gradient(180deg,#e9f8fd_0%,#eef3ff_55%,#f3efff_100%)]" />
        <svg aria-hidden viewBox="0 0 1440 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-16 w-full sm:h-24">
          <path d="M0 70C240 20 480 110 760 80s520-70 680-30v70H0z" fill="#f7f8fe" />
        </svg>
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)] lg:gap-14 lg:px-8">
          {/* Copy */}
          <div className="max-w-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              A more independent tomorrow
            </span>
            <h2 className="mt-6 text-[2.6rem] font-extrabold leading-[1.04] tracking-[-0.035em] text-slate-900 sm:text-6xl lg:text-[3.3rem] xl:text-[3.85rem]">
              <span className="whitespace-nowrap">More confidence</span>
              <br />
              in{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                everyday life.
              </span>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600 sm:text-xl">
              A calmer way to build routines, track progress, and help every support team stay connected.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register">
                <Button className="group h-12 w-full rounded-xl border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-7 text-base font-semibold text-white shadow-[0_10px_24px_-8px_rgba(79,70,229,0.6)] transition-all hover:-translate-y-px hover:brightness-110 sm:w-auto">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <a href="#features" onClick={scrollTo("features")}>
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-xl border-slate-300 bg-white/80 px-7 text-base font-semibold text-slate-800 transition-all hover:-translate-y-px hover:border-slate-400 hover:bg-white sm:w-auto"
                >
                  Explore features
                </Button>
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              {[
                { Icon: Heart, label: "Designed for independence" },
                { Icon: Users, label: "Built for support teams" },
                { Icon: Shield, label: "Safe, secure and private" },
              ].map(({ Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 text-slate-500" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Product screenshot (real Adaptalyfe dashboard) */}
          <div className="relative motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-1000 motion-safe:delay-150 motion-safe:fill-mode-both">
            <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-cyan-200/40 via-violet-200/40 to-fuchsia-200/30 blur-2xl" />
            <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-1.5 shadow-[0_30px_70px_-20px_rgba(30,27,75,0.35)] ring-1 ring-slate-900/5 backdrop-blur sm:rounded-3xl sm:p-2">
              <img
                src="/images/landing/dashboard-preview.webp"
                alt="The Adaptalyfe home dashboard showing today's progress, a morning routine checklist, today's schedule, a mood check-in and quick actions"
                width={2400}
                height={1608}
                loading="eager"
                decoding="async"
                className="block h-auto w-full rounded-xl sm:rounded-2xl"
              />
            </div>

            {/* Floating detail cards */}
            <div aria-hidden className="landing-float absolute -left-6 top-[38%] hidden items-center gap-3 rounded-2xl border border-white bg-white/95 px-4 py-3 shadow-[0_18px_40px_-14px_rgba(15,23,42,0.35)] backdrop-blur sm:flex xl:-left-10">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-slate-900">Brush teeth</span>
                <span className="block text-xs text-emerald-600">Done · great job!</span>
              </span>
            </div>
            <div aria-hidden className="landing-float landing-float-delay absolute -bottom-6 right-6 hidden items-center gap-3 rounded-2xl border border-white bg-white/95 px-4 py-3 shadow-[0_18px_40px_-14px_rgba(15,23,42,0.35)] backdrop-blur sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                <Flame className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-slate-900">5-day streak</span>
                <span className="block text-xs text-slate-500">Keep going!</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Support roles */}
      <section className="pt-10 pb-14 sm:pt-12 sm:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex rounded-full bg-indigo-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
              For every support role
            </span>
            <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              One shared view. A more connected support team.
            </h3>
            <p className="mt-3 text-base text-slate-500 sm:text-lg">
              Keep everyone in sync and focused on what matters most: the individual&apos;s growth, wellbeing and independence.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
            {[
              {
                Icon: Users,
                tile: "bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600",
                title: "Parents & guardians",
                text: "Stay informed, track progress and support routines at home.",
              },
              {
                Icon: GraduationCap,
                tile: "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600",
                title: "Teachers & educators",
                text: "Coordinate schedules, track goals and share updates from school.",
              },
              {
                Icon: HeartHandshake,
                tile: "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600",
                title: "Caregivers & support professionals",
                text: "Manage daily tasks, communicate securely and provide consistent support.",
              },
            ].map(({ Icon, tile, title, text }) => (
              <Link
                key={title}
                href="/register"
                className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_30px_-12px_rgba(15,23,42,0.18)]"
              >
                <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full shadow-inner ring-4 ring-white ${tile}`}>
                  <Icon className="h-7 w-7" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900">{title}</span>
                  <span className="mt-1 block text-sm leading-snug text-slate-500">{text}</span>
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors group-hover:border-violet-200 group-hover:bg-violet-50 group-hover:text-violet-600">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 pb-14 sm:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex rounded-full bg-fuchsia-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-fuchsia-600">
              Powerful features
            </span>
            <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Comprehensive Support for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Daily Living</span>
            </h3>
            <p className="mt-3 text-base text-slate-500 sm:text-lg">
              Every feature is thoughtfully designed with accessibility, independence, and personal growth in mind.
            </p>
          </div>

          {(() => {
            const features = [
              { Icon: CheckCircle, tile: "bg-emerald-50 text-emerald-600", title: "Daily Task Management", text: "Visual routines, step-by-step guidance and progress tracking." },
              { Icon: Smile, tile: "bg-rose-50 text-rose-500", title: "Mood & Wellbeing", text: "Daily check-ins, mood insights and personalized support." },
              { Icon: FileText, tile: "bg-blue-50 text-blue-600", title: "Personal Records & Notes", text: "Store important information, medications and care notes." },
              { Icon: CalendarDays, tile: "bg-violet-50 text-violet-600", title: "Calendar & Appointments", text: "Keep track of school, therapy and daily schedules." },
              { Icon: DollarSign, tile: "bg-amber-50 text-amber-600", title: "Financial Management", text: "Bill tracking, budgeting tools and payment reminders." },
              { Icon: Users, tile: "bg-teal-50 text-teal-600", title: "Secure Support Network", text: "Connect with family, caregivers and trusted professionals." },
              { Icon: Brain, tile: "bg-purple-50 text-purple-600", title: "AI Guidance, Goals & Achievements", text: "Personalized recommendations, goal tracking and rewards to build confidence." },
            ];
            const card = ({ Icon, tile, title, text }: (typeof features)[number]) => (
              <div
                key={title}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_34px_-16px_rgba(15,23,42,0.22)]"
              >
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-4 ring-white transition-transform duration-200 group-hover:scale-105 ${tile}`}>
                  <Icon className="h-7 w-7" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-snug text-slate-900">{title}</span>
                  <span className="mt-1 block text-sm leading-snug text-slate-500">{text}</span>
                </span>
              </div>
            );
            return (
              <div className="mt-10 space-y-4 md:space-y-5">
                <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">{features.slice(0, 4).map(card)}</div>
                <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">{features.slice(4).map(card)}</div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(237,233,254,0.7),transparent_75%)] pt-10 pb-16 sm:pt-12 sm:pb-20">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="inline-flex rounded-full bg-indigo-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
              Flexible plans
            </span>
            <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Choose Your Plan</h3>
            <p className="mx-auto mt-3 max-w-3xl text-base text-slate-500 sm:text-lg">
              Start with a {FREE_TRIAL_DAYS}-day free trial. Cancel anytime. All plans include mobile app access.
            </p>
          </div>

          {/* Monthly / Yearly billing toggle — cards show only the selected cycle */}
          <div className="mb-10 flex justify-center sm:mb-12">
            <div
              role="group"
              aria-label="Billing period"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm"
            >
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                aria-pressed={billingCycle === "monthly"}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                aria-pressed={billingCycle === "yearly"}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  billingCycle === "yearly"
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Yearly
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    billingCycle === "yearly"
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  Save up to 18%
                </span>
              </button>
            </div>
          </div>

          <div className="mx-auto grid max-w-5xl items-stretch gap-5 md:grid-cols-3 md:gap-6">
            {[
              {
                id: "basic",
                name: "Basic",
                subtitle: "Essential tools",
                Icon: Target,
                popular: false,
                accent: {
                  iconBg: "bg-gradient-to-br from-sky-500 to-blue-600",
                  check: "text-sky-500",
                  cta: "border-2 border-blue-500 bg-white text-blue-600 hover:bg-blue-50",
                  ctaSolid: false,
                  ring: "border border-slate-200 shadow-sm",
                },
                monthly: "$4.99",
                yearly: "$49",
                save: "Save 18%",
                features: [
                  "Daily task management",
                  "Basic progress tracking",
                  "Calendar & appointments",
                  "Mobile app access",
                ],
              },
              {
                id: "premium",
                name: "Premium",
                subtitle: "Advanced tools & customization",
                Icon: Star,
                popular: true,
                accent: {
                  iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
                  check: "text-violet-500",
                  cta: "border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30 hover:brightness-110",
                  ctaSolid: true,
                  ring: "border-2 border-violet-300 shadow-[0_20px_45px_-18px_rgba(109,40,217,0.35)]",
                },
                monthly: "$12.99",
                yearly: "$129",
                save: "Save 17%",
                features: [
                  "Everything in Basic",
                  "Mood & wellbeing tools",
                  "Personal records & notes",
                  "AI guidance, goals & achievements",
                ],
              },
              {
                id: "family",
                name: "Family / Care Team",
                subtitle: "Multi-user coordination",
                Icon: Users,
                popular: false,
                accent: {
                  iconBg: "bg-gradient-to-br from-orange-400 to-orange-600",
                  check: "text-orange-500",
                  cta: "border-2 border-blue-500 bg-white text-blue-600 hover:bg-blue-50",
                  ctaSolid: false,
                  ring: "border border-slate-200 shadow-sm",
                },
                monthly: "$24.99",
                yearly: "$249",
                save: "Save 17%",
                features: [
                  "Everything in Premium",
                  "Up to 5 individual profiles",
                  "Secure team communication",
                  "Advanced admin controls",
                ],
              },
            ].map((plan) => {
              const PlanIcon = plan.Icon;
              const isYearly = billingCycle === "yearly";
              const price = isYearly ? plan.yearly : plan.monthly;
              const period = isYearly ? "year" : "month";
              const altPrice = isYearly ? plan.monthly : plan.yearly;
              const altPeriod = isYearly ? "month" : "year";
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col overflow-hidden rounded-2xl bg-white transition-shadow duration-200 ${plan.accent.ring} ${plan.popular ? "md:-my-3 md:z-10" : "hover:shadow-md"}`}
                >
                  {plan.popular && (
                    <div className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-500 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                      <Star className="h-3.5 w-3.5 fill-white" />
                      Most Popular
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${plan.accent.iconBg}`}
                      >
                        <PlanIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
                        <p className="text-sm text-slate-500">{plan.subtitle}</p>
                      </div>
                    </div>

                    {/* Both prices: the selected billing cycle large, the other one underneath */}
                    <div className="mt-5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                          {price}
                        </span>
                        <span className="text-sm font-medium text-slate-500">/{period}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-500">
                        or <span className="font-semibold text-slate-700">{altPrice}</span>/{altPeriod}
                        {isYearly ? (
                          <span className="ml-1.5 font-medium text-emerald-600">· {plan.save} with yearly</span>
                        ) : (
                          <span className="ml-1 font-medium text-emerald-600">({plan.save.toLowerCase()})</span>
                        )}
                      </p>
                    </div>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {plan.features.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <Check
                            className={`mt-0.5 h-4 w-4 shrink-0 ${plan.accent.check}`}
                            strokeWidth={3}
                          />
                          <span className="text-sm leading-snug text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/register?plan=${plan.id}&billing=${billingCycle}`}
                      className="mt-7 block"
                    >
                      <Button
                        variant={plan.accent.ctaSolid ? "default" : "outline"}
                        className={`h-11 w-full rounded-xl text-[15px] font-semibold ${plan.accent.cta}`}
                      >
                        Choose plan
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>


          <div aria-hidden className="pointer-events-none absolute bottom-24 right-8 hidden rotate-[-6deg] select-none text-center font-['Caveat',cursive] text-[1.7rem] font-semibold leading-tight text-indigo-500 xl:block">
            Try free for
            <br />
            {FREE_TRIAL_DAYS} days
            <svg viewBox="0 0 60 40" className="mx-auto mt-1 h-9 w-14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M52 4C50 22 36 32 10 32" />
              <path d="M18 25l-8 7 9 5" />
            </svg>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[linear-gradient(120deg,#ede9fe_0%,#eef2ff_45%,#e0f7fb_100%)] px-6 py-12 sm:px-12 sm:py-14">
          <svg aria-hidden viewBox="0 0 1200 160" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full">
            <path d="M0 110c120-60 260-70 380-30s220 60 340 20 300-90 480-40v100H0z" fill="#ffffff" opacity="0.55" />
            <path d="M0 130c160-40 300-30 420 0s260 30 400 0 260-50 380-20v50H0z" fill="#ddd6fe" opacity="0.35" />
          </svg>
          <div aria-hidden className="absolute -left-10 -top-16 h-56 w-56 rounded-full bg-violet-200/50 blur-3xl" />
          <div aria-hidden className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-cyan-200/50 blur-3xl" />

          {/* Sprout illustration */}
          <svg aria-hidden viewBox="0 0 220 180" className="absolute bottom-0 left-4 hidden h-44 w-52 lg:block xl:left-12">
            <defs>
              <linearGradient id="leafA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6ee7b7" /><stop offset="1" stopColor="#059669" /></linearGradient>
              <linearGradient id="leafB" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5eead4" /><stop offset="1" stopColor="#0d9488" /></linearGradient>
              <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#4c1d95" /></linearGradient>
            </defs>
            <ellipse cx="110" cy="170" rx="80" ry="10" fill="#6d28d9" opacity="0.12" />
            <path d="M52 172c6-26 30-38 58-38s52 12 58 38z" fill="url(#soil)" />
            <path d="M74 150c8-6 20-8 30-6" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" opacity="0.6" fill="none" />
            <path d="M110 138c0-22 2-48 6-74" stroke="#0f766e" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M112 96C82 98 60 78 60 46c32-2 54 18 52 50z" fill="url(#leafA)" />
            <path d="M114 78c2-32 28-52 62-48 0 32-26 52-62 48z" fill="url(#leafB)" />
            <path d="M112 96C94 84 82 68 72 54M114 78c16-12 32-26 48-40" stroke="#064e3b" strokeWidth="2" opacity="0.25" fill="none" />
            <path d="M164 150c0-10 4-20 10-26 6 6 8 16 4 26z" fill="#99f6e4" opacity="0.9" />
            <path d="M30 70l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#fbbf24" />
            <path d="M178 104l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fbbf24" opacity="0.85" />
            <path d="M150 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fbbf24" opacity="0.75" />
            <circle cx="40" cy="120" r="3" fill="#c4b5fd" />
            <circle cx="196" cy="60" r="2.5" fill="#a5f3fc" />
          </svg>

          <div className="relative mx-auto max-w-2xl text-center">
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Small steps. Real progress.</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              Join families, educators and support teams building brighter, more independent tomorrows with Adaptalyfe.
            </p>
            <Link href="/register" className="mt-7 inline-block">
              <Button className="group h-12 rounded-full border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-8 text-base font-semibold text-white shadow-[0_10px_24px_-8px_rgba(79,70,229,0.6)] transition-all hover:-translate-y-px hover:brightness-110">
                Start your journey
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          <div aria-hidden className="absolute right-10 top-1/2 hidden -translate-y-1/2 rotate-[-8deg] text-center font-['Caveat',cursive] text-4xl font-semibold leading-tight text-indigo-500/90 lg:block">
            Grow
            <br />
            Together
            <Heart className="ml-1 inline h-5 w-5" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1424] text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:justify-between lg:px-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-violet-900/30">
              <Brain className="h-5 w-5 text-white" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-bold text-white">Adaptalyfe</span>
              <span className="block text-xs text-slate-400">Grow with Guidance. Thrive with Confidence.</span>
            </span>
          </Link>

          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
            {[
              { label: "Features", href: "#features", id: "features" },
              { label: "Plans", href: "#pricing", id: "pricing" },
              { label: "Privacy Policy", href: "/privacy-policy" },
              { label: "Contact", href: "mailto:privacy@adaptalyfe.com" },
            ].map(({ label, href, id }) =>
              href.startsWith("/") ? (
                <Link key={label} href={href} className="text-slate-300 transition-colors hover:text-white">
                  {label}
                </Link>
              ) : (
                <a
                  key={label}
                  href={href}
                  onClick={id ? scrollTo(id) : undefined}
                  className="text-slate-300 transition-colors hover:text-white"
                >
                  {label}
                </a>
              ),
            )}
          </nav>

          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Adaptalyfe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
