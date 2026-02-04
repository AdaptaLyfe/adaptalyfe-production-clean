import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Brain, ArrowLeft, Shield, Heart } from "lucide-react";
import { apiRequest, getSessionToken } from "@/lib/queryClient";

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
        title: "Password Mismatch",
        description: "Passwords do not match",
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

    if (!formData.ageVerified) {
      toast({
        title: "Age Verification Required",
        description: "Users under 13 must have a parent or guardian create their account",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await apiRequest("POST", "/api/register", formData);
      
      toast({
        title: "Registration Successful!",
        description: `Welcome to AdaptaLyfe, ${formData.name}!`,
      });

      // If there's an invitation code, redirect to accept invitation
      if (formData.invitationCode) {
        setLocation(`/accept-invitation?code=${formData.invitationCode}`);
      } else {
        setLocation("/dashboard");
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

  const planPrices = {
    basic: "$4.99/month",
    premium: "$12.99/month", 
    family: "$24.99/month"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50">
      {/* Header - matches main landing page */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Adaptalyfe</h1>
                  <p className="text-xs text-gray-500">Grow with Guidance. Thrive with Confidence.</p>
                </div>
              </div>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900 border-2 border-gray-400 hover:border-gray-600 shadow-md">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto pt-16 pb-24 px-4">
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-lg w-fit mx-auto mb-4">
              <Heart className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription className="text-base">
              Start your independence journey with Adaptalyfe
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Personal Information</h3>
                
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your full name"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter your email"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Account Setup */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Account Setup</h3>
                
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="Choose a username"
                    required
                    className="mt-1"
                    autoComplete="new-username"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Create a strong password"
                    required
                    className="mt-1"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Confirm your password"
                    required
                    className="mt-1"
                    autoComplete="new-password"
                  />
                </div>

                {/* Invitation Code Section */}
                <div>
                  <Label htmlFor="invitationCode">Invitation Code (Optional)</Label>
                  <Input
                    id="invitationCode"
                    type="text"
                    value={formData.invitationCode}
                    onChange={(e) => setFormData({...formData, invitationCode: e.target.value})}
                    placeholder="Enter invitation code if you have one"
                    className="mt-1"
                  />
                  {hasInvitation && (
                    <p className="text-sm text-green-600 mt-1">✓ Invitation code detected - your caregiver will join your support network after registration</p>
                  )}
                </div>
              </div>

              {/* Plan Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Choose Your Plan</h3>
                
                <div>
                  <Label htmlFor="plan">Subscription Plan</Label>
                  <Select value={formData.plan} onValueChange={(value) => setFormData({...formData, plan: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic - {planPrices.basic}</SelectItem>
                      <SelectItem value="premium">Premium - {planPrices.premium}</SelectItem>
                      <SelectItem value="family">Family - {planPrices.family}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Age Verification */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Age Verification</h3>
                
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="ageVerified"
                      checked={formData.ageVerified}
                      onCheckedChange={(checked) => setFormData({...formData, ageVerified: checked as boolean})}
                    />
                    <div className="text-sm">
                      <Label htmlFor="ageVerified" className="cursor-pointer font-medium text-gray-900">
                        I confirm that I am 13 years of age or older
                      </Label>
                      <p className="text-amber-700 mt-1">
                        Users under 13 must have a parent or guardian create an account on their behalf.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agreements */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked as boolean})}
                  />
                  <div className="text-sm">
                    <Label htmlFor="terms" className="cursor-pointer">
                      I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and{" "}
                      <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="newsletter"
                    checked={formData.subscribeNewsletter}
                    onCheckedChange={(checked) => setFormData({...formData, subscribeNewsletter: checked as boolean})}
                  />
                  <Label htmlFor="newsletter" className="text-sm cursor-pointer">
                    Subscribe to updates and independence tips (optional)
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Sign in here
                </Link>
              </div>

              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  7-day free trial • Cancel anytime • Secure payment processing
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}