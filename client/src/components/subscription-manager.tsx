import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown, Check, X, Sparkles, Zap, Heart, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SubscriptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionManager({ isOpen, onClose }: SubscriptionManagerProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  }) as { data: any };

  const isPremium = user?.subscriptionTier === 'premium' || user?.subscriptionStatus === 'active';

  const basicFeatures = [
    "Daily task management",
    "Mood tracking",
    "Financial planning",
    "Appointment scheduling",
    "Caregiver communication",
    "Basic achievements"
  ];

  const premiumFeatures = [
    "AI chatbot support 24/7",
    "Advanced health tracking",
    "Medication reminders",
    "Text-to-speech accessibility",
    "Voice commands",
    "Life skills training modules",
    "Progress photo journals",
    "Skill challenges & badges",
    "Enhanced goal tracking",
    "Personalized recommendations"
  ];

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    // Simulate upgrade process
    setTimeout(() => {
      setIsUpgrading(false);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Adaptalyfe Subscription Plans
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Basic Plan */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Basic Plan</CardTitle>
                <Badge variant="outline">Current</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">Free</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {basicFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-2 border-gradient-to-br from-yellow-400 to-orange-500">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Premium Plan
                </CardTitle>
                {isPremium && <Badge className="bg-green-600">Active</Badge>}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">$9.99</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600 mb-2">Everything in Basic, plus:</div>
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              {!isPremium && (
                <Button 
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
                >
                  {isUpgrading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Upgrading...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Upgrade to Premium
                    </div>
                  )}
                </Button>
              )}
              
              {isPremium && (
                <div className="text-center py-3">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <Heart className="w-4 h-4" />
                    <span className="font-medium">Thank you for being a Premium member!</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-blue-900 mb-1">30-Day Money-Back Guarantee</div>
              <div className="text-blue-700">
                Try Premium risk-free. If you're not completely satisfied, we'll refund your payment.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PremiumFeatureGate({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  }) as { data: any };

  const isPremium = user?.subscriptionTier === 'premium' || user?.subscriptionStatus === 'active';

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-dashed border-yellow-300 flex items-center justify-center z-10">
          <div className="text-center p-6">
            <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="font-medium text-gray-900 mb-1">Premium Feature</div>
            <div className="text-sm text-gray-600 mb-3">
              Unlock this feature with Premium
            </div>
            <Button 
              onClick={() => setShowUpgrade(true)}
              size="sm"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
            >
              <Crown className="w-3 h-3 mr-1" />
              Upgrade Now
            </Button>
          </div>
        </div>
        <div className="opacity-20 pointer-events-none">
          {children}
        </div>
      </div>
      
      <SubscriptionManager 
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  );
}