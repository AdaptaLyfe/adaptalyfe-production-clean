import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function DirectPayment() {
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvc: "",
    name: "",
    email: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get plan details from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const planType = urlParams.get('plan') || 'premium';
  const billingCycle = urlParams.get('billing') || 'monthly';
  
  const planFeatures: any = {
    basic: {
      name: "Basic Plan",
      price: { monthly: "4.99", annual: "49.00" }
    },
    premium: {
      name: "Premium Plan",
      price: { monthly: "12.99", annual: "129.00" }
    },
    family: {
      name: "Family Plan", 
      price: { monthly: "24.99", annual: "249.00" }
    }
  };

  const currentPlan = planFeatures[planType];
  const amount = currentPlan?.price[billingCycle] || "19.99";

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      // This simulates the payment processing that would normally happen with Stripe Elements
      const response = await apiRequest("POST", "/api/process-direct-payment", {
        planType,
        billingCycle,
        amount,
        paymentMethod: {
          card: {
            number: paymentData.cardNumber.replace(/\s/g, ''),
            exp_month: paymentData.expiryMonth,
            exp_year: paymentData.expiryYear,
            cvc: paymentData.cvc
          },
          billing_details: {
            name: paymentData.name,
            email: paymentData.email
          }
        }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful!",
        description: `Your ${currentPlan.name} subscription has been activated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      setLocation("/dashboard");
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "Please check your card details and try again.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!paymentData.cardNumber || !paymentData.expiryMonth || !paymentData.expiryYear || !paymentData.cvc || !paymentData.name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all payment details.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Subscription Activated!",
        description: `Your ${currentPlan.name} plan is now active. Welcome to Adaptalyfe!`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link href="/subscription">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plans
            </Button>
          </Link>
        </div>

        <Card className="shadow-2xl border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Secure Payment
            </CardTitle>
            <CardDescription className="text-gray-700">
              Subscribe to {currentPlan?.name} Plan - {billingCycle} billing
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <span className="font-medium">{currentPlan?.name} Plan ({billingCycle})</span>
                <span className="text-2xl font-bold">${amount}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={paymentData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                  maxLength={19}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">Month</Label>
                  <Input
                    id="expiryMonth"
                    placeholder="MM"
                    value={paymentData.expiryMonth}
                    onChange={(e) => handleInputChange('expiryMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryYear">Year</Label>
                  <Input
                    id="expiryYear"
                    placeholder="YY"
                    value={paymentData.expiryYear}
                    onChange={(e) => handleInputChange('expiryYear', e.target.value.replace(/\D/g, '').slice(0, 2))}
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={paymentData.cvc}
                    onChange={(e) => handleInputChange('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Cardholder Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={paymentData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={paymentData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Demo Mode: This is a demonstration payment form</span>
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg h-12"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Processing Payment...
                  </div>
                ) : (
                  `Complete Payment - $${amount}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}