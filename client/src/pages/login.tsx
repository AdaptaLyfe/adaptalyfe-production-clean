import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Brain, ArrowLeft } from "lucide-react";
import { apiRequest, ApiError, setSessionToken, getSessionToken } from "@/lib/queryClient";
import { trackLogin } from "@/lib/firebase";

import { AuthHeader } from "@/components/auth-header";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Navigation */}
      <AuthHeader backHref="/" backLabel="Back to home" />

      <div className="max-w-md mx-auto pt-16 pb-24 px-4">
        <Card className="rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <CardHeader className="text-center pt-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Welcome back</h1>
            <CardDescription className="mt-1.5 text-base text-slate-500">
              Sign in to continue your independence journey
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Enter your username"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Enter your password"
                  required
                  className="mt-1"
                />
                <div className="text-right mt-2">
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {hasInvitationCode && (
                <div className="bg-blue-50 p-3 rounded-lg border">
                  <Label htmlFor="invitationCode" className="text-blue-700 font-medium">Caregiver Invitation Code</Label>
                  <Input
                    id="invitationCode"
                    type="text"
                    value={formData.invitationCode}
                    onChange={(e) => setFormData({...formData, invitationCode: e.target.value})}
                    placeholder="Enter invitation code"
                    className="mt-1 bg-white"
                    readOnly={true}
                  />
                  <p className="text-xs text-blue-600 mt-1">You'll become a caregiver after logging in</p>
                </div>
              )}

              {!hasInvitationCode && (
                <div>
                  <Label htmlFor="invitationCode">Have a Caregiver Invitation Code? (Optional)</Label>
                  <Input
                    id="invitationCode"
                    type="text"
                    value={formData.invitationCode}
                    onChange={(e) => setFormData({...formData, invitationCode: e.target.value})}
                    placeholder="Enter invitation code to become a caregiver"
                    className="mt-1"
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-blue-600 to-violet-600 text-[15px] font-semibold text-white shadow-lg shadow-violet-500/25 hover:opacity-95" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>

              <div className="text-center space-y-4">
                <div className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-blue-600 hover:underline">
                    Create one here
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}