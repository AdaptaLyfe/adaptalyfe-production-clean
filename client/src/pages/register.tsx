import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Brain, ArrowLeft, Shield, Heart, UserPlus, User, Mail, AtSign, Ticket, Lock, Eye, EyeOff, Sparkles, ShieldCheck, CalendarCheck, CreditCard } from "lucide-react";
import { apiRequest, getSessionToken, isNativeClient, setSessionToken } from "@/lib/queryClient";
import { trackSignUp } from "@/lib/firebase";
import { FREE_TRIAL_DAYS } from "@shared/subscription";

import { AuthShell } from "@/components/auth-shell";
/** Simple 0–4 password strength score shown under the password field. */
function passwordStrength(value: string) {
  if (!value) return { score: 0, label: "", color: "" };
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const levels = [
    { label: "Too short", color: "bg-rose-400" },
    { label: "Weak", color: "bg-rose-400" },
    { label: "Fair", color: "bg-amber-400" },
    { label: "Good", color: "bg-indigo-500" },
    { label: "Strong", color: "bg-emerald-500" },
  ];
  return { score, ...levels[score] };
}

const FIELD_ICON = "pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    plan: "basic",
    agreeToTerms: false,
    ageVerified: false,
    subscribeNewsletter: false,
    invitationCode: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInvitation, setHasInvitation] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Plan and billing period picked on the landing page (?plan=premium&billing=yearly).
  // They are carried through to /subscription so the user doesn't have to choose again.
  const [chosenPlan] = useState<{ plan: "basic" | "premium" | "family"; cycle: "monthly" | "annual" } | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const plan = params.get("plan");
      const billing = params.get("billing") ?? params.get("billingCycle");
      if (plan !== "basic" && plan !== "premium" && plan !== "family") return null;
      const cycle = billing === "yearly" || billing === "annual" ? "annual" : "monthly";
      return { plan, cycle };
    } catch {
      return null;
    }
  });
  const chosenPlanLabel = chosenPlan
    ? `${chosenPlan.plan === "family" ? "Family / Care Team" : chosenPlan.plan === "premium" ? "Premium" : "Basic"} · ${chosenPlan.cycle === "annual" ? "Yearly" : "Monthly"}`
    : null;

  // Redirect authenticated users to dashboard (prevents back button loop)
  useEffect(() => {
    const sessionToken = getSessionToken();
    if (sessionToken) {
      console.log('🔄 Register: Already authenticated, redirecting to dashboard');
      window.location.replace('/dashboard');
    }
  }, []);

  // Check for mobile device and invitation code on component mount
  useEffect(() => {
    try {
      console.log("Register: Component mounted, checking for mobile and invitation code");
      
      // Mobile detection
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      console.log("Register: Mobile detected:", mobile);
      
      // URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('code');
      const codeFromStorage = localStorage.getItem('pendingInvitation');
      
      console.log("Register: Code from URL:", codeFromUrl);
      console.log("Register: Code from storage:", codeFromStorage);
      
      if (codeFromUrl || codeFromStorage) {
        const invitationCode = codeFromUrl || codeFromStorage || "";
        setFormData(prev => ({ ...prev, invitationCode }));
        setHasInvitation(true);
        console.log("Register: Invitation code set:", invitationCode);
        
        // Clear from localStorage if we used it
        if (codeFromStorage && !codeFromUrl) {
          localStorage.removeItem('pendingInvitation');
        }
      }
    } catch (error) {
      console.error("Register: Error in useEffect:", error);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password",
        description: "Passwords do not match",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.ageVerified) {
      toast({
        title: "Age Verification Required",
        description: "You must be 13 or older to create an Adaptalyfe account.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms of service",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/register", formData);
      const registration = await response.json();

      // Keep native authentication independent from the web cookie while
      // preserving the existing subscription and invitation redirects.
      if (isNativeClient() && registration.sessionToken) {
        setSessionToken(registration.sessionToken);
      }
      
      trackSignUp("email");
      toast({
        title: "Registration Successful!",
        description: `Welcome to AdaptaLyfe, ${formData.name}!`,
      });

      if (formData.invitationCode) {
        try {
          const orgRes = await apiRequest("POST", "/api/org-codes/redeem", { code: formData.invitationCode });
          const orgData = await orgRes.json();
          toast({
            title: "Organization Code Applied!",
            description: `Free access granted through ${orgData.orgName}.`,
          });
          setLocation("/dashboard");
        } catch {
          setLocation(`/accept-invitation?code=${formData.invitationCode}`);
        }
      } else {
        // Redirect to subscription page so users can choose and activate their plan
        setLocation(
          chosenPlan
            ? `/subscription?plan=${chosenPlan.plan}&billingCycle=${chosenPlan.cycle}`
            : "/subscription",
        );
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <AuthShell
      backHref="/"
      backLabel="Back to home"
      icon={UserPlus}
      size="wide"
      eyebrow={
        <span className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600">
            <Sparkles className="h-3 w-3 text-white" />
          </span>
          Free for {FREE_TRIAL_DAYS} days · No card needed to start
        </span>
      }
      title="Create your account"
      subtitle="Start your independence journey with Adaptalyfe"
      headerExtra={chosenPlanLabel ? (
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
          Selected plan: {chosenPlanLabel}
          <Link href="/#pricing" className="text-xs font-semibold text-indigo-600 underline underline-offset-2">
            Change
          </Link>
        </div>
      ) : null}
    >
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <div className="group relative mt-1">
                    <User className={FIELD_ICON} />
                    <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Your full name"
                    required
                    className="pl-11"
                  />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="group relative mt-1">
                    <Mail className={FIELD_ICON} />
                    <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="you@example.com"
                    required
                    className="pl-11"
                  />
                  </div>
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <div className="group relative mt-1">
                    <AtSign className={FIELD_ICON} />
                    <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="Choose a username"
                    required
                    className="pl-11"
                    autoComplete="new-username"
                  />
                  </div>
                </div>
                <div>
                  <Label htmlFor="invitationCode">
                    Invitation Code <span className="font-normal text-slate-400">(optional)</span>
                  </Label>
                  <div className="group relative mt-1">
                    <Ticket className={FIELD_ICON} />
                    <Input
                    id="invitationCode"
                    type="text"
                    value={formData.invitationCode}
                    onChange={(e) => setFormData({...formData, invitationCode: e.target.value.toUpperCase()})}
                    placeholder="Enter code"
                    className="pl-11 uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal"
                  />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="group relative mt-1">
                    <Lock className={FIELD_ICON} />
                    <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Create a password"
                    required
                    className="pl-11 pr-10"
                    autoComplete="new-password"
                  />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-indigo-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {(() => {
                    const strength = passwordStrength(formData.password);
                    return (
                      <div className="mt-1.5 flex items-center gap-2" aria-live="polite">
                        <div className="flex flex-1 gap-1">
                          {[1, 2, 3, 4].map((step) => (
                            <span
                              key={step}
                              className={`h-1 flex-1 rounded-full transition-colors ${strength.score >= step ? strength.color : "bg-slate-200"}`}
                            />
                          ))}
                        </div>
                        <span className="w-14 text-right text-[11px] font-medium text-slate-500">{strength.label}</span>
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="group relative mt-1">
                    <Lock className={FIELD_ICON} />
                    <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Repeat password"
                    required
                    className="pl-11 pr-11"
                    autoComplete="new-password"
                  />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-indigo-600"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className={`mt-1.5 h-4 text-[11px] font-medium ${formData.confirmPassword && formData.confirmPassword === formData.password ? "text-emerald-600" : formData.confirmPassword ? "text-rose-500" : "text-transparent"}`}>
                    {formData.confirmPassword && formData.confirmPassword === formData.password ? "✓ Passwords match" : "Passwords don't match yet"}
                  </p>
                </div>
              </div>
              {hasInvitation && (
                <p className="mt-2 text-sm text-emerald-600">✓ Code detected - will be applied after registration</p>
              )}

              <div className="mt-5 space-y-2.5 text-sm">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="ageVerified"
                    className="h-5 w-5 rounded-md border-slate-300 transition-colors data-[state=checked]:border-transparent data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-blue-600 data-[state=checked]:to-violet-600 data-[state=checked]:text-white"
                    checked={formData.ageVerified}
                    onCheckedChange={(checked) => setFormData({...formData, ageVerified: checked as boolean})}
                  />
                  <Label htmlFor="ageVerified" className="cursor-pointer leading-5 text-slate-800">
                    I confirm I am 13 or older{" "}
                    <span className="font-normal text-amber-700">(not available to children under 13)</span>
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    className="h-5 w-5 rounded-md border-slate-300 transition-colors data-[state=checked]:border-transparent data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-blue-600 data-[state=checked]:to-violet-600 data-[state=checked]:text-white"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked as boolean})}
                  />
                  <Label htmlFor="terms" className="cursor-pointer leading-5 text-slate-800">
                    I agree to the <Link href="/terms" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">Terms of Service</Link> and{" "}
                    <Link href="/privacy-policy" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">Privacy Policy</Link>
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="newsletter"
                    className="h-5 w-5 rounded-md border-slate-300 transition-colors data-[state=checked]:border-transparent data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-blue-600 data-[state=checked]:to-violet-600 data-[state=checked]:text-white"
                    checked={formData.subscribeNewsletter}
                    onCheckedChange={(checked) => setFormData({...formData, subscribeNewsletter: checked as boolean})}
                  />
                  <Label htmlFor="newsletter" className="cursor-pointer leading-5 font-normal text-slate-700">
                    Send me updates and independence tips <span className="text-slate-400">(optional)</span>
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="group mt-5 h-12 w-full rounded-xl border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-[15px] font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/35"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating your account..." : "Create my free account"}
              </Button>

              <p className="mt-4 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                  Sign in
                </Link>
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                {[
                  { icon: CalendarCheck, label: `${FREE_TRIAL_DAYS}-day free trial` },
                  { icon: CreditCard, label: "Cancel anytime" },
                  { icon: ShieldCheck, label: "Secure & private" },
                ].map(({ icon: BadgeIcon, label }) => (
                  <div key={label} className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 sm:text-xs">
                    <BadgeIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                    {label}
                  </div>
                ))}
              </div>
            </form>
    </AuthShell>
  );
}
