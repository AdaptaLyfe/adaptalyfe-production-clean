import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Brain, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

import { AuthShell } from "@/components/auth-shell";
import { AuthField } from "@/components/auth-field";
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
    <AuthShell
      backHref="/login"
      backLabel="Back to login"
      icon={KeyRound}
      title="Create a new password"
      subtitle="Choose a new password with at least 8 characters."
    >
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
                <Link href="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline text-sm">
                  Request a new reset link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <AuthField
                  id="new-password"
                  label="New password"
                  icon={Lock}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
                <AuthField
                  id="confirm-new-password"
                  label="Confirm new password"
                  icon={Lock}
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
                {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-blue-600 to-violet-600 text-[15px] font-semibold text-white shadow-lg shadow-violet-500/25 hover:opacity-95"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Reset password"}
                </Button>
              </form>
            )}
    </AuthShell>
  );
}
