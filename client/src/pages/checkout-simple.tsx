import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Shield, ArrowLeft, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function CheckoutSimple() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Get plan details from URL with null safety
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const planType = urlParams.get('plan') || 'basic';
  const billingCycle = urlParams.get('billing') || 'monthly';
  
  const planDetails = {
    basic: {
      name: 'Basic Plan',
      price: billingCycle === 'annual' ? 49.00 : 4.99,
      features: ['25 daily tasks', '2 caregivers', 'Basic support']
    },
    premium: {
      name: 'Premium Plan', 
      price: billingCycle === 'annual' ? 129.00 : 12.99,
      features: ['Unlimited tasks', 'AI support', 'Advanced features']
    },
    family: {
      name: 'Family/Care Team Plan',
      price: billingCycle === 'annual' ? 249.00 : 24.99,
      features: ['5 users', 'All premium features', 'Priority support']
    }
  };

  const currentPlan = planDetails[planType as keyof typeof planDetails] || planDetails.basic;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user subscription
      await apiRequest("POST", "/api/upgrade-subscription", {
        planType,
        billingCycle,
        paymentMethod: 'credit_card'
      });

      setPaymentComplete(true);
      
      toast({
        title: "Payment Successful!",
        description: `Welcome to ${currentPlan.name}! Your subscription is now active.`,
      });

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your {currentPlan.name} subscription is now active.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting you to your dashboard...
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/pricing')}
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pricing
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">{currentPlan.name}</span>
                  <span className="font-bold">${currentPlan.price}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Billed {billingCycle}
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Included Features:</h4>
                  <ul className="space-y-1">
                    {currentPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" required />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" required />
                </div>

                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                      const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                      e.target.value = formattedValue;
                    }}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      maxLength={5}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          e.target.value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        } else {
                          e.target.value = value;
                        }
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      maxLength={3}
                      onChange={(e) => {
                        e.target.value = e.target.value.replace(/\D/g, '');
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay ${currentPlan.price}
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center text-sm text-gray-500 pt-4">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Your payment information is secure and encrypted
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}