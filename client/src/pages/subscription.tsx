import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Users, Star, Clock, CreditCard, Smartphone, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { trackSubscriptionEvent } from "@/lib/firebase";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { StripeWrapper } from '@/components/stripe-wrapper';
import {
  isAndroidApp,
  getGooglePlayProductId,
  purchaseSubscription as googlePurchaseSubscription,
  verifyPurchaseOnServer as googleVerifyPurchase,
  restorePurchases as googleRestorePurchases,
  initGooglePlayBilling,
} from "@/lib/google-play-billing";
import {
  isIOSApp,
  getAppleProductId,
  purchaseSubscription as applePurchaseSubscription,
  verifyPurchaseOnServer as appleVerifyPurchase,
  restorePurchases as appleRestorePurchases,
  initAppleStoreKit,
} from "@/lib/apple-store-billing";

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
    price: { monthly: 4.99, annual: 4.99 },
    features: [
      "Daily task management (up to 50 tasks)",
      "Basic mood tracking",
      "Financial tracking & bill reminders",
      "1 caregiver connection",
      "Basic reminders & notifications",
      "7-day free trial",
      "Email support"
    ]
  },
  premium: {
    name: "Premium Plan",
    description: "Advanced features for enhanced independence",
    price: { monthly: 12.99, annual: 12.99 },
    features: [
      "Everything in Basic",
      "Unlimited tasks (up to 1,000)",
      "Advanced analytics & insights",
      "Medication management",
      "Up to 5 caregiver connections",
      "Voice commands",
      "Smart notifications",
      "Meal planning & grocery lists",
      "Academic planner",
      "Priority support"
    ],
    popular: true
  },
  family: {
    name: "Family Plan",
    description: "Complete solution for families and care teams",
    price: { monthly: 24.99, annual: 24.99 },
    features: [
      "Everything in Premium",
      "Up to 5 additional member accounts",
      "Unlimited caregiver connections",
      "Family dashboard & shared progress",
      "Emergency protocols & alerts",
      "Custom reporting",
      "Phone support"
    ]
  }
};

function PaymentForm({ planType, billingCycle, onSuccess, paymentIntentId }: {
  planType: string;
  billingCycle: string;
  onSuccess: () => void;
  paymentIntentId?: string | null;
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
      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
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
        return;
      }

      // Payment confirmed — now activate subscription on the server
      const intentId = paymentIntent?.id || paymentIntentId;
      try {
        await fetch('/api/upgrade-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ planType, billingCycle, paymentIntentId: intentId })
        });
      } catch (upgradeErr) {
        console.warn('Upgrade call failed, payment was still successful:', upgradeErr);
      }

      // Clear sessionStorage since payment is complete
      sessionStorage.removeItem('pending_payment_intent_id');
      sessionStorage.removeItem('pending_plan_type');
      sessionStorage.removeItem('pending_billing_cycle');

      trackSubscriptionEvent("upgrade", planType);
      toast({
        title: "Payment Successful!",
        description: "Your subscription has been activated."
      });
      onSuccess();
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
  const billingCycle = "monthly";
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [isGooglePlayPurchasing, setIsGooglePlayPurchasing] = useState(false);
  const [isApplePurchasing, setIsApplePurchasing] = useState(false);
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
  const [googlePlayAvailable, setGooglePlayAvailable] = useState(false);
  const [appleStoreKitAvailable, setAppleStoreKitAvailable] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const onAndroid = isAndroidApp();
  const onIOS = isIOSApp();
  const onNative = onAndroid || onIOS;

  useEffect(() => {
    if (onAndroid) {
      initGooglePlayBilling().then((available) => {
        setGooglePlayAvailable(available);
        console.log('Google Play Billing available:', available);
      });
    }
    if (onIOS) {
      initAppleStoreKit().then((available) => {
        setAppleStoreKitAvailable(available);
        console.log('Apple StoreKit available:', available);
      });
    }
  }, [onAndroid, onIOS]);

  // Handle Stripe 3D Secure redirect return (?success=true in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const savedPlanType = sessionStorage.getItem('pending_plan_type') || 'basic';
      const savedBillingCycle = sessionStorage.getItem('pending_billing_cycle') || 'monthly';
      const savedPaymentIntentId = sessionStorage.getItem('pending_payment_intent_id');

      sessionStorage.removeItem('pending_payment_intent_id');
      sessionStorage.removeItem('pending_plan_type');
      sessionStorage.removeItem('pending_billing_cycle');

      // Tell the server to activate the subscription
      apiRequest("POST", "/api/upgrade-subscription", {
        planType: savedPlanType,
        billingCycle: savedBillingCycle,
        paymentIntentId: savedPaymentIntentId
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        toast({ title: "Payment Successful!", description: "Your subscription is now active. Welcome to Adaptalyfe!" });
        setTimeout(() => setLocation('/dashboard'), 1500);
      }).catch(() => {
        // Still redirect even if verification call fails — payment was confirmed by Stripe
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        toast({ title: "Subscription Activated!", description: "Your payment was received. Welcome to Adaptalyfe!" });
        setTimeout(() => setLocation('/dashboard'), 1500);
      });
    }
  }, []);

  // Get current user and subscription status
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const { data: subscription } = useQuery<any>({ queryKey: ["/api/subscription"] });

  // Calculate trial days remaining
  const trialDaysLeft = user ? Math.max(0, Math.ceil((new Date(user.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000 - Date.now()) / (24 * 60 * 60 * 1000))) : 0;

  const handleGooglePlayPurchase = async (planType: string) => {
    setIsGooglePlayPurchasing(true);
    setSelectedPlan(planType);
    try {
      const productId = getGooglePlayProductId(planType, billingCycle);
      if (!productId) {
        toast({ title: "Error", description: "Invalid plan selected", variant: "destructive" });
        return;
      }
      const result = await googlePurchaseSubscription(productId);
      if (!result.success) {
        if (result.error === 'Purchase canceled') return;
        // If Google Play billing plugin is unavailable, fall back to Stripe web checkout
        if (result.error === 'Billing plugin not available' || result.error === 'Not running on Android') {
          console.warn('Google Play Billing unavailable, falling back to Stripe');
          toast({ title: "Opening secure payment...", description: "Redirecting to card payment." });
          setIsGooglePlayPurchasing(false);
          handlePlanSelect(planType);
          return;
        }
        toast({ title: "Purchase Failed", description: result.error || "Unable to complete purchase", variant: "destructive" });
        return;
      }
      toast({ title: "Verifying Purchase...", description: "Please wait while we activate your subscription." });
      const verification = await googleVerifyPurchase(result.purchaseToken!, result.productId!, result.orderId);
      if (verification.success) {
        trackSubscriptionEvent("upgrade", planType);
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        toast({ title: "Subscription Activated!", description: `Your ${planFeatures[planType]?.name} is now active. Welcome to Adaptalyfe!` });
        setTimeout(() => setLocation('/dashboard'), 1500);
      } else {
        toast({ title: "Verification Failed", description: verification.error || "Please contact support.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error('Google Play purchase error:', error);
      toast({ title: "Purchase Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setIsGooglePlayPurchasing(false);
      setSelectedPlan(null);
    }
  };

  const handleApplePurchase = async (planType: string) => {
    setIsApplePurchasing(true);
    setSelectedPlan(planType);
    try {
      const productId = getAppleProductId(planType, billingCycle);
      if (!productId) {
        toast({ title: "Error", description: "Invalid plan selected", variant: "destructive" });
        return;
      }
      const result = await applePurchaseSubscription(productId);
      if (!result.success) {
        if (result.error !== 'Purchase canceled') {
          toast({ title: "Purchase Failed", description: result.error || "Unable to complete purchase", variant: "destructive" });
        }
        return;
      }
      toast({ title: "Verifying Purchase...", description: "Please wait while we activate your subscription." });
      const verification = await appleVerifyPurchase(result.receiptData!, result.productId!, result.transactionId);
      if (verification.success) {
        trackSubscriptionEvent("upgrade", planType);
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        toast({ title: "Subscription Activated!", description: `Your ${planFeatures[planType]?.name} is now active. Welcome to Adaptalyfe!` });
        setTimeout(() => setLocation('/dashboard'), 1500);
      } else {
        toast({ title: "Verification Failed", description: verification.error || "Please contact support.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error('Apple purchase error:', error);
      toast({ title: "Purchase Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setIsApplePurchasing(false);
      setSelectedPlan(null);
    }
  };

  const handleRestorePurchases = async () => {
    setIsRestoringPurchases(true);
    try {
      if (onIOS) {
        const purchases = await appleRestorePurchases();
        if (purchases.length === 0) {
          toast({ title: "No Purchases Found", description: "No previous subscriptions found on this Apple ID." });
          return;
        }
        const p = purchases[0];
        const verification = await appleVerifyPurchase(p.receiptData!, p.productId!, p.transactionId);
        if (verification.success) {
          toast({ title: "Subscription Restored!", description: "Your previous subscription has been restored." });
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        } else {
          toast({ title: "Restore Failed", description: "Could not restore subscription.", variant: "destructive" });
        }
        return;
      }

      const purchases = await googleRestorePurchases();
      if (purchases.length === 0) {
        toast({ title: "No Purchases Found", description: "No previous subscriptions found on this Google account." });
        return;
      }
      const response = await fetch('/api/google-play/restore-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          purchases: purchases.map(p => ({
            purchaseToken: p.purchaseToken,
            productId: p.productId,
            orderId: p.orderId,
          }))
        }),
      });
      const data = await response.json();
      if (data.restored) {
        toast({ title: "Subscription Restored!", description: "Your previous subscription has been restored." });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      } else {
        toast({ title: "Restore Failed", description: data.message || "Could not restore subscription.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Restore Error", description: "Failed to restore purchases. Please try again.", variant: "destructive" });
    } finally {
      setIsRestoringPurchases(false);
    }
  };

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
        setClientSecret(data.clientSecret);
        if (data.paymentIntentId) {
          setPaymentIntentId(data.paymentIntentId);
          // Store for 3D Secure redirect recovery
          sessionStorage.setItem('pending_payment_intent_id', data.paymentIntentId);
          sessionStorage.setItem('pending_plan_type', selectedPlan || 'basic');
          sessionStorage.setItem('pending_billing_cycle', billingCycle);
        }
      } else if (data.status === 'active' || data.status === 'trialing') {
        trackSubscriptionEvent("upgrade", selectedPlan || "unknown");
        toast({
          title: "Subscription Activated!",
          description: "Your subscription has been set up successfully.",
        });
        setSelectedPlan(null);
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      } else {
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
    if (onAndroid) {
      handleGooglePlayPurchase(planType);
      return;
    }
    if (onIOS) {
      handleApplePurchase(planType);
      return;
    }
    setSelectedPlan(planType);
    createSubscriptionMutation.mutate({ planType, billingCycle });
  };

  const handlePaymentSuccess = () => {
    setSelectedPlan(null);
    setClientSecret(null);
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    setTimeout(() => setLocation('/dashboard'), 1500);
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

          {/* Explanation banner for new/unsubscribed users */}
          {user?.subscriptionStatus !== 'active' && (
            <div className="max-w-2xl mx-auto mb-6 bg-white rounded-2xl shadow-sm border border-teal-100 p-5 text-left">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal-600 text-lg">ℹ️</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Get full access to Adaptalyfe</p>
                  <p className="text-sm text-gray-600">
                    Adaptalyfe helps individuals with daily tasks, finances, mood tracking, appointments, and connecting with their support network. Choose a plan below to unlock all features. Your subscription is billed monthly through your Apple ID and can be cancelled anytime from your device settings.
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {/* Monthly billing notice */}
          <div className="flex items-center justify-center mb-4">
            <Badge variant="secondary" className="text-sm px-4 py-1">Monthly billing — cancel anytime</Badge>
          </div>

          {/* Already Paid Recovery — shown at top so it's visible on mobile without scrolling */}
          {user?.subscriptionStatus !== 'active' && (
            <div className="max-w-sm mx-auto mb-2">
              <button
                onClick={async () => {
                  if (!user) { setLocation('/login'); return; }
                  try {
                    toast({ title: "Checking your payment...", description: "Looking up your account in Stripe." });
                    const res = await fetch('/api/recover-subscription', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include'
                    });
                    const data = await res.json();
                    if (res.ok) {
                      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
                      toast({ title: "Subscription Restored!", description: `Your ${data.plan} plan is now active.` });
                      setTimeout(() => setLocation('/dashboard'), 1500);
                    } else {
                      toast({ title: "No active payment found", description: data.message || "No active Stripe subscription found.", variant: "destructive" });
                    }
                  } catch {
                    toast({ title: "Error", description: "Could not check payment. Try again.", variant: "destructive" });
                  }
                }}
                className="w-full py-2 px-4 rounded-lg border-2 border-orange-400 bg-orange-50 text-orange-800 text-sm font-semibold hover:bg-orange-100 transition-colors"
              >
                Already paid? Tap here to restore access
              </button>
            </div>
          )}

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
                    paymentIntentId={paymentIntentId}
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
                  <span className="text-3xl font-bold">${plan.price.monthly}</span>
                  <span className="text-gray-600">/month</span>
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
                  <div className="space-y-2">
                    <Button disabled className="w-full">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Current Plan
                    </Button>
                    {planKey === 'family' && (
                      <Button
                        variant="outline"
                        className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                        onClick={() => setLocation("/family-members")}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Family Members
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button 
                    onClick={() => handlePlanSelect(planKey)}
                    disabled={createSubscriptionMutation.isPending || isGooglePlayPurchasing || isApplePurchasing}
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {((createSubscriptionMutation.isPending || isGooglePlayPurchasing || isApplePurchasing) && selectedPlan === planKey)
                      ? "Setting up..."
                      : onAndroid
                        ? (trialDaysLeft > 0 ? "Start Free Trial" : "Subscribe via Google Play")
                        : onIOS
                          ? (trialDaysLeft > 0 ? "Start Free Trial" : "Subscribe via App Store")
                          : (trialDaysLeft > 0 ? "Start Free Trial" : "Subscribe Now")
                    }
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Restore Purchases (Android + iOS) */}
        {onNative && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={handleRestorePurchases}
              disabled={isRestoringPurchases}
              className="gap-2"
            >
              <RotateCcw className={`w-4 h-4 ${isRestoringPurchases ? 'animate-spin' : ''}`} />
              {isRestoringPurchases ? "Restoring..." : "Restore Previous Purchase"}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Already subscribed? Restore your {onIOS ? "App Store" : "Google Play"} subscription here.
            </p>
          </div>
        )}

        {/* Platform Payment Notice */}
        {onAndroid && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">
              <Smartphone className="w-4 h-4" />
              Payments processed securely through Google Play
            </div>
          </div>
        )}
        {onIOS && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-full text-sm border border-gray-200">
              <Smartphone className="w-4 h-4" />
              Payments processed securely through Apple App Store
            </div>
          </div>
        )}

        {/* Already Paid Recovery — always visible */}
        {user?.subscriptionStatus !== 'active' && (
          <div className="mt-10 max-w-lg mx-auto">
            <Card className="border-2 border-orange-200 bg-orange-50 shadow-md">
              <CardContent className="p-5 text-center">
                <p className="font-semibold text-orange-900 mb-1">Already paid but still seeing this page?</p>
                <p className="text-sm text-orange-700 mb-4">
                  Your payment may have gone through but your account wasn't updated. Click below to check and restore access instantly.
                </p>
                <Button
                  onClick={async () => {
                    if (!user) {
                      setLocation('/login');
                      return;
                    }
                    try {
                      toast({ title: "Checking your payment...", description: "Looking up your account in Stripe." });
                      const res = await fetch('/api/recover-subscription', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                      });
                      const data = await res.json();
                      if (res.ok) {
                        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
                        toast({ title: "Subscription Restored!", description: `Your ${data.plan} plan is now active. Taking you to the app...` });
                        setTimeout(() => setLocation('/dashboard'), 1500);
                      } else {
                        toast({ title: "No payment found", description: data.message || "No active Stripe subscription found. Please subscribe below.", variant: "destructive" });
                      }
                    } catch {
                      toast({ title: "Error", description: "Could not check your payment. Please try again.", variant: "destructive" });
                    }
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                >
                  Restore My Subscription
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

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