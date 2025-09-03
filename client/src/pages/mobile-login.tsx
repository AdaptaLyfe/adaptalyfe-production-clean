import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Brain, ArrowLeft, LogIn } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function MobileLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/login", {
        username: formData.username,
        password: formData.password
      });

      toast({
        title: "Login Successful!",
        description: "Welcome back to Adaptalyfe",
      });

      // Check if there's a pending invitation to redirect to
      const pendingInvitation = localStorage.getItem('pendingInvitation');
      if (pendingInvitation) {
        localStorage.removeItem('pendingInvitation');
        setLocation(`/accept-invitation?code=${pendingInvitation}`);
      } else {
        setLocation("/dashboard");
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