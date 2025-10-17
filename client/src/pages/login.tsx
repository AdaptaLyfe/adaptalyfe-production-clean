import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Brain, ArrowLeft, LogIn } from "lucide-react";
import { apiRequest, setSessionToken } from "@/lib/queryClient";
import { isNativeMobile } from "@/lib/mobile";

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

      // Store session token for mobile auth (if provided)
      if (userData.sessionToken) {
        setSessionToken(userData.sessionToken);
        console.log("✅ Session token saved for mobile auth");
      }

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
      }

      // Use different navigation method for mobile vs web
      if (isNativeMobile()) {
        // Force full page navigation for mobile/Capacitor
        console.log("🔄 Mobile: Navigating to", redirectPath);
        window.location.href = redirectPath;
      } else {
        // Use router navigation for web
        setLocation(redirectPath);
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid username or password",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Adaptalyfe</span>
              </div>
            </Link>
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-md mx-auto pt-16 pb-24 px-4">
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-lg w-fit mx-auto mb-4">
              <LogIn className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription className="text-base">
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
                className="w-full bg-vibrant-green hover:bg-green-600 text-black font-bold border-2 border-green-700 shadow-lg" 
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