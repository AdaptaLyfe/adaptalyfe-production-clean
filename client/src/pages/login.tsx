import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Brain, ArrowLeft, LogIn, AtSign, Lock, Ticket } from "lucide-react";
import { apiRequest, ApiError, setSessionToken, getSessionToken } from "@/lib/queryClient";
import { trackLogin } from "@/lib/firebase";

import { AuthShell } from "@/components/auth-shell";
import { AuthField } from "@/components/auth-field";
function isNativeMobile(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cap = (window as any).Capacitor;
    return cap?.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    invitationCode: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInvitationCode, setHasInvitationCode] = useState(false);
  const [showInviteField, setShowInviteField] = useState(false);

  // Redirect authenticated users to dashboard (prevents back button loop)
  useEffect(() => {
    const sessionToken = getSessionToken();
    if (sessionToken) {
      console.log('🔄 Login: Already authenticated, redirecting to dashboard');
      window.location.replace('/dashboard');
    }
  }, []);

  // Check for invitation code from URL parameters when component loads
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invitationFromUrl = urlParams.get('code');
    
    if (invitationFromUrl) {
      setFormData(prev => ({ ...prev, invitationCode: invitationFromUrl }));
      setHasInvitationCode(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/login", {
        username: formData.username,
        password: formData.password
      });

      // Get user data to ensure session is properly established
      const userData = await response.json();

      // Browsers use the HttpOnly cookie session. Only a native Capacitor app
      // keeps the independent bearer token returned by the API.
      if (userData.sessionToken && isNativeMobile()) {
        setSessionToken(userData.sessionToken);
        console.log("✅ Session token saved for mobile auth");
      }
      trackLogin("password");

      toast({
        title: "Login Successful!",
        description: "Welcome back to Adaptalyfe",
      });

      // Small delay to ensure session cookies are set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Determine redirect path
      let redirectPath = "/dashboard";
      if (formData.invitationCode) {
        redirectPath = `/accept-invitation?code=${formData.invitationCode}`;
      } else {
        const pendingInvitation = localStorage.getItem('pendingInvitation');
        if (pendingInvitation) {
          localStorage.removeItem('pendingInvitation');
          redirectPath = `/accept-invitation?code=${pendingInvitation}`;
        }
        // Note: subscription gating is handled by useSubscriptionEnforcement middleware
        // after the user reaches the dashboard. Checking subscription status here is
        // unreliable because the login response only returns { id, username, name, email, isAdmin }
        // and does not include subscriptionTier / subscriptionStatus.
      }

      // Clear browser history and navigate to dashboard
      // This prevents back button from returning to login
      console.log("🔄 Clearing history and navigating to", redirectPath);
      
      // Mark that we just logged in (used by back button handler)
      sessionStorage.setItem('just_logged_in', 'true');
      
      // Replace current entry and navigate
      window.location.replace(redirectPath);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error instanceof ApiError && error.status === 401
          ? "Invalid email or password. Please try again."
          : error.message || "Invalid username or password",
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
      icon={LogIn}
      title="Welcome back"
      subtitle="Sign in to continue your independence journey"
    >
            <form onSubmit={handleSubmit} className="space-y-5">
              <AuthField
                id="username"
                label="Username"
                icon={AtSign}
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />

              <AuthField
                id="password"
                label="Password"
                icon={Lock}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                labelRight={
                  <Link href="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                    Forgot password?
                  </Link>
                }
              />

              {hasInvitationCode ? (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                  <AuthField
                    id="invitationCode"
                    label="Caregiver invitation code"
                    icon={Ticket}
                    type="text"
                    value={formData.invitationCode}
                    onChange={(e) => setFormData({...formData, invitationCode: e.target.value})}
                    readOnly
                    hint={<p className="mt-1.5 text-xs text-indigo-700">You'll become a caregiver after signing in.</p>}
                  />
                </div>
              ) : showInviteField ? (
                <AuthField
                  id="invitationCode"
                  label={<>Caregiver invitation code <span className="font-normal text-slate-400">(optional)</span></>}
                  icon={Ticket}
                  type="text"
                  value={formData.invitationCode}
                  onChange={(e) => setFormData({...formData, invitationCode: e.target.value})}
                  placeholder="Enter your code"
                />
              ) : null}

              <Button
                type="submit"
                className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-[15px] font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/35"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>

              {!hasInvitationCode && !showInviteField && (
                <button
                  type="button"
                  onClick={() => setShowInviteField(true)}
                  className="mx-auto flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600"
                >
                  <Ticket className="h-4 w-4" />
                  Have a caregiver invitation code?
                </button>
              )}

              <div className="border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
                New to Adaptalyfe?{" "}
                <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                  Create a free account
                </Link>
              </div>
            </form>
    </AuthShell>
  );
}
