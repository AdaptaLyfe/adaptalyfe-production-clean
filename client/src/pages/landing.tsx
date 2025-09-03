import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Users, Shield, Heart, ArrowRight, CheckCircle, UserPlus, QrCode, Star, Zap, Target, Key, DollarSign, Smile } from "lucide-react";
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
    const code = urlParams.get('code');
    console.log("Invitation code detected:", code);
    if (code) {
      setInvitationCode(code);
    }
  }, []);

  const { data: invitation } = useQuery({
    queryKey: [`/api/invitation/${invitationCode}`],
    enabled: !!invitationCode
  }) as { data?: { userName: string } };

  const handleJoinWithInvitation = () => {
    localStorage.setItem('pendingInvitation', invitationCode);
    setLocation(`/register?code=${invitationCode}`);
  };

  const handleJoinWithCode = async () => {
    if (!joinCodeInput.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter an invitation code",
        variant: "destructive"
      });
      return;
    }

    // Store the code and redirect
    localStorage.setItem('pendingInvitation', joinCodeInput.trim());
    setLocation(`/register?code=${joinCodeInput.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Adaptalyfe</h1>
                <p className="text-xs text-gray-500">Grow with Guidance. Thrive with Confidence.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 border-2 border-blue-400 hover:border-blue-600 shadow-md">
                    <Key className="w-4 h-4 mr-2" />
                    Join with Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-blue-600" />
                      Join with Invitation Code
                    </DialogTitle>
                    <DialogDescription>
                      Enter your invitation code to create an account and join your caregiver's support network.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invitation-code">Invitation Code</Label>
                      <Input
                        id="invitation-code"
                        placeholder="Enter code (e.g., ABC123)"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
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
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900 border-2 border-gray-400 hover:border-gray-600 shadow-md">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>



      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Empowering Independence Through Technology
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              AdaptaLyfe is designed specifically for individuals with developmental disabilities, 
              providing the tools and support needed to build confidence, manage daily life, 
              and achieve greater independence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8">
                    Start Your Journey <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" className="px-8">
                  Try Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Comprehensive Support for{" "}
              <span className="text-blue-600 font-bold">
                Daily Living
              </span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every feature is thoughtfully designed with accessibility, independence, and personal growth in mind
            </p>
          </div>

          <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-indigo-50/30 hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-3">Daily Task Management</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Organize daily routines with visual cues, progress tracking, and personalized reward systems that celebrate every achievement
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30 hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-3">Financial Management</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Simple bill tracking, budgeting tools, and secure payment links designed to build financial independence safely
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30 hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Smile className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-3">Mood & Wellness</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Track emotional well-being with daily check-ins, mood insights, and personalized wellness recommendations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-yellow-50/30 hover:scale-105">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-6 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 mb-3">Support Network</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Connect securely with caregivers, family, and support professionals through our comprehensive communication platform
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
              <h4 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h4>
              <p className="text-gray-600">Get personalized guidance and support with AdaptAI, your helpful companion</p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-xl w-fit mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Goal Tracking</h4>
              <p className="text-gray-600">Set and achieve personal goals with visual progress tracking and celebrations</p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl w-fit mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Achievements</h4>
              <p className="text-gray-600">Earn badges and rewards for completing tasks and reaching milestones</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Independence Journey?
          </h3>
          <p className="text-xl text-white mb-12 max-w-2xl mx-auto">
            Join thousands of individuals building confidence and achieving their goals with AdaptaLyfe
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
            <Link href="/demo">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white/20 hover:border-white px-12 py-4 text-lg font-semibold rounded-2xl bg-white/10"
              >
                Try Demo First
              </Button>
            </Link>
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
              <p className="text-gray-300 text-lg">Grow with Guidance. Thrive with Confidence.</p>
            </div>
          </div>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Empowering individuals with developmental disabilities to achieve independence through 
            innovative technology, personalized support, and a caring community.
          </p>
        </div>
      </footer>
    </div>
  );
}