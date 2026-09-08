import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Star, X, Zap } from "lucide-react";
import type { User } from "@shared/schema";

export default function SubscriptionBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });
  const { data: subscription } = useQuery<any>({ queryKey: ["/api/subscription"] });

  // Don't show banner if dismissed, user not loaded, user has active subscription, or user is admin
  const isAdmin = user?.accountType === 'admin' || user?.username === 'admin' || user?.name?.toLowerCase().includes('admin');
  if (isDismissed || !user || !subscription || subscription.status === 'active' || isAdmin) {
    return null;
  }

  const trialDaysLeft = subscription.trialDaysLeft || 0;
  const isTrialExpired = trialDaysLeft === 0;
  const isTrialExpiringSoon = trialDaysLeft <= 2 && trialDaysLeft > 0;

  // Only show banner if trial is expiring soon or expired
  if (!isTrialExpired && !isTrialExpiringSoon) {
    return null;
  }

  return (
    <Card className={`mx-4 mb-4 border-2 ${
      isTrialExpired 
        ? 'border-red-300 bg-red-50' 
        : 'border-yellow-300 bg-yellow-50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${
              isTrialExpired ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {isTrialExpired ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-600" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`font-semibold ${
                  isTrialExpired ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {isTrialExpired ? 'Free Trial Expired' : 'Trial Ending Soon'}
                </h3>
                <Badge variant={isTrialExpired ? 'destructive' : 'secondary'}>
                  {isTrialExpired ? 'Action Required' : `${trialDaysLeft} days left`}
                </Badge>
              </div>
              
              <p className={`text-sm mb-3 ${
                isTrialExpired ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {isTrialExpired 
                  ? 'Your free trial has ended. Subscribe now to continue using Adaptalyfe features.'
                  : `Your free trial ends in ${trialDaysLeft} ${trialDaysLeft === 1 ? 'day' : 'days'}. Subscribe now to avoid interruption.`
                }
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Link href="/subscription">
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md border border-white/20"
                  >
                    <Star className="w-4 h-4 mr-1" />
                    View Plans
                  </Button>
                </Link>
                
                {!isTrialExpired && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsDismissed(true)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Remind Me Later
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}