import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Brain,
  Users,
  Shield,
  Heart,
  ArrowRight,
  CheckCircle,
  UserPlus,
  QrCode,
  Star,
  Zap,
  Target,
  Key,
  DollarSign,
  Smile,
  Check,
  Crown,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [invitationCode, setInvitationCode] = useState<string>("");
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("Landing page loaded - URL:", window.location.href);
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    console.log("Invitation code detected:", code);
    if (code) {
      setInvitationCode(code);
    }
  }, []);

  const { data: invitation } = useQuery({
    queryKey: [`/api/invitation/${invitationCode}`],
    enabled: !!invitationCode,
  }) as { data?: { userName: string } };

  const handleJoinWithInvitation = () => {
    localStorage.setItem("pendingInvitation", invitationCode);
    setLocation(`/register?code=${invitationCode}`);
  };

  const handleJoinWithCode = async () => {
    if (!joinCodeInput.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter an invitation code",
        variant: "destructive",
      });
      return;
    }

    // Store the code and redirect
    localStorage.setItem("pendingInvitation", joinCodeInput.trim());
    setLocation(`/register?code=${joinCodeInput.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100">
      {/* Header - Android Material Design */}
      <header className="bg-white android-header android-elevation-1 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 sm:p-2 rounded-lg">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-xl font-bold text-gray-900">Adaptalyfe</h1>
                <p className="text-[9px] sm:text-xs text-gray-500 hidden sm:block">
                  Grow with Guidance. Thrive with Confidence.
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700 border-2 border-blue-400 hover:border-blue-600 shadow-md text-xs sm:text-sm px-2 sm:px-4"
                  >
                    <Key className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Join with Code</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-blue-600" />
                      Join with Invitation Code
                    </DialogTitle>
                    <DialogDescription>
                      Enter your invitation code to create an account and join
                      your caregiver's support network.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invitation-code">Invitation Code</Label>
                      <Input
                        id="invitation-code"
                        placeholder="Enter code (e.g., ABC123)"
                        value={joinCodeInput}
                        onChange={(e) =>
                          setJoinCodeInput(e.target.value.toUpperCase())
                        }
                        className="font-mono text-center text-lg tracking-wider"
                        maxLength={6}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setIsJoinModalOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleJoinWithCode}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        Join Now
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-gray-700 hover:text-gray-900 border-2 border-gray-400 hover:border-gray-600 shadow-md text-xs sm:text-sm px-2 sm:px-4"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs sm:text-sm px-2 sm:px-4">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - with padding for fixed header */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-20 main-content-with-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Empowering Independence Through Technology
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              AdaptaLyfe is designed specifically for individuals with
              developmental disabilities, providing the tools and support needed
              to build confidence, manage daily life, and achieve greater
              independence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8"
                >
                  Start Your Journey <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              {/* <Link href="/demo">
                <Button size="lg" variant="outline" className="px-8">
                  Try Demo
                </Button>
              </Link> */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-20">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Comprehensive Support for{" "}
              <span className="text-blue-600 font-bold">Daily Living</span>
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Every feature is thoughtfully designed with accessibility,
              independence, and personal growth in mind
            </p>
          </div>

          <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/30 hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                  Daily Task Management
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Organize daily routines with visual cues, progress tracking,
                  and personalized reward systems that celebrate every
                  achievement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30 hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                  Financial Management
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Simple bill tracking, budgeting tools, and secure payment
                  links designed to build financial independence safely
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30 hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Smile className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                  Mood & Wellness
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Track emotional well-being with daily check-ins, mood
                  insights, and personalized wellness recommendations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-yellow-50/30 hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-3">
                  Support Network
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Connect securely with caregivers, family, and support
                  professionals through our comprehensive communication platform
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Additional Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-8 bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl w-fit mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                AI Assistant
              </h4>
              <p className="text-gray-600">
                Get personalized guidance and support with AdaptAI, your helpful
                companion
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-xl w-fit mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Goal Tracking
              </h4>
              <p className="text-gray-600">
                Set and achieve personal goals with visual progress tracking and
                celebrations
              </p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl w-fit mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Achievements
              </h4>
              <p className="text-gray-600">
                Earn badges and rewards for completing tasks and reaching
                milestones
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Choose Your <span className="text-blue-600">Plan</span>
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Start with a 7-day free trial. Cancel anytime. All plans include mobile app access.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="p-6 sm:p-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2.5 rounded-xl">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Basic</h4>
                    <p className="text-sm text-gray-500">Essential tools</p>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$4.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500">or $49/year (save 18%)</p>
              </div>
              <div className="p-6 sm:p-8 flex-1 flex flex-col">
                <p className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Core Features</p>
                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Daily Task Management – Create and complete daily activities</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Daily Check-ins – Simple 1–5 scale for personal reflection</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Financial Tracking – Bill reminders and due-date alerts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Appointment Management – Track personal schedules</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Trusted Contacts – Quick access to saved contacts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Mobile App Access – Full mobile functionality</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Email Support – Standard customer assistance</span>
                  </li>
                </ul>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Plan Limits</p>
                  <ul className="space-y-1.5 text-xs text-gray-500">
                    <li>• Up to 25 daily tasks per month</li>
                    <li>• Up to 2 trusted contacts</li>
                    <li>• Basic summaries and progress views</li>
                  </ul>
                </div>
                <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">Best For: Individuals starting with basic organization tools</p>
                </div>
                <Link href="/register">
                  <Button className="w-full mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-400 overflow-hidden hover:shadow-2xl transition-all duration-300 relative flex flex-col md:scale-105">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-center py-2 text-sm font-bold tracking-wide">
                <Sparkles className="w-4 h-4 inline mr-1" /> MOST POPULAR
              </div>
              <div className="p-6 sm:p-8 border-b border-gray-100 pt-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-2.5 rounded-xl">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Premium</h4>
                    <p className="text-sm text-gray-500">Advanced tools & automation</p>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$12.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500">or $129/year (save 17%)</p>
              </div>
              <div className="p-6 sm:p-8 flex-1 flex flex-col">
                <p className="text-sm font-semibold text-purple-700 mb-4 uppercase tracking-wide">Everything in Basic, plus</p>
                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Guided Assistance – Tips and suggestions based on usage</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Voice Controls – Hands-free navigation</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Text-to-Speech – Accessibility support</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Location-Based Reminders – Alerts based on your locations</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Offline Access – Use core features without internet</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Usage Patterns & Progress Journals</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Personal Records – Notes, medications, sensitivities</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Skill Challenges & Custom Task Templates</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Meal Planning & Shopping Lists</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Data Export & Guided Tutorials</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Unlimited daily tasks & trusted contacts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Expanded achievements & rewards</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Priority email support</span>
                  </li>
                </ul>
                <div className="mt-6 p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-700 font-medium">Best For: Users wanting advanced tools, automation & customization</p>
                </div>
                <Link href="/register">
                  <Button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity text-base">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>

            {/* Family / Care Team Plan */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="p-6 sm:p-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-2.5 rounded-xl">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Family / Care Team</h4>
                    <p className="text-sm text-gray-500">Multi-user coordination</p>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">$24.99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-sm text-gray-500">or $249/year (save 17%)</p>
              </div>
              <div className="p-6 sm:p-8 flex-1 flex flex-col">
                <p className="text-sm font-semibold text-amber-700 mb-4 uppercase tracking-wide">Everything in Premium, plus</p>
                <ul className="space-y-3 flex-1">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Up to 5 individual user profiles</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Shared dashboards for coordination</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Role-based access controls</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">In-app messaging & video calls</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Granular sharing & security controls</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Activity history & audit views</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Combined progress summaries</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Shared routines, templates & calendars</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Cascading contact alerts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Family achievements & milestones</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Dedicated account assistance</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Priority email & chat support</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Guided onboarding sessions</span>
                  </li>
                </ul>
                <div className="mt-6 p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium">Best For: Families & support networks coordinating daily activities</p>
                </div>
                <Link href="/register">
                  <Button className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-md">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-700 font-medium">7-day free trial on all plans • Cancel anytime • Secure payment</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Ready to Start Your Independence Journey?
          </h3>
          <p className="text-base sm:text-lg md:text-xl text-white mb-8 sm:mb-12 max-w-2xl mx-auto">
            Join thousands of individuals building confidence and achieving
            their goals with AdaptaLyfe
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-50 px-12 py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl"
              >
                Get Started Free
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </Link>
            {/* <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/20 hover:border-white px-12 py-4 text-lg font-semibold rounded-2xl bg-white/10"
              >
                Try Demo First
              </Button>
            </Link> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">Adaptalyfe</h4>
              <p className="text-gray-300 text-lg">
                Grow with Guidance. Thrive with Confidence.
              </p>
            </div>
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg mb-6">
            Empowering individuals with developmental disabilities to achieve
            independence through innovative technology, personalized support,
            and a caring community.
          </p>
          
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm sm:text-base">
            <Link href="/privacy-policy">
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                Privacy Policy
              </span>
            </Link>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400">© 2025 Adaptalyfe. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
