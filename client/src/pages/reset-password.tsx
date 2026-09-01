import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Brain, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const queryToken = new URLSearchParams(window.location.search).get("token") || "";
    setToken(queryToken);
    if (!queryToken) {
      setIsChecking(false);
      return;
    }

    apiRequest("GET", `/api/password-reset/validate?token=${encodeURIComponent(queryToken)}`)
      .then((response) => response.json())
      .then((data) => setIsValid(Boolean(data.valid)))
      .catch(() => setIsValid(false))
      .finally(() => setIsChecking(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/reset-password", { token, password });
      setMessage("Your password was reset successfully. You can now sign in.");
      setIsValid(false);
    } catch (requestError: any) {
      setError(requestError?.message || "This reset link is invalid, expired, or has already been used.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50">
      <header className="bg-white shadow-sm border-b">
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
            <Link href="/login">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto pt-16 pb-24 px-4">
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-3 rounded-lg w-fit mx-auto mb-4">
              <KeyRound className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Create a new password</CardTitle>
            <CardDescription>
              Choose a new password with at least 8 characters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isChecking ? (
              <p className="text-center text-gray-600">Checking your reset link...</p>
            ) : message ? (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</div>
                <Button type="button" onClick={() => setLocation("/login")} className="w-full">
                  Continue to login
                </Button>
              </div>
            ) : !isValid ? (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  This reset link is invalid, expired, or has already been used.
                </div>
                <Link href="/forgot-password" className="text-blue-600 hover:underline text-sm">
                  Request a new reset link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-new-password">Confirm new password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    className="mt-1"
                  />
                </div>
                {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-vibrant-green hover:bg-green-600 text-black font-bold border-2 border-green-700 shadow-lg"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Reset password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}