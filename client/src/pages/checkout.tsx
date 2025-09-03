import { useEffect, useState } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, CreditCard, ArrowLeft } from "lucide-react";

// Initialize Stripe safely - only when actually needed
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey).catch((error) => {
  console.warn('Stripe failed to load:', error);
  return null;
}) : Promise.resolve(null);

const CheckoutForm = ({ planDetails }: { planDetails: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    if (!stripe || !elements) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success&plan=${planDetails.planType}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful, upgrade subscription
        try {
          await apiRequest("POST", "/api/upgrade-subscription", {
            planType: planDetails.planType,
            billingCycle: planDetails.billingCycle,
            paymentIntentId: paymentIntent.id
          });
          
          toast({
            title: "Payment Successful!",
            description: `Welcome to AdaptaLyfe ${planDetails.name} plan! Redirecting to dashboard...`,
          });
          
          // Redirect to dashboard after successful upgrade
          setTimeout(() => {
            window.location.href = `/dashboard?payment=success&plan=${planDetails.planType}`;
          }, 1500);
        } catch (upgradeError) {
          toast({
            title: "Payment Processed but Error Upgrading",
            description: "Please contact support for assistance.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Processing Payment",
          description: "Your payment is being processed...",
        });
      }
      
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Order Summary</h3>
        <div className="flex justify-between items-center">
          <span>{planDetails.name} Plan</span>
          <span className="font-bold">{planDetails.price}</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {planDetails.billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly'}
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4">Payment Information</h3>
        <PaymentElement />
      </div>

      <div className="text-center">
        <div className="text-xs text-gray-500 mb-4">
          ✓ 256-bit SSL encryption<br />
          ✓ PCI DSS compliant<br />
          ✓ 30-day money-back guarantee<br />
          ✓ Cancel anytime
        </div>
      </div>

      <Button 
        onClick={handleSubscribe}
        disabled={isProcessing || !stripe}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay {planDetails.price}
          </>
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        Secure payment powered by Stripe. Your payment information is encrypted and secure.
      </div>
    </div>
  );
};

export default function Checkout() {
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  
  useEffect(() => {
    // Get plan details from URL params
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const planType = urlParams.get('plan') || 'premium';
    const billingCycle = urlParams.get('billing') || 'monthly';
    const urlClientSecret = urlParams.get('client_secret') || '';

    const plans = {
      basic: { 
        name: 'Basic', 
        monthly: '$4.99/month', 
        annual: '$49/year',
        features: ['25 daily tasks', '2 caregiver connections', 'Basic support', 'Mood tracking', 'Emergency contacts']
      },
      premium: { 
        name: 'Premium', 
        monthly: '$12.99/month', 
        annual: '$129/year',
        features: ['Everything in Basic', 'Unlimited tasks & caregivers', 'AI life coach', 'Voice commands', 'Advanced analytics', 'Premium support']
      },
      family: { 
        name: 'Family', 
        monthly: '$24.99/month', 
        annual: '$249/year',
        features: ['Everything in Premium', 'Up to 5 family members', 'Family dashboard', 'Care team coordination', 'Dedicated account manager']
      }
    };

    const selectedPlan = plans[planType as keyof typeof plans] || plans.premium;
    const price = selectedPlan[billingCycle as 'monthly' | 'annual'] || selectedPlan.monthly;

    setPlanDetails({
      name: selectedPlan.name,
      price,
      billingCycle,
      features: selectedPlan.features,
      planType,
    });
    
    setClientSecret(urlClientSecret);
  }, []);

  if (!planDetails || !clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Setting up your checkout...</p>
            <p className="text-xs text-gray-500 mt-2">Loading payment information</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Handle Stripe loading errors
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <CreditCard className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment System Unavailable</h2>
            <p className="text-gray-600 mb-4">
              We're experiencing technical difficulties with our payment system. Please try again later or contact support.
            </p>
            <Button onClick={() => window.history.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pricing
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
          <p className="text-gray-600">Secure checkout for AdaptaLyfe {planDetails.name} Plan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                {planDetails.name} Plan Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {planDetails.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Instant access to all plan features</li>
                  <li>• Email confirmation with receipt</li>
                  <li>• Automatic renewal (cancel anytime)</li>
                  <li>• 30-day money-back guarantee</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Secure Checkout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm planDetails={planDetails} />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}