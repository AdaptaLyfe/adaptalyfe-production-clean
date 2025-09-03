import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Star, Users, Shield } from "lucide-react";
import PremiumValueProposition from "@/components/premium-value-proposition";
// Note: Simple checkout system, no API requests needed

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { toast } = useToast();
  
  const handleUpgrade = async (planType: string, billingCycle: string) => {
    try {
      setIsUpgrading(true);
      
      // Redirect to simple checkout
      window.location.href = `/checkout?plan=${planType}&billing=${billingCycle}`;
      
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Error", 
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const plans = [
    {
      name: "Basic",
      description: "Essential tools for independent living",
      price: { monthly: 4.99, annual: 49 },
      badge: null,
      features: [
        "Basic daily tasks and mood tracking",
        "Simple financial bill tracking", 
        "Basic appointment scheduling",
        "Emergency contacts access",
        "Up to 2 caregiver connections",
        "Basic mobile app access",
        "Email support"
      ],
      limitations: [
        "Limited to 25 daily tasks",
        "Basic reporting only"
      ],
      cta: "Start Basic Plan",
      popular: false
    },
    {
      name: "Premium", 
      description: "Complete independence toolkit",
      price: { monthly: 12.99, annual: 129 },
      badge: "Most Popular",
      features: [
        "All Basic features included",
        "AI life coach with personalized guidance",
        "Voice commands and text-to-speech accessibility",
        "Smart location-based reminders (GPS alerts)",
        "Offline mode with automatic sync",
        "Advanced analytics and behavioral insights",
        "Visual progress journals with photo documentation",
        "Custom task templates and workflows",
        "Health data integration (Apple Health, Google Fit)",
        "Emergency response protocols and crisis detection",
        "Interactive skill challenges with gamification",
        "Advanced data export for professionals",
        "Personalized video tutorials for life skills",
        "Comprehensive meal planning & shopping",
        "Medication management & pharmacy integration",
        "Academic planning tools for students",
        "Location safety & geofencing",
        "Advanced symptom tracking & medical records",
        "Wearable device integration and health tracking",
        "24/7 priority support with guaranteed response"
      ],
      limitations: [],
      cta: "Start Premium Trial",
      popular: true
    },
    {
      name: "Family/Care Team",
      description: "Multi-user support for families and care teams", 
      price: { monthly: 24.99, annual: 249 },
      badge: "Best Value",
      features: [
        "All premium features included",
        "Support for up to 5 family members/users",
        "Enhanced family dashboard with multi-user insights",
        "Care team collaboration and communication tools",
        "Professional-grade analytics and progress reporting",
        "Custom care plan templates and workflows",
        "Video call integration for virtual support",
        "Secure family data sharing and permissions",
        "Advanced role-based access controls",
        "Professional reporting for healthcare providers",
        "Bulk data export for entire family",
        "Family achievement tracking and milestones",
        "Emergency contact cascading alerts",
        "Dedicated family account manager",
        "Priority phone and email support",
        "HIPAA compliance documentation and audit logs"
      ],
      limitations: [],
      cta: "Start Family Trial",
      popular: false
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    const price = isAnnual ? plan.price.annual : plan.price.monthly;
    const period = isAnnual ? "/year" : "/month";
    return `$${price}${period}`;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.price.monthly === 0) return null;
    const annualMonthly = plan.price.annual / 12;
    const savings = ((plan.price.monthly - annualMonthly) / plan.price.monthly * 100).toFixed(0);
    return `Save ${savings}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Independence Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Start your journey to independence with AdaptaLyfe. From basic life skills to comprehensive family support, we have the right plan for you.
          </p>
          
          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <label 
              htmlFor="billing-toggle"
              className={`text-sm font-medium cursor-pointer ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}
            >
              Monthly
            </label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-blue-600"
              aria-label="Toggle between monthly and annual billing"
            />
            <label 
              htmlFor="billing-toggle"
              className={`text-sm font-medium cursor-pointer ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}
            >
              Annual
            </label>
            {isAnnual && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Save up to 17%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative ${
                plan.popular 
                  ? 'border-blue-500 shadow-lg scale-105 bg-white' 
                  : 'border-gray-200 bg-white/80 backdrop-blur-sm'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className={`
                    ${plan.popular ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}
                    px-3 py-1 text-xs font-medium
                  `}>
                    {plan.popular && <Star className="w-3 h-3 mr-1" />}
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-4">
                  <div className="text-4xl font-bold text-gray-900">
                    {getPrice(plan)}
                  </div>
                  {isAnnual && plan.price.monthly > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      {getSavings(plan)}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                  size="lg"
                  onClick={() => {
                    const planKey = plan.name.toLowerCase().includes('family') ? 'family' : 
                                   plan.name.toLowerCase().includes('premium') ? 'premium' : 'basic';
                    handleUpgrade(planKey, isAnnual ? 'annual' : 'monthly');
                  }}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? "Processing..." : plan.cta}
                </Button>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">What's included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.limitations.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <h5 className="text-xs font-medium text-gray-500 mb-2">Limitations:</h5>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, idx) => (
                          <li key={idx} className="text-xs text-gray-400">
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center mb-12">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <Shield className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">HIPAA Compliant</h3>
              <p className="text-sm text-gray-600">Your medical data is secure and protected</p>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Family Focused</h3>
              <p className="text-sm text-gray-600">Built for individuals and their support networks</p>
            </div>
            <div className="flex flex-col items-center">
              <Star className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Evidence-Based</h3>
              <p className="text-sm text-gray-600">Features designed with disability professionals</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I switch plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial for premium plans?
              </h3>
              <p className="text-gray-600">
                Yes! All premium plans come with a 14-day free trial. No credit card required to start your trial.
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Do you offer discounts for organizations?
              </h3>
              <p className="text-gray-600">
                Yes! We offer special pricing for schools, healthcare organizations, and disability support agencies. Contact us for custom pricing.
              </p>
            </div>
          </div>
        </div>

        {/* Premium Value Proposition Section */}
        <section className="mt-16">
          <PremiumValueProposition userPlan="basic" />
        </section>
      </main>
    </div>
  );
}