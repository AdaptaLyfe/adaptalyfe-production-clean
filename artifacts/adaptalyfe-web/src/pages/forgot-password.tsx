import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Brain, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

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
            <CardTitle className="text-2xl">Forgot your password?</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send instructions to reset it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  If an account with that email exists, we sent password reset instructions. Check your inbox and spam folder.
                </div>
                <Link href="/login" className="text-blue-600 hover:underline text-sm">
                  Return to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="reset-email">Email address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="pl-9"
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-vibrant-green hover:bg-green-600 text-black font-bold border-2 border-green-700 shadow-lg"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send reset instructions"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}