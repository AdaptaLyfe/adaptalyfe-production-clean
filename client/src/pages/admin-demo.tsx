import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Crown, User, Key } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function AdminDemo() {
  const [, setLocation] = useLocation();
  const [adminKey, setAdminKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Admin key for secure demo access
  const ADMIN_DEMO_KEY = "adaptalyfe-admin-2025";

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

  const handleQuickLogin = async (account: typeof demoAccounts[0]) => {
    setIsSubmitting(true);
    
    try {
      // Make direct fetch request to avoid any API client issues
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
        const errorData = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Demo login response:", data);

      toast({
        title: "Demo Login Successful!",
        description: `Welcome ${account.name} - accessing full demo features`,
      });

      // Redirect to dashboard
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (adminKey !== ADMIN_DEMO_KEY) {
      toast({
        title: "Access Denied",
        description: "Valid admin key required for demo access",
        variant: "destructive"
      });
      return;
    }

    if (!username || !password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter username and password",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/demo-login", {
        username,
        password
      });

      toast({
        title: "Demo Login Successful!",
        description: `Welcome to the Adaptalyfe admin demo`,
      });

      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Adaptalyfe Admin Demo</span>
              </div>
            </Link>
            <Link href="/">
              <Button variant="ghost">Back to Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto pt-16 pb-24 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Adaptalyfe Full Demo Access
          </h1>
          <p className="text-lg text-gray-600">
            Experience the complete Adaptalyfe platform with comprehensive demo data
          </p>
        </div>

        {/* Demo Access Info */}
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Shield className="h-5 w-5" />
              Demo Access Available
            </CardTitle>
            <CardDescription>
              Click any account below to instantly access the full Adaptalyfe platform
            </CardDescription>
          </CardHeader>
        </Card>

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
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
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
                    onClick={() => handleQuickLogin(account)} 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Logging in..." : "Login Instantly"}
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
                  Admin Demo Login
                </CardTitle>
                <CardDescription>
                  Use "Login Instantly" buttons above for quick access, or enter credentials manually
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
                      disabled={adminKey !== ADMIN_DEMO_KEY}
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
                      disabled={adminKey !== ADMIN_DEMO_KEY}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleLogin} 
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting || !username || !password || adminKey !== ADMIN_DEMO_KEY}
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
      </div>
    </div>
  );
}