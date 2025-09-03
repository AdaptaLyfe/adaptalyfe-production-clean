import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, User, Crown } from "lucide-react";

export default function DemoLoginSimple() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setMessage("Please enter both username and password");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    
    try {
      const response = await fetch("/api/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Login successful:", data);
      
      setMessage("Login successful! Redirecting to dashboard...");
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
      
    } catch (error: any) {
      console.error("Login error:", error);
      setMessage(`Login failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const autoFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Adaptalyfe Demo Access
          </h1>
          <p className="text-xl text-gray-600">
            Experience the full power of Adaptalyfe with our demo accounts
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Admin Account */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Crown className="h-5 w-5" />
                Admin Account
              </CardTitle>
              <CardDescription>
                Full access to all features including admin dashboard and caregiver tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Username:</strong> admin</p>
                <p><strong>Password:</strong> demo2025</p>
                <Button 
                  onClick={() => autoFill("admin", "demo2025")}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Auto-fill Admin Credentials
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* User Account */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <User className="h-5 w-5" />
                User Account
              </CardTitle>
              <CardDescription>
                Standard user experience with access to all personal management tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Username:</strong> alex</p>
                <p><strong>Password:</strong> password</p>
                <Button 
                  onClick={() => autoFill("alex", "password")}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Auto-fill User Credentials
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Login Form */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Demo Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              {message && (
                <div className={`text-sm p-3 rounded ${
                  message.includes("successful") 
                    ? "bg-green-50 text-green-800 border border-green-200" 
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {message}
                </div>
              )}

              <Button 
                type="submit" 
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login to Demo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            <a href="/" className="text-blue-600 hover:underline">
              ← Back to Landing Page
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}