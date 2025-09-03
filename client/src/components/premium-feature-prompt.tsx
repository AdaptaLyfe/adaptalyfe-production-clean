import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Star, Zap, Crown } from "lucide-react";
import { Link } from "wouter";

interface PremiumFeaturePromptProps {
  title: string;
  description: string;
  feature: string;
  requiredPlan: 'premium' | 'family';
  className?: string;
}

export default function PremiumFeaturePrompt({ 
  title, 
  description, 
  feature, 
  requiredPlan,
  className = "" 
}: PremiumFeaturePromptProps) {
  const planColors = {
    premium: "from-purple-600 to-pink-600",
    family: "from-blue-600 to-purple-600"
  };

  const planIcons = {
    premium: Star,
    family: Crown
  };

  const PlanIcon = planIcons[requiredPlan];

  return (
    <Card className={`border-2 border-dashed border-gray-300 bg-gray-50 ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-gray-500" />
        </div>
        <CardTitle className="text-lg text-gray-700">
          {title}
        </CardTitle>
        <Badge 
          variant="secondary" 
          className={`bg-gradient-to-r ${planColors[requiredPlan]} text-white`}
        >
          <PlanIcon className="w-3 h-3 mr-1" />
          {requiredPlan === 'premium' ? 'Premium' : 'Family'} Feature
        </Badge>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600 text-sm">
          {description}
        </p>
        <div className="space-y-2">
          <Link href="/subscription">
            <Button 
              className={`w-full bg-gradient-to-r ${planColors[requiredPlan]} hover:opacity-90 text-white`}
            >
              <Zap className="w-4 h-4 mr-2" />
              Upgrade to {requiredPlan === 'premium' ? 'Premium' : 'Family'}
            </Button>
          </Link>
          <p className="text-xs text-gray-500">
            Start with a 7-day free trial
          </p>
        </div>
      </CardContent>
    </Card>
  );
}