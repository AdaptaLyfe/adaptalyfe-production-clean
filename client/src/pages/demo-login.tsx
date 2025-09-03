import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, User, Crown, Lock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import Navigation from "@/components/simple-navigation";

export default function DemoLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

  const demoAccounts = [
    {
      username: "admin",
      password: "demo2025",
      name: "Demo Administrator",
      role: "Admin",
      description: "Full access to all features, admin dashboard, and comprehensive demo data",
      icon: Crown,
      color: "bg-purple-100 text-purple-700 border-purple-300"
    },
    {
      username: "alex",
      password: "password",
      name: "Alex Chen",
      role: "User",
      description: "Standard user account with basic demo data for testing user features",
      icon: User,
      color: "bg-blue-100 text-blue-700 border-blue-300"
    }
  ];

  const handleAuthorizeAccess = () => {
    if (adminKey === "adaptalyfe-admin-2025") {
      setIsAuthorized(true);
      toast({
        title: "Access Authorized",
        description: "You can now view demo credentials",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid admin key",
        variant: "destructive"
      });
    }
  };

  const handleQuickLogin = (account: typeof demoAccounts[0]) => {
    // Auto-fill the form with the selected account
    setUsername(account.username);
    setPassword(account.password);
    
    // Show helpful message
    toast({
      title: "Credentials Filled",
      description: `Username: ${account.username} | Password: ${account.password}`,
    });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both username and password",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Attempting demo login with:", { username, password });
      
      // Make direct fetch request to avoid any API client issues
      const response = await fetch("/api/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password
        }),
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Demo login response:", data);

      toast({
        title: "Demo Login Successful!",
        description: `Welcome to Adaptalyfe demo - redirecting...`,
      });

      // Clear all queries and force a fresh start
      queryClient.clear();
      
      // Delay to show the toast, then redirect using the React router
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Demo login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Try username: admin, password: demo2025",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Adaptalyfe Demo Access
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the full power of Adaptalyfe with our comprehensive demo accounts. 
              Choose admin access for complete feature demonstration or user access for the standard experience.
            </p>
          </div>

          {/* Quick Access Info */}
          <div className="mb-8">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Shield className="h-5 w-5" />
                  Quick Demo Access
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Use these credentials to access the demo immediately
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800">Admin Access</h4>
                    <p className="text-sm text-blue-600">Username: <strong>admin</strong></p>
                    <p className="text-sm text-blue-600">Password: <strong>demo2025</strong></p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800">User Access</h4>
                    <p className="text-sm text-blue-600">Username: <strong>alex</strong></p>
                    <p className="text-sm text-blue-600">Password: <strong>password</strong></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Authorization */}
          {!isAuthorized && (
            <div className="mb-8">
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <Lock className="h-5 w-5" />
                    Admin Authorization (Optional)
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    Enter the admin key to access additional demo features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="adminKey">Admin Key</Label>
                    <Input
                      id="adminKey"
                      type="password"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      placeholder="Enter admin key (optional)"
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleAuthorizeAccess}
                    className="w-full"
                    disabled={!adminKey}
                  >
                    Authorize Access
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Demo Accounts */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Demo Accounts</h2>
              
              {demoAccounts.map((account, index) => (
                <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${account.color}`}>
                        <account.icon className="h-6 w-6" />
                      </div>
                      {account.name}
                      <Badge className={account.color}>{account.role}</Badge>
                    </CardTitle>
                    <CardDescription className="text-base">
                      {account.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleQuickLogin(account)}
                      className="w-full"
                      variant={account.role === "Admin" ? "default" : "outline"}
                      disabled={!isAuthorized}
                    >
                      {isAuthorized ? "Show Credentials" : "Authorization Required"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Login Form */}
            <div>
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-6 w-6" />
                    Demo Login
                  </CardTitle>
                  <CardDescription>
                    Enter credentials manually for secure demo access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleLogin} 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting || !username || !password}
                  >
                    {isSubmitting ? "Logging in..." : "Login to Demo"}
                  </Button>

                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-gray-900 mb-3">Features Available:</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-purple-600" />
                        <span><strong>Admin Account:</strong> Full access, admin dashboard, all premium features</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span><strong>User Account:</strong> Standard experience, basic features, user perspective</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Demo Environment Notice</h3>
              <p className="text-blue-700">
                This is a comprehensive demonstration environment. All data is simulated and reset periodically. 
                Use the admin account to showcase the full capabilities of SkillBridge to potential users, 
                healthcare providers, and stakeholders.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}