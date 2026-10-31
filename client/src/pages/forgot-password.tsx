import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Brain, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

import { AuthShell } from "@/components/auth-shell";
import { AuthField } from "@/components/auth-field";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await apiRequest("POST", "/api/forgot-password", { email });
      setSubmitted(true);
    } catch {
      setError("We couldn't submit that request right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      backHref="/login"
      backLabel="Back to login"
      icon={KeyRound}
      title="Forgot your password?"
      subtitle="Enter your email and we'll send instructions to reset it."
    >
            {submitted ? (
              <div className="space-y-4 text-center">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  If an account with that email exists, we sent password reset instructions. Check your inbox and spam folder.
                </div>
                <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline text-sm">
                  Return to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <AuthField
                  id="reset-email"
                  label="Email address"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-[15px] font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/35"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            )}
    </AuthShell>
  );
}
