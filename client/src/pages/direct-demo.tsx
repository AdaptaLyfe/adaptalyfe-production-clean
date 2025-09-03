import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Crown, User, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function DirectDemo() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const { toast } = useToast();

  const demoAccounts = [
    {
      username: "admin",
      password: "demo2025",
      name: "Demo Administrator",
      role: "Admin",
      description: "Complete access to all features, admin dashboard, and comprehensive demo data",
      icon: Crown,
      color: "bg-purple-100 text-purple-700 border-purple-300"
    },
    {
      username: "alex",
      password: "password",
      name: "Alex Chen",
      role: "User",
      description: "Standard user experience with basic demo data for testing user features",
      icon: User,
      color: "bg-blue-100 text-blue-700 border-blue-300"
    }
  ];

  // Auto-login with admin account on page load for fastest demo access
  useEffect(() => {
    if (!autoLoginAttempted) {
      setAutoLoginAttempted(true);
      handleAutoLogin();
    }
  }, [autoLoginAttempted]);

  const handleAutoLogin = async () => {
    setIsSubmitting(true);
    
    try {
      console.log("Attempting auto-login with admin credentials...");
      
      const response = await fetch("/api/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "admin",
          password: "demo2025"
        }),
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Auto-login successful:", data);
        
        toast({
          title: "Demo Access Granted!",
          description: "Welcome to the full Adaptalyfe demo experience",
        });

        // Redirect to dashboard after successful login
        setTimeout(() => {
          setLocation("/dashboard");
        }, 1000);
      } else {
        console.log("Auto-login failed, showing manual options");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Auto-login error:", error);
      setIsSubmitting(false);
    }
  };

  const handleManualLogin = async (account: typeof demoAccounts[0]) => {
    setIsSubmitting(true);
    
    try {
      console.log(`Attempting manual login with ${account.username}...`);
      
      const response = await fetch("/api/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: account.username,
          password: account.password
        }),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Manual login successful:", data);

      toast({
        title: "Demo Login Successful!",
        description: `Welcome ${account.name} - accessing full demo`,
      });

      // Redirect to dashboard
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("Manual login error:", error);
      toast({
        title: "Login Failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Adaptalyfe Demo</span>
              </div>
            </Link>
            <Link href="/">
              <Button variant="ghost">← Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Adaptalyfe Full Demo Access
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the complete independence-building platform with comprehensive demo data
          </p>
        </div>

        {isSubmitting ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-medium mb-2">Accessing Demo...</h3>
              <p className="text-gray-600">Setting up your full demo experience</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {demoAccounts.map((account, index) => (
              <Card key={index} className={`border-2 ${account.color} hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white">
                      <account.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{account.name}</span>
                        <Badge variant="secondary">{account.role}</Badge>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-base">
                    {account.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Username:</span>
                        <div className="font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                          {account.username}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Password:</span>
                        <div className="font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                          {account.password}
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleManualLogin(account)} 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Logging in..." : "Access Demo Dashboard"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Access Info */}
        <div className="mt-12 max-w-2xl mx-auto">
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                What You'll Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <ul className="space-y-2">
                  <li>• Daily task management system</li>
                  <li>• Mood tracking and wellness</li>
                  <li>• Financial management tools</li>
                  <li>• Academic planning features</li>
                  <li>• Medical record management</li>
                </ul>
                <ul className="space-y-2">
                  <li>• Caregiver dashboard access</li>
                  <li>• Emergency contact system</li>
                  <li>• AI assistant (AdaptAI)</li>
                  <li>• Calendar and scheduling</li>
                  <li>• Comprehensive demo data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Demo environment with sample data • All features fully functional</p>
        </div>
      </div>
    </div>
  );
}