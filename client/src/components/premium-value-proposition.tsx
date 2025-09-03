import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Shield, Users, BarChart3, Clock, Star, Heart, Zap } from "lucide-react";

interface PremiumValueProps {
  userPlan: 'basic' | 'premium' | 'family';
}

export default function PremiumValueProposition({ userPlan }: PremiumValueProps) {
  const isPremium = userPlan === 'premium' || userPlan === 'family';
  const isFamily = userPlan === 'family';

  const valuePropositions = [
    {
      category: "AI-Powered Independence",
      icon: Brain,
      color: "bg-purple-100 text-purple-600",
      features: [
        {
          name: "Intelligent Life Coach",
          description: "AI analyzes your progress and provides personalized guidance for daily challenges",
          savings: "Replaces $80/hour life coaching sessions"
        },
        {
          name: "Predictive Reminders",
          description: "Smart scheduling based on your patterns and preferences",
          savings: "Prevents missed medications and appointments"
        },
        {
          name: "Behavioral Pattern Analysis",
          description: "Identifies trends in mood, productivity, and health metrics",
          savings: "Professional behavior analysis worth $150/session"
        }
      ]
    },
    {
      category: "Professional Healthcare Integration",
      icon: Heart,
      color: "bg-red-100 text-red-600",
      features: [
        {
          name: "Medical Record Management",
          description: "Comprehensive health tracking with professional-grade reports",
          savings: "Eliminates $50/month medical record services"
        },
        {
          name: "Provider Communication Tools",
          description: "Secure sharing with doctors, therapists, and specialists",
          savings: "Streamlines $200+ annual coordination costs"
        },
        {
          name: "Medication Adherence Tracking",
          description: "Pharmacy integration with refill reminders and interaction alerts",
          savings: "Prevents $1,000+ medication errors annually"
        }
      ]
    },
    {
      category: "Advanced Safety & Security",
      icon: Shield,
      color: "bg-green-100 text-green-600",
      features: [
        {
          name: "Emergency Response System",
          description: "Automated crisis detection with caregiver alerts",
          savings: "Peace of mind worth $100+/month"
        },
        {
          name: "Location Safety Monitoring",
          description: "GPS geofencing with smart notifications",
          savings: "Replaces $50/month safety monitoring services"
        },
        {
          name: "HIPAA-Compliant Data Protection",
          description: "Enterprise-grade security for sensitive health information",
          savings: "Professional data protection worth $200+/year"
        }
      ]
    },
    {
      category: "Family Care Coordination",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      features: [
        {
          name: "Multi-User Care Dashboard",
          description: "Real-time progress sharing with family and caregivers",
          savings: "Eliminates weekly coordination calls"
        },
        {
          name: "Professional Reporting",
          description: "Automated progress reports for healthcare providers",
          savings: "Saves 5+ hours monthly on documentation"
        },
        {
          name: "Crisis Communication Network",
          description: "Instant alerts to entire care team during emergencies",
          savings: "Invaluable during critical situations"
        }
      ]
    }
  ];

  const costComparison = {
    traditional: [
      { service: "Life Coach (2 sessions/month)", cost: 160 },
      { service: "Medication Management Service", cost: 50 },
      { service: "Safety Monitoring", cost: 50 },
      { service: "Medical Record Management", cost: 50 },
      { service: "Care Coordination Tools", cost: 40 }
    ],
    skillbridge: userPlan === 'family' ? 24.99 : 12.99,
    savings: userPlan === 'family' ? 325.01 : 337.01
  };

  return (
    <div className="space-y-8">
      {/* Value Proposition Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Why AdaptaLyfe Premium Delivers Exceptional Value
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Our premium features replace multiple expensive services with one comprehensive platform, 
          delivering professional-grade independence support at a fraction of traditional costs.
        </p>
      </div>

      {/* Cost Comparison */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            Monthly Cost Comparison
          </CardTitle>
          <CardDescription>
            See how SkillBridge Premium compares to traditional services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Traditional Services</h4>
              <div className="space-y-2">
                {costComparison.traditional.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.service}</span>
                    <span className="font-medium">${item.cost}/month</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total Traditional Cost</span>
                  <span className="text-red-600">
                    ${costComparison.traditional.reduce((sum, item) => sum + item.cost, 0)}/month
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">SkillBridge {userPlan === 'family' ? 'Family' : 'Premium'}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">All premium features included</span>
                  <span className="font-medium">${costComparison.skillbridge}/month</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Your Monthly Savings</span>
                  <span className="text-green-600">
                    ${costComparison.savings}/month
                  </span>
                </div>
                <div className="bg-green-100 p-3 rounded-lg mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      ${(costComparison.savings * 12).toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">Annual Savings</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Categories */}
      <div className="grid gap-6">
        {valuePropositions.map((category, index) => (
          <Card key={index} className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${category.color}`}>
                  <category.icon className="h-6 w-6" />
                </div>
                {category.category}
                {!isPremium && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    Premium Feature
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {category.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="border-l-2 border-gray-200 pl-4">
                    <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                    <p className="text-sm text-gray-600 mb-1">{feature.description}</p>
                    <p className="text-xs text-green-600 font-medium">💰 {feature.savings}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ROI Calculator */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            Your Return on Investment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((costComparison.savings / costComparison.skillbridge) * 100)}%
              </div>
              <div className="text-sm text-gray-600">ROI Per Month</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(costComparison.savings / costComparison.skillbridge)}:1
              </div>
              <div className="text-sm text-gray-600">Value Multiplier</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(30 / costComparison.skillbridge)}
              </div>
              <div className="text-sm text-gray-600">Days to Break Even</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!isPremium && (
        <div className="text-center p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
          <h3 className="text-xl font-bold text-purple-900 mb-2">
            Ready to unlock these premium features?
          </h3>
          <p className="text-purple-700 mb-4">
            Join thousands of families already saving money while building independence.
          </p>
          <div className="flex justify-center gap-4">
            <Badge className="bg-purple-600 text-white px-4 py-2">
              14-Day Free Trial
            </Badge>
            <Badge variant="outline" className="border-purple-300 text-purple-700 px-4 py-2">
              Cancel Anytime
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}