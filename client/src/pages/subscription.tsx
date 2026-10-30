import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Users, Star, Clock, CreditCard, Smartphone, RotateCcw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { trackSubscriptionEvent } from "@/lib/firebase";
import { FREE_TRIAL_DAYS } from "@shared/subscription";
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
    price: { monthly: 4.99, annual: 49.99 },
    features: [
      "Daily task management (up to 50 tasks)",
      "Basic mood tracking",
      "Financial tracking & bill reminders",
      "1 caregiver connection",
      "Basic reminders & notifications",
      `${FREE_TRIAL_DAYS}-day free trial`,
      "Email support"
    ]
  },
  premium: {
    name: "Premium Plan",
    description: "Advanced features for enhanced independence",
    price: { monthly: 12.99, annual: 129.99 },
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
    price: { monthly: 24.99, annual: 249.99 },
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

function isNoSubscriptionError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === "NO_SUBSCRIPTION";
}

function PaymentForm({ planType, billingCycle, subscriptionId, intentType, trialEnd, onSuccess }: {
  planType: string;
  billingCycle: string;
  subscriptionId: string;
  intentType: "payment" | "setup";
  /** Unix seconds when the free trial ends (first charge), or null when charged now. */
  trialEnd: number | null;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  // Keep the last payment error visible inside the form (toasts disappear after a few seconds).
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();
  const isTrial = intentType === "setup";
  const planPrice = planFeatures[planType]?.price[billingCycle === 'annual' ? 'annual' : 'monthly'];
  const periodLabel = billingCycle === 'annual' ? 'year' : 'month';
  const firstChargeDate = trialEnd
    ? new Date(trialEnd * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : null;

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
    setFormError(null);

    try {
      // Preserve only the subscription ID for an off-site 3DS return. On the
      // return page, the server retrieves and verifies this subscription.
      sessionStorage.setItem("pending_stripe_subscription_id", subscriptionId);
      const confirmParams = {
        return_url: `${window.location.origin}/subscription?success=true`,
      };
      const result = intentType === "setup"
        ? await stripe.confirmSetup({ elements, confirmParams, redirect: "if_required" })
        : await stripe.confirmPayment({ elements, confirmParams, redirect: "if_required" });

      if (result.error) {
        setFormError(
          result.error.message ||
            (intentType === "setup" ? "We couldn't verify this card. Please try another card." : "Your payment didn't go through. Please try another card."),
        );
        toast({
          title: intentType === "setup" ? "Could not proceed with payment method" : "Payment Failed",
          description: result.error.message,
          variant: "destructive"
        });
        return;
      }

      const completedIntent = intentType === "setup"
        ? result.setupIntent
        : result.paymentIntent;
      if (!completedIntent || completedIntent.status !== "succeeded") {
        setFormError("Your payment method is still being confirmed. Please try again shortly.");
        toast({
          title: "Payment confirmation pending",
          description: "Your payment method is still being confirmed. Please try again shortly.",
          variant: "destructive",
        });
        return;
      }

      // The server retrieves the Stripe subscription and verifies that its
      // metadata/customer belong to this signed-in user before granting access.
      const confirmationResponse = await apiRequest('POST', '/api/confirm-subscription', {
        subscriptionId,
      });
      const confirmation = await confirmationResponse.json();
      if (!confirmation.success) {
        throw new Error(confirmation.message || "Subscription has not been activated yet");
      }

      trackSubscriptionEvent("upgrade", planType);
      sessionStorage.removeItem("pending_stripe_subscription_id");
      toast({
        title: intentType === "setup" ? "Payment details saved!" : "Payment Successful!",
        description: "Your recurring subscription has been activated."
      });
      onSuccess();
    } catch (err) {
      setFormError("Something went wrong while activating your plan. Please try again.");
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
      <div className="min-h-[200px] p-4 border border-slate-200 rounded-xl bg-slate-50/40">
{(() => {
          console.log('PaymentElement render state:', { stripe: !!stripe, elements: !!elements, loadTimeout });
          
          if (loadTimeout) {
            return (
              <div className="flex items-center justify-center h-32 text-center">
                <div>
                  <p className="font-semibold text-red-600">Secure payment form unavailable</p>
                  <p className="text-sm text-gray-500 mt-1">Refresh the page and try again. Your plan has not been activated.</p>
                </div>
              </div>
            );
          }
          
          if (!stripe || !elements) {
            return (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
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
              onChange={(event) => {
                console.log('PaymentElement change:', event.complete);
                // Stripe fires a change right after a decline; only clear the
                // message once the user has entered a complete new card.
                if (formError && event.complete) setFormError(null);
              }}
              onLoadError={(error) => console.error('PaymentElement error:', error)}
            />
          );
        })()}
      </div>
      {formError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">Payment not completed</p>
          <p className="mt-0.5">{formError}</p>
        </div>
      )}
      <div className="space-y-2">
        <Button 
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="w-full h-12 rounded-xl text-base font-semibold border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:brightness-110"
        >
          {isProcessing
            ? "Processing..."
            : isTrial
              ? "Start free trial"
              : `Subscribe Now - $${planPrice}`}
        </Button>
        {isTrial ? (
          <p className="text-center text-sm text-gray-500">
            No charge today. Your free trial ends{firstChargeDate ? <> on <span className="font-medium text-gray-700">{firstChargeDate}</span></> : null}, then ${planPrice}/{periodLabel}. Cancel anytime before then.
          </p>
        ) : (
          <p className="text-center text-sm text-gray-500">
            You'll be charged ${planPrice} today, then every {periodLabel}. Your free trial has already been used. Cancel anytime.
          </p>
        )}
      </div>
    </form>
  );
}

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  // Plan chosen on the landing page / sign-up (?plan=premium) — highlighted below.
  const [requestedPlan] = useState<string | null>(() => {
    try {
      const plan = new URLSearchParams(window.location.search).get("plan");
      return plan === "basic" || plan === "premium" || plan === "family" ? plan : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (!requestedPlan) return;
    const timer = setTimeout(() => {
      document.getElementById(`plan-${requestedPlan}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
    return () => clearTimeout(timer);
  }, [requestedPlan]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentType, setIntentType] = useState<"payment" | "setup">("payment");
  const [trialEndAt, setTrialEndAt] = useState<number | null>(null);
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<string | null>(null);
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
    const requestedCycle = new URLSearchParams(window.location.search).get("billingCycle");
    if (onAndroid) {
      setBillingCycle("monthly");
    } else if (requestedCycle === "annual" || requestedCycle === "monthly") {
      setBillingCycle(requestedCycle);
    }
  }, [onAndroid]);

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
      const subscriptionId = sessionStorage.getItem('pending_stripe_subscription_id');
      if (!subscriptionId) {
        toast({
          title: "Subscription confirmation required",
          description: "We could not identify your pending subscription. Please use the restore access button.",
          variant: "destructive",
        });
        return;
      }

      apiRequest("POST", "/api/confirm-subscription", { subscriptionId }).then(async (response) => {
        const confirmation = await response.json();
        if (!confirmation.success) {
          throw new Error(confirmation.message || "Subscription was not activated");
        }
        sessionStorage.removeItem('pending_stripe_subscription_id');
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
        toast({ title: "Payment Successful!", description: "Your subscription is now active. Welcome to Adaptalyfe!" });
        setTimeout(() => setLocation('/dashboard'), 1500);
      }).catch(() => {
        toast({
          title: "Subscription confirmation incomplete",
          description: "Your payment was not activated. Use the restore access button after the page reloads.",
          variant: "destructive",
        });
      });
    }
  }, []);

  // Get current user and subscription status
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const { data: subscription } = useQuery<any>({ queryKey: ["/api/subscription"] });
  const hasActiveSubscription = user?.subscriptionStatus === 'active';
  const activeSubscriptionLabel = user?.subscriptionPlatform === 'web'
    ? 'website'
    : user?.subscriptionPlatform === 'google_play'
      ? 'Google Play'
      : user?.subscriptionPlatform === 'app_store'
        ? 'Apple App Store'
        : 'another platform';

  // Calculate trial days remaining
  // The server computes this from the stored sign-up time; computing it in the
  // browser misread that time across time zones (showed 8 days for a 7-day trial).
  const trialDaysLeft = subscription
    ? Math.min(FREE_TRIAL_DAYS, Math.max(0, Number(subscription.trialDaysLeft) || 0))
    : 0;

  const handleGooglePlayPurchase = async (planType: string) => {
    if (hasActiveSubscription) {
      toast({
        title: "Subscription already active",
        description: `Your subscription is already active and managed through ${activeSubscriptionLabel}.`,
      });
      return;
    }
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
    if (hasActiveSubscription) {
      toast({
        title: "Subscription already active",
        description: `Your subscription is already active and managed through ${activeSubscriptionLabel}.`,
      });
      return;
    }
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
      const response = await apiRequest('POST', '/api/google-play/restore-purchases', {
        purchases: purchases.map(p => ({
          purchaseToken: p.purchaseToken,
          productId: p.productId,
          orderId: p.orderId,
        }))
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
        setIntentType(data.intentType === "setup" ? "setup" : "payment");
        setTrialEndAt(typeof data.trialEnd === "number" ? data.trialEnd : null);
        setStripeSubscriptionId(data.subscriptionId);
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
    if (hasActiveSubscription && user?.subscriptionPlatform !== 'web') {
      toast({
        title: "Subscription already active",
        description: `Your subscription is already active and managed through ${activeSubscriptionLabel}.`,
      });
      return;
    }
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
    setStripeSubscriptionId(null);
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    setTimeout(() => setLocation('/dashboard'), 1500);
  };

  // Show trial warning if less than 2 days left
  const showTrialWarning = trialDaysLeft <= 2 && user?.subscriptionStatus !== 'active';

  return (
    <div className="min-h-screen bg-[radial-gradient(60%_40%_at_50%_0%,rgba(224,231,255,0.9),transparent_75%),linear-gradient(180deg,#eef3ff_0%,#f7f8fe_40%,#f7f8fe_100%)] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            {user?.subscriptionStatus === 'active' ? 'Manage Your Subscription' : 'Choose Your Plan'}
          </h1>
          <p className="text-base sm:text-lg text-slate-500 mb-6">
            {user?.subscriptionStatus === 'active'
              ? `You're subscribed to the ${user?.subscriptionTier ? user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1) : ''} Plan. You can change plans below or return to your dashboard.`
              : "Unlock your full potential with Adaptalyfe's comprehensive features"}
          </p>
          {user?.subscriptionStatus === 'active' && (
            <Button
              onClick={() => setLocation('/dashboard')}
              className="mb-6 h-11 rounded-xl px-6 font-semibold border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:brightness-110"
              size="lg"
            >
              Go to Dashboard
            </Button>
          )}

          {/* Explanation banner for new/unsubscribed users */}
          {user?.subscriptionStatus !== 'active' && (
            <div className="max-w-2xl mx-auto mb-6 bg-white rounded-2xl shadow-sm border border-indigo-100 p-5 text-left">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1">Get full access to Adaptalyfe</p>
                  <p className="text-sm text-gray-600">
                    Adaptalyfe helps individuals with daily tasks, finances, mood tracking, appointments, and connecting with their support network. Choose a plan below to unlock all features.{" "}
                    {onIOS
                      ? `Your ${billingCycle} subscription is billed through your Apple ID and managed in your Apple account settings.`
                      : onAndroid
                        ? "Your monthly subscription is billed through Google Play and managed in your Google Play account."
                        : `Your ${billingCycle} subscription is billed by Stripe and renews automatically at the selected interval.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trial Status */}
          {user?.subscriptionStatus !== 'active' && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
              showTrialWarning ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-violet-50 text-violet-700 border border-violet-200'
            }`}>
              <Clock className="w-4 h-4" />
              {trialDaysLeft > 0 ? (
                <>Free trial: {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining</>
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

          {!onAndroid && (
            <div className="flex justify-center mb-4" role="group" aria-label="Billing period">
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
                <button
                  type="button"
                  aria-pressed={billingCycle === "monthly"}
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                    billingCycle === "monthly"
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  aria-pressed={billingCycle === "annual"}
                  onClick={() => setBillingCycle("annual")}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                    billingCycle === "annual"
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Yearly
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${billingCycle === "annual" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                    Save 17%
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Billing notice */}
          <div className="flex items-center justify-center mb-4">
            <Badge variant="secondary" className="rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
              {billingCycle === "annual" ? "Annual" : "Monthly"} Subscription — auto-renewable, cancel anytime
            </Badge>
          </div>

          {/* Premium feature notice — required by Apple Guideline 2.3.2 */}
          <div className="max-w-2xl mx-auto mb-4 px-4">
            <p className="text-sm text-slate-500">
              Some features require an active subscription. All plans are auto-renewing {billingCycle === "annual" ? "annual" : "monthly"} subscriptions.
            </p>
          </div>

          {/* Already Paid Recovery — shown at top so it's visible on mobile without scrolling */}
          {user?.subscriptionStatus !== 'active' && (
            <div className="max-w-sm mx-auto mb-2">
              <button
                onClick={async () => {
                  if (!user) { setLocation('/login'); return; }
                  try {
                    toast({ title: "Checking your payment...", description: "Looking up your account in Stripe." });
                    const res = await apiRequest('POST', '/api/recover-subscription');
                    const data = await res.json();
                    if (res.ok) {
                      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
                      toast({ title: "Subscription Restored!", description: `Your ${data.plan} plan is now active.` });
                      setTimeout(() => setLocation('/dashboard'), 1500);
                    } else {
                      toast({ title: "No active payment found", description: data.message || "No active Stripe subscription found.", variant: "destructive" });
                    }
                   } catch (error) {
                     if (isNoSubscriptionError(error)) {
                       toast({
                         title: "No active payment found",
                         description: "No active Stripe subscription found.",
                         variant: "destructive",
                       });
                     } else {
                       toast({ title: "Error", description: "Could not check payment. Try again.", variant: "destructive" });
                     }
                  }
                }}
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                Already paid? Tap here to restore access
              </button>
            </div>
          )}

        </div>

        {/* Payment Form Modal */}
        {clientSecret && selectedPlan && stripeSubscriptionId && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
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
                    subscriptionId={stripeSubscriptionId}
                    intentType={intentType}
                    trialEnd={trialEndAt}
                    onSuccess={handlePaymentSuccess}
                  />
                </StripeWrapper>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedPlan(null);
                    setClientSecret(null);
                    setStripeSubscriptionId(null);
                  }}
                  className="w-full mt-3 h-11 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
              id={`plan-${planKey}`}
              className={`relative rounded-3xl bg-white transition-shadow ${
                requestedPlan === planKey
                  ? 'border-2 border-violet-400 shadow-[0_22px_48px_-20px_rgba(109,40,217,0.45)] md:scale-[1.03]'
                  : plan.popular && !requestedPlan
                    ? 'border-2 border-indigo-200 shadow-[0_18px_40px_-20px_rgba(79,70,229,0.35)] md:scale-[1.03]'
                    : 'border border-slate-200 shadow-sm hover:shadow-md'
              } ${
                user?.subscriptionTier === planKey && user?.subscriptionStatus === 'active' ? 'bg-violet-50/60 border-violet-300' : ''
              }`}
            >
              {requestedPlan === planKey ? (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="whitespace-nowrap rounded-full border-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1 text-white shadow-sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Your selection
                  </Badge>
                </div>
              ) : plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="rounded-full border-0 bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-white shadow-sm">
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
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">${plan.price[billingCycle]}</span>
                  <span className="text-slate-500">/{billingCycle === "annual" ? "year" : "month"}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {hasActiveSubscription ? (
                  <div className="space-y-2">
                    <Button disabled className="w-full h-11 rounded-xl">
                      {user?.subscriptionTier === planKey ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Current Plan
                        </>
                      ) : (
                        "Subscription Already Active"
                      )}
                    </Button>
                    {planKey === 'family' && user?.subscriptionTier === planKey && (
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
                    className={`w-full h-11 rounded-xl font-semibold ${
                      requestedPlan === planKey || (plan.popular && !requestedPlan)
                        ? 'border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:brightness-110'
                        : 'border-2 border-indigo-200 bg-white text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                    variant={requestedPlan === planKey || (plan.popular && !requestedPlan) ? "default" : "outline"}
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
        {onNative && !hasActiveSubscription && (
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
        {onAndroid && hasActiveSubscription && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">
              <Smartphone className="w-4 h-4" />
              Your {activeSubscriptionLabel} subscription works in this app
            </div>
          </div>
        )}
        {onIOS && hasActiveSubscription && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">
              <Smartphone className="w-4 h-4" />
              Your {activeSubscriptionLabel} subscription works in this app
            </div>
          </div>
        )}
        {onAndroid && !hasActiveSubscription && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">
              <Smartphone className="w-4 h-4" />
              Payments processed securely through Google Play
            </div>
          </div>
        )}
        {onIOS && !hasActiveSubscription && (
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
            <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5 text-center">
                <p className="font-semibold text-slate-900 mb-1">Already paid but still seeing this page?</p>
                <p className="text-sm text-slate-500 mb-4">
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
                      const res = await apiRequest('POST', '/api/recover-subscription');
                      const data = await res.json();
                      if (res.ok) {
                        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
                        toast({ title: "Subscription Restored!", description: `Your ${data.plan} plan is now active. Taking you to the app...` });
                        setTimeout(() => setLocation('/dashboard'), 1500);
                      } else {
                        toast({ title: "No payment found", description: data.message || "No active Stripe subscription found. Please subscribe below.", variant: "destructive" });
                      }
                   } catch (error) {
                     if (isNoSubscriptionError(error)) {
                       toast({
                         title: "No payment found",
                         description: "No active Stripe subscription found. Please subscribe below.",
                         variant: "destructive",
                       });
                     } else {
                       toast({ title: "Error", description: "Could not check your payment. Please try again.", variant: "destructive" });
                     }
                    }
                  }}
                  className="w-full h-11 rounded-xl font-semibold border-2 border-indigo-200 bg-white text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"
                  variant="outline"
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

        {/* Platform-specific subscription terms and renewal disclosure */}
        <div className="mt-12 max-w-3xl mx-auto p-6 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 leading-relaxed">
          <h3 className="font-semibold text-gray-900 mb-3">Subscription Terms</h3>
          <ul className="space-y-2 list-disc pl-5 mb-4">
            <li><strong>Basic Plan:</strong> ${planFeatures.basic.price[billingCycle]} per {billingCycle === "annual" ? "year" : "month"} (auto-renewable)</li>
            <li><strong>Premium Plan:</strong> ${planFeatures.premium.price[billingCycle]} per {billingCycle === "annual" ? "year" : "month"} (auto-renewable)</li>
            <li><strong>Family / Care Team Plan:</strong> ${planFeatures.family.price[billingCycle]} per {billingCycle === "annual" ? "year" : "month"} (auto-renewable)</li>
          </ul>
          <p className="mb-2">
            {onIOS
              ? "Payment will be charged to your Apple ID account at confirmation of purchase."
              : onAndroid
                ? "Payment will be charged through your Google Play account at confirmation of purchase."
                : "Stripe will charge your selected payment method for the plan and billing interval shown above."}
          </p>
          <p className="mb-2">
            Subscriptions automatically renew at the end of each {billingCycle === "annual" ? "yearly" : "monthly"} billing period unless cancelled before renewal.
          </p>
          <p className="mb-2">
            The renewal charge will be the listed {billingCycle === "annual" ? "annual" : "monthly"} price for your plan.
          </p>
          <p className="mb-4">
            {onIOS
              ? "You can manage or cancel your subscription in your Apple account subscription settings."
              : onAndroid
                ? "You can manage or cancel your subscription in your Google Play subscriptions settings."
                : "For Stripe subscriptions, contact Adaptalyfe support to manage or cancel before the next renewal."}
          </p>
          <div className="flex flex-wrap gap-4 pt-3 border-t border-gray-300">
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
              data-testid="link-privacy-policy"
            >
              Privacy Policy
            </a>
            {onIOS ? (
              <a
                href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
                data-testid="link-terms-of-use"
              >
                Terms of Use (EULA)
              </a>
            ) : (
              <a href="/terms" className="text-blue-600 hover:underline font-medium" data-testid="link-terms-of-use">
                Terms of Service
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}