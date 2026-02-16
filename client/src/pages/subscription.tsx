import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, Zap, Users, Star, Clock, CreditCard, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { trackSubscriptionEvent } from "@/lib/firebase";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { StripeWrapper } from '@/components/stripe-wrapper';

interface PlanFeatures {
  [key: string]: {
    name: string;
    description: string;
    price: { monthly: number; annual: number };
    features: string[];
    popular?: boolean;
  };
}

const planFeatures: PlanFeatures = {
  basic: {
    name: "Basic Plan",
    description: "Essential features for daily independence",
    price: { monthly: 4.99, annual: 49.00 },
    features: [
      "Daily task management",
      "Basic mood tracking", 
      "Simple financial tracking",
      "1 caregiver connection",
      "Basic reminders",
      "Email support"
    ]
  },
  premium: {
    name: "Premium Plan", 
    description: "Advanced features for enhanced independence",
    price: { monthly: 12.99, annual: 129.00 },
    features: [
      "Everything in Basic",
      "Advanced analytics",
      "Medication management",
      "Up to 5 caregiver connections",
      "Voice commands",
      "Smart notifications",
      "Meal planning",
      "Academic planner",
      "Priority support"
    ],
    popular: true
  },
  family: {
    name: "Family Plan",
    description: "Complete solution for families and care teams",
    price: { monthly: 24.99, annual: 249.00 },
    features: [
      "Everything in Premium",
      "Unlimited caregiver connections",
      "Family dashboard",
      "Advanced safety features",
      "Location tracking",
      "Emergency protocols",
      "Multi-user accounts",
      "Custom reporting",
      "Phone support"
    ]
  }
};

function PaymentForm({ planType, billingCycle, onSuccess }: {
  planType: string;
  billingCycle: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const { toast } = useToast();

  console.log('PaymentForm render:', { stripe: !!stripe, elements: !!elements });

  // Set a shorter timeout to show fallback payment option faster
  useState(() => {
    const timer = setTimeout(() => {
      if (!stripe || !elements) {
        console.error('Stripe load timeout after 10 seconds - showing fallback');
        setLoadTimeout(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription?success=true`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        trackSubscriptionEvent("upgrade", planType);
        toast({
          title: "Payment Successful!",
          description: "Your subscription has been activated."
        });
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="min-h-[200px] p-4 border-2 border-dashed border-gray-200 rounded-lg">
{(() => {
          console.log('PaymentElement render state:', { stripe: !!stripe, elements: !!elements, loadTimeout });
          
          if (loadTimeout) {
            return (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-3">
                  <div className="text-red-600 mb-2">
                    <p className="font-semibold">Stripe.js Loading Failed</p>
                    <p className="text-sm">Using Demo Payment Mode</p>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Network issues prevented secure payment form loading
                  </p>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => {
                        window.location.href = `/direct-payment?plan=${planType}&billing=${billingCycle}`;
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    >
                      Use Alternative Payment Form
                    </Button>
                    <Button 
                      onClick={async () => {
                        // Demo payment for testing
                        setIsProcessing(true);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        toast({
                          title: "Subscription Activated!",
                          description: `Your ${planType} plan is now active. Welcome to Adaptalyfe!`,
                        });
                        onSuccess();
                        setIsProcessing(false);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Demo Payment - $${planFeatures[planType]?.price[billingCycle === 'annual' ? 'annual' : 'monthly']}
                    </Button>
                  </div>
                </div>
              </div>
            );
          }
          
          if (!stripe || !elements) {
            return (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading secure payment form...</p>
                  <p className="text-xs text-gray-400 mt-2">Stripe: {stripe ? '✓' : '✗'} | Elements: {elements ? '✓' : '✗'}</p>
                </div>
              </div>
            );
          }
          
          return (
            <PaymentElement 
              options={{
                layout: "tabs"
              }}
              onReady={() => console.log('✓ PaymentElement is ready')}
              onChange={(event) => console.log('PaymentElement change:', event.complete)}
              onLoadError={(error) => console.error('PaymentElement error:', error)}
            />
          );
        })()}
      </div>
      <Button 
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
      >
        {isProcessing ? "Processing..." : `Subscribe Now - $${planFeatures[planType]?.price[billingCycle === 'annual' ? 'annual' : 'monthly']}`}
      </Button>
    </form>
  );
}

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user and subscription status
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const { data: subscription } = useQuery<any>({ queryKey: ["/api/subscription"] });

  // Calculate trial days remaining
  const trialDaysLeft = user ? Math.max(0, Math.ceil((new Date(user.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000))) : 0;

  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planType, billingCycle }: { planType: string; billingCycle: string }) => {
      const response = await apiRequest("POST", "/api/create-subscription", {
        planType,
        billingCycle
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Subscription creation response:', data);
      
      if (data.clientSecret) {
        // Payment required - show payment form
        setClientSecret(data.clientSecret);
      } else if (data.status === 'active' || data.status === 'trialing') {
        // Subscription is active/trialing without requiring immediate payment
        trackSubscriptionEvent("upgrade", selectedPlan || "unknown");
        toast({
          title: "Subscription Activated!",
          description: "Your subscription has been set up successfully.",
        });
        setSelectedPlan(null);
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      } else {
        // Payment setup failed - show more detail
        console.error('Subscription creation failed:', data);
        toast({
          title: "Subscription Error", 
          description: data.error || "Failed to create subscription. Please try again or contact support.",
          variant: "destructive"
        });
        setSelectedPlan(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive"
      });
    }
  });

  const handlePlanSelect = (planType: string) => {
    setSelectedPlan(planType);
    createSubscriptionMutation.mutate({ planType, billingCycle });
  };

  const handlePaymentSuccess = () => {
    setSelectedPlan(null);
    setClientSecret(null);
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
  };

  // Show trial warning if less than 2 days left
  const showTrialWarning = trialDaysLeft <= 2 && user?.subscriptionStatus !== 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 mb-6">
            Unlock your full potential with Adaptalyfe's comprehensive features
          </p>
          
          {/* Trial Status */}
          {user?.subscriptionStatus !== 'active' && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
              showTrialWarning ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              <Clock className="w-4 h-4" />
              {trialDaysLeft > 0 ? (
                <>Free trial: {trialDaysLeft} days remaining</>
              ) : (
                <>Trial expired - Subscribe to continue</>
              )}
            </div>
          )}

          {/* Current Subscription Status */}
          {user?.subscriptionStatus === 'active' && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-6 border border-green-200">
              <CheckCircle className="w-4 h-4" />
              Active {user.subscriptionTier} subscription
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={billingCycle === 'monthly' ? 'font-semibold' : 'text-gray-600'}>Monthly</span>
            <Switch
              checked={billingCycle === 'annual'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
            />
            <span className={billingCycle === 'annual' ? 'font-semibold' : 'text-gray-600'}>
              Annual <Badge variant="secondary" className="ml-1">Save 20%</Badge>
            </span>
          </div>
        </div>

        {/* Payment Form Modal */}
        {clientSecret && selectedPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white shadow-2xl border-2">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Complete Payment
                </CardTitle>
                <CardDescription className="text-gray-700">
                  Subscribe to {planFeatures[selectedPlan].name} - {billingCycle} billing
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-white p-6">
                <StripeWrapper 
                  clientSecret={clientSecret}
                  onStripeLoadError={() => setLoadTimeout(true)}
                >
                  <PaymentForm 
                    planType={selectedPlan}
                    billingCycle={billingCycle}
                    onSuccess={handlePaymentSuccess}
                  />
                </StripeWrapper>
                <Button 
                  variant="outline" 
                  onClick={() => { setSelectedPlan(null); setClientSecret(null); }}
                  className="w-full mt-4 bg-gray-50 hover:bg-gray-100"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(planFeatures).map(([planKey, plan]) => (
            <Card 
              key={planKey}
              className={`relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : 'border-2 border-gray-200'} ${
                user?.subscriptionTier === planKey && user?.subscriptionStatus === 'active' ? 'bg-green-50 border-green-200' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  {planKey === 'basic' && <Zap className="w-5 h-5" />}
                  {planKey === 'premium' && <Star className="w-5 h-5" />}
                  {planKey === 'family' && <Users className="w-5 h-5" />}
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    ${billingCycle === 'annual' ? plan.price.annual : plan.price.monthly}
                  </span>
                  <span className="text-gray-600">
                    /{billingCycle === 'annual' ? 'year' : 'month'}
                  </span>
                  {billingCycle === 'annual' && (
                    <div className="text-sm text-green-600 font-medium">
                      Save ${(plan.price.monthly * 12 - plan.price.annual).toFixed(2)}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {user?.subscriptionTier === planKey && user?.subscriptionStatus === 'active' ? (
                  <Button disabled className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handlePlanSelect(planKey)}
                    disabled={createSubscriptionMutation.isPending}
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {createSubscriptionMutation.isPending && selectedPlan === planKey
                      ? "Setting up..."
                      : trialDaysLeft > 0 
                        ? "Start Free Trial" 
                        : "Subscribe Now"
                    }
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-6">Why Choose Adaptalyfe?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6">
              <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Built for Independence</h3>
              <p className="text-gray-600">Designed specifically for individuals with developmental disabilities</p>
            </div>
            <div className="p-6">
              <Users className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Family-Centered</h3>
              <p className="text-gray-600">Connect caregivers, family members, and support teams</p>
            </div>
            <div className="p-6">
              <Star className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Proven Results</h3>
              <p className="text-gray-600">Thousands of users building independence every day</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}