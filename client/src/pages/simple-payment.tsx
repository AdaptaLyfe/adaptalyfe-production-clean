import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface SimplePaymentProps {
  planType: string;
  billingCycle: string;
  amount: string;
  onSuccess?: () => void;
}

export default function SimplePayment({ planType, billingCycle, amount, onSuccess }: SimplePaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Payment Successful!",
        description: `Your ${planType} subscription has been activated.`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
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
              Complete Payment
            </CardTitle>
            <CardDescription className="text-gray-700">
              Subscribe to {planType} Plan - {billingCycle} billing
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">{planType} Plan ({billingCycle})</span>
                <span className="text-2xl font-bold">${amount}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50">
                <div className="text-center">
                  <CreditCard className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>Demo Mode:</strong> This is a demonstration payment interface.
                  </p>
                  <p className="text-xs text-blue-600">
                    In production, this would connect to Stripe's secure payment processing.
                  </p>
                </div>
              </div>

              <Button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg h-12"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Processing Payment...
                  </div>
                ) : (
                  `Subscribe Now - $${amount}`
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Secure payment processing powered by Stripe
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}