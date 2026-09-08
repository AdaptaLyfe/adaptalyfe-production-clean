import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Brain, Download, UserPlus, ArrowRight, QrCode, Shield, Heart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function InviteLanding() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invitationCode, setInvitationCode] = useState<string>("");

  useEffect(() => {
    // Extract invitation code from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      setInvitationCode(code);
      fetchInvitationDetails(code);
    } else {
      setIsLoading(false);
    }
  }, [location]);

  const fetchInvitationDetails = async (code: string) => {
    try {
      const response = await apiRequest("GET", `/api/invitation/${code}`);
      const invitationData = await response.json();
      setInvitation(invitationData);
    } catch (error: any) {
      console.error("Error fetching invitation:", error);
      toast({
        title: "Invalid Invitation",
        description: "This invitation code is not valid or has expired.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    // Store invitation code for the registration process
    if (invitationCode) {
      localStorage.setItem('pendingInvitation', invitationCode);
    }
    window.location.href = '/register';
  };

  const handleSignIn = () => {
    // Store invitation code for after login
    if (invitationCode) {
      localStorage.setItem('pendingInvitation', invitationCode);
    }
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

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
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900 border-2 border-gray-400 hover:border-gray-600 shadow-md">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16">
        {/* Main Content */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-full w-fit mx-auto mb-6">
            <QrCode className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            You're Invited to Join Adaptalyfe!
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start your independence journey with support from someone who cares about you.
          </p>
        </div>

        {invitation && (
          <Card className="mb-8 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {invitation.caregiverName} wants to support you
                  </h3>
                  <p className="text-gray-600">{invitation.message}</p>
                </div>
              </div>
              <div className="bg-white/60 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Invitation Code:</strong> <span className="font-mono bg-white px-2 py-1 rounded">{invitationCode}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Download App Option */}
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-lg w-fit">
                <Download className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Download the App</CardTitle>
              <CardDescription>
                Get the full Adaptalyfe experience on your mobile device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="flex-1 bg-gray-900 hover:bg-gray-800" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    App Store (Coming Soon)
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Google Play (Coming Soon)
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Native mobile apps launching soon with enhanced features
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Web App Option */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader>
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-3 rounded-lg w-fit">
                <UserPlus className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Start Now on Web</CardTitle>
              <CardDescription>
                Create your account and begin immediately in your browser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={handleCreateAccount}
                  className="w-full bg-vibrant-green hover:bg-green-600 text-black font-bold border-2 border-green-700 shadow-lg py-3"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account with Invitation
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Already have an account?</p>
                  <Button 
                    onClick={handleSignIn}
                    variant="outline" 
                    className="w-full"
                  >
                    Sign In to Accept Invitation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Preview */}
        <Card className="bg-white/80 backdrop-blur-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">What You'll Get with Adaptalyfe</CardTitle>
            <CardDescription>
              Tools designed to help you live independently with confidence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-lg w-fit mx-auto mb-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Task Management</h4>
                <p className="text-sm text-gray-600">
                  Organize daily tasks with reminders and progress tracking
                </p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-lg w-fit mx-auto mb-3">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Mood Tracking</h4>
                <p className="text-sm text-gray-600">
                  Monitor emotional well-being and identify patterns
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-lg w-fit mx-auto mb-3">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Caregiver Support</h4>
                <p className="text-sm text-gray-600">
                  Stay connected with your support network
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Grow with Guidance. Thrive with Confidence.
          </p>
        </div>
      </div>
    </div>
  );
}