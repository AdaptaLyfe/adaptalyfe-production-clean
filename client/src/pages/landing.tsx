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
  Check,
  Sparkles,
  Smartphone,
  CreditCard,
  ListChecks,
  BarChart3,
  Tag,
  Gift,
  KeyRound,
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100">
      {/* Header - Android Material Design */}
      <header className="bg-white android-header android-elevation-1 fixed top-0 left-0 right-0 z-50">
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

      {/* Hero Section - with padding for fixed header */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-20 main-content-with-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Empowering Independence Through Technology
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              AdaptaLyfe is designed specifically for individuals with
              developmental disabilities, providing the tools and support needed
              to build confidence, manage daily life, and achieve greater
              independence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8"
                >
                  Start Your Journey <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              {/* <Link href="/demo">
                <Button size="lg" variant="outline" className="px-8">
                  Try Demo
                </Button>
              </Link> */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-20">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Comprehensive Support for{" "}
              <span className="text-blue-600 font-bold">Daily Living</span>
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Every feature is thoughtfully designed with accessibility,
              independence, and personal growth in mind
            </p>
          </div>

          <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/30 hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                  Daily Task Management
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Organize daily routines with visual cues, progress tracking,
                  and personalized reward systems that celebrate every
                  achievement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30 hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                  Financial Management
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Simple bill tracking, budgeting tools, and secure payment
                  links designed to build financial independence safely
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30 hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Smile className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                  Mood & Wellness
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Track emotional well-being with daily check-ins, mood
                  insights, and personalized wellness recommendations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-yellow-50/30 hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                  Support Network
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Connect securely with caregivers, family, and support
                  professionals through our comprehensive communication platform
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Additional Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-8 bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl w-fit mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                AI Assistant
              </h4>
              <p className="text-gray-600">
                Get personalized guidance and support with AdaptAI, your helpful
                companion
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-xl w-fit mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Goal Tracking
              </h4>
              <p className="text-gray-600">
                Set and achieve personal goals with visual progress tracking and
                celebrations
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl w-fit mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Achievements
              </h4>
              <p className="text-gray-600">
                Earn badges and rewards for completing tasks and reaching
                milestones
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="py-16 sm:py-20 bg-[#f4f6fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="inline-flex items-center rounded-full bg-violet-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 mb-4">
              Flexible Plans
            </span>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3 leading-tight">
              Choose Your Plan
            </h3>
            <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto">
              Start with a {FREE_TRIAL_DAYS}-day free trial. Cancel anytime. All plans include mobile app access.
            </p>
          </div>

          {/* Billing toggle with side hints */}
          <div className="mb-12 flex items-center justify-center gap-4 lg:mb-14 lg:justify-between">
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                <Tag className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Monthly</p>
                  <p className="text-xs text-slate-500">Pay month to month. Cancel anytime.</p>
                </div>
              </div>
              <svg aria-hidden viewBox="0 0 60 30" className="h-7 w-14 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 6c18-4 36 2 52 18" />
                <path d="M46 23l8 1.5-1-8" />
              </svg>
            </div>

            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                aria-pressed={billingCycle === "monthly"}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
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
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Yearly
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Save up to 17%
                </span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <svg aria-hidden viewBox="0 0 60 30" className="h-7 w-14 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M58 6C40 2 22 8 6 24" />
                <path d="M14 23l-8 1.5 1-8" />
              </svg>
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
                <Gift className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Yearly</p>
                  <p className="text-xs text-slate-500">Save up to 17% and enjoy continuous support.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid items-stretch gap-6 md:grid-cols-3 lg:gap-7">
            {[
              {
                id: "basic",
                name: "Basic",
                subtitle: "Essential tools to get started",
                audience: "For individuals",
                Icon: Target,
                popular: false,
                accent: {
                  iconBg: "bg-gradient-to-br from-sky-500 to-blue-600",
                  badge: "border-sky-200 bg-sky-50 text-sky-700",
                  check: "text-sky-600",
                  cta: "border-2 border-sky-500 bg-white text-sky-700 hover:bg-sky-50",
                  ctaSolid: false,
                  ring: "border border-slate-200/80 shadow-[0_12px_32px_rgba(15,23,42,0.06)]",
                },
                monthly: "$4.99",
                yearly: "$49.99",
                save: "Save 18%",
                featuresTitle: "What's included",
                features: [
                  "Daily task management",
                  "Visual routines & step-by-step guidance",
                  "Mood check-ins",
                  "Calendar & appointments",
                  "Basic progress tracking",
                  "Financial reminders (bills & expenses)",
                  "Mobile app access",
                  "Email support",
                ],
                limits: [
                  { icon: ListChecks, text: "Up to 50 daily tasks" },
                  { icon: Users, text: "1 caregiver connection" },
                  { icon: BarChart3, text: "Basic progress summaries" },
                ],
              },
              {
                id: "premium",
                name: "Premium",
                subtitle: "Advanced tools & personalization",
                audience: "For active support teams",
                Icon: Sparkles,
                popular: true,
                accent: {
                  iconBg: "bg-gradient-to-br from-fuchsia-500 to-violet-600",
                  badge: "border-violet-200 bg-violet-50 text-violet-700",
                  check: "text-violet-600",
                  cta: "border-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:opacity-95",
                  ctaSolid: true,
                  ring: "border-2 border-violet-500 shadow-[0_24px_56px_rgba(109,40,217,0.20)]",
                },
                monthly: "$12.99",
                yearly: "$129.99",
                save: "Save 17%",
                featuresTitle: "Everything in Basic, plus",
                features: [
                  "Personal records (notes, medications, sensitivities)",
                  "Skill challenges & custom task templates",
                  "Meal planning & shopping lists",
                  "Data export & guided tutorials",
                  "Goal tracking & achievements",
                  "Unlimited daily tasks",
                  "Up to 5 caregiver connections",
                  "Priority email support",
                ],
                limits: [
                  { icon: ListChecks, text: "Up to 1,000 daily tasks" },
                  { icon: Users, text: "Up to 5 caregiver connections" },
                  { icon: BarChart3, text: "Full analytics & progress reports" },
                ],
              },
              {
                id: "family",
                name: "Family / Care Team",
                subtitle: "Multi-user coordination",
                audience: "For families, schools & teams",
                Icon: Users,
                popular: false,
                accent: {
                  iconBg: "bg-gradient-to-br from-orange-400 to-orange-600",
                  badge: "border-slate-200 bg-white text-slate-600",
                  check: "text-orange-500",
                  cta: "border-2 border-orange-400 bg-white text-orange-600 hover:bg-orange-50",
                  ctaSolid: false,
                  ring: "border border-slate-200/80 shadow-[0_12px_32px_rgba(15,23,42,0.06)]",
                },
                monthly: "$24.99",
                yearly: "$249.99",
                save: "Save 17%",
                featuresTitle: "Everything in Premium, plus",
                features: [
                  "Up to 5 individual user profiles",
                  "Shared dashboards for coordination",
                  "Role-based access controls",
                  "In-app messaging & video calls",
                  "Granular sharing & security controls",
                  "Activity history & audit views",
                  "Combined progress summaries",
                  "Shared routines, templates & calendars",
                  "Dedicated account assistance",
                  "Priority email & chat support",
                  "Guided onboarding sessions",
                ],
                limits: [
                  { icon: ListChecks, text: "Unlimited daily tasks" },
                  { icon: Users, text: "Up to 5 member accounts included" },
                  { icon: BarChart3, text: "Unlimited caregiver connections" },
                ],
              },
            ].map((plan) => {
              const PlanIcon = plan.Icon;
              const isMonthly = billingCycle === "monthly";
              const mainPrice = isMonthly ? plan.monthly : plan.yearly;
              const mainPeriod = isMonthly ? "month" : "year";
              const altPrice = isMonthly ? plan.yearly : plan.monthly;
              const altPeriod = isMonthly ? "year" : "month";
              const dense = plan.features.length > 8;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col overflow-hidden rounded-3xl bg-white transition-shadow ${plan.accent.ring} ${
                    plan.popular ? "md:-mt-6" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white">
                      <Star className="h-3.5 w-3.5 fill-white" />
                      Most Popular
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6 lg:p-7">
                    {/* Header */}
                    <div className="flex items-start gap-3.5">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${plan.accent.iconBg}`}>
                        <PlanIcon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xl font-bold leading-tight text-slate-900">{plan.name}</h4>
                        <p className="mt-0.5 truncate text-sm text-slate-500">{plan.subtitle}</p>
                        <span className={`mt-2 inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${plan.accent.badge}`}>
                          {plan.audience}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[2.5rem] font-extrabold leading-none tracking-tight text-slate-900">{mainPrice}</span>
                        <span className="text-sm font-medium text-slate-500">/{mainPeriod}</span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2 text-sm text-slate-500">
                        <span>
                          or <span className="font-semibold text-slate-800">{altPrice}</span>/{altPeriod}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          {plan.save}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Link href="/register" className="mt-6 block">
                      <Button
                        variant={plan.accent.ctaSolid ? "default" : "outline"}
                        className={`h-12 w-full rounded-xl text-[15px] font-semibold ${plan.accent.cta}`}
                      >
                        Start {FREE_TRIAL_DAYS}-Day Free Trial
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>

                    {/* Features */}
                    <div className="mt-6 flex-1 border-t border-slate-100 pt-5">
                      <p className="mb-3 text-sm font-semibold text-slate-900">{plan.featuresTitle}</p>
                      <ul className={dense ? "space-y-1.5" : "space-y-2"}>
                        {plan.features.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.accent.check}`} strokeWidth={3} />
                            <span className="text-sm leading-snug text-slate-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Limits */}
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <p className="mb-3 text-sm font-semibold text-slate-900">Plan limits</p>
                      <ul className="space-y-2">
                        {plan.limits.map(({ icon: LimitIcon, text }) => (
                          <li key={text} className="flex items-center gap-2.5 text-sm text-slate-600">
                            <LimitIcon className="h-4 w-4 shrink-0 text-slate-400" />
                            <span>{text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust bar */}
          <div className="mt-10 rounded-3xl border border-slate-200/80 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:px-7">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-slate-100">
              {[
                {
                  icon: Shield,
                  iconClass: "bg-emerald-50 text-emerald-600",
                  title: `${FREE_TRIAL_DAYS}-day free trial`,
                  detail: "No commitment. Cancel anytime.",
                },
                {
                  icon: CreditCard,
                  iconClass: "bg-violet-50 text-violet-600",
                  title: "Secure payment",
                  detail: "Your data is always protected.",
                },
                {
                  icon: Smartphone,
                  iconClass: "bg-sky-50 text-sky-600",
                  title: "Mobile app included",
                  detail: "iOS and Android access.",
                },
                {
                  icon: Users,
                  iconClass: "bg-rose-50 text-rose-500",
                  title: "Trusted by families & schools",
                  detail: "Built for more independent lives.",
                },
              ].map(({ icon: Icon, iconClass, title, detail }) => (
                <div key={title} className="flex items-center gap-3 lg:px-6 lg:first:pl-0 lg:last:pr-0">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{title}</p>
                    <p className="text-xs leading-relaxed text-slate-500">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Ready to Start Your Independence Journey?
          </h3>
          <p className="text-base sm:text-lg md:text-xl text-white mb-8 sm:mb-12 max-w-2xl mx-auto">
            Join thousands of individuals building confidence and achieving
            their goals with AdaptaLyfe
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-50 px-12 py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl"
              >
                Get Started Free
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </Link>
            {/* <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/20 hover:border-white px-12 py-4 text-lg font-semibold rounded-2xl bg-white/10"
              >
                Try Demo First
              </Button>
            </Link> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1424] text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-16">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-6">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-violet-900/30">
                  <Brain className="h-6 w-6 text-white" />
                </span>
                <span className="text-xl font-bold tracking-tight text-white">Adaptalyfe</span>
              </Link>
              <p className="mt-4 text-sm font-medium text-violet-300">
                Grow with Guidance. Thrive with Confidence.
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
                Empowering individuals with developmental disabilities to achieve independence through
                innovative technology, personalized support, and a caring community.
              </p>
              <Link href="/register" className="mt-6 inline-block">
                <Button className="h-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-sm font-semibold text-white hover:opacity-95">
                  Start {FREE_TRIAL_DAYS}-Day Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Link columns */}
            {[
              {
                title: "Product",
                links: [
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Mobile app", href: "#pricing" },
                ],
              },
              {
                title: "Account",
                links: [
                  { label: "Log in", href: "/login" },
                  { label: "Create account", href: "/register" },
                  { label: "Forgot password", href: "/forgot-password" },
                ],
              },
              {
                title: "Legal & Support",
                links: [
                  { label: "Privacy Policy", href: "/privacy-policy" },
                  { label: "privacy@adaptalyfe.com", href: "mailto:privacy@adaptalyfe.com" },
                  { label: "security@adaptalyfe.com", href: "mailto:security@adaptalyfe.com" },
                ],
              },
            ].map((col) => (
              <div key={col.title} className="lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{col.title}</p>
                <ul className="mt-4 space-y-3">
                  {col.links.map(({ label, href }) => (
                    <li key={label}>
                      {href.startsWith("/") ? (
                        <Link href={href} className="text-sm text-slate-300 transition-colors hover:text-white">
                          {label}
                        </Link>
                      ) : (
                        <a href={href} className="break-all text-sm text-slate-300 transition-colors hover:text-white">
                          {label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} Adaptalyfe. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy-policy" className="transition-colors hover:text-white">
                Privacy
              </Link>
              <span aria-hidden className="h-3 w-px bg-white/15" />
              <span className="inline-flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                Built for more independent lives
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
