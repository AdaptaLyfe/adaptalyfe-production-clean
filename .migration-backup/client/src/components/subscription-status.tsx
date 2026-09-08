import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, CheckCircle, AlertTriangle, CreditCard } from "lucide-react";
import { Link } from "wouter";

interface SubscriptionData {
  planType: string;
  status: string;
  billingCycle: string;
  trialDaysLeft?: number;
  usageStats: {
    tasks: { count: number; limit: number | null };
    caregivers: { count: number; limit: number | null };
    dataExports: { count: number; limit: number | null };
  };
  features: {
    wearableDevices: boolean;
    mealPlanning: boolean;
    medicationManagement: boolean;
    locationSafety: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
  };
}

export function SubscriptionStatus() {
  const { data: subscription, isLoading } = useQuery<SubscriptionData>({
    queryKey: ["/api/subscription"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) return null;

  const getPlanDisplayName = (planType: string) => {
    switch (planType) {
      case "free": return "Free Plan";
      case "premium": return "Premium Plan";
      case "family": return "Family Plan";
      default: return planType;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case "free": return "bg-gray-100 text-gray-800";
      case "premium": return "bg-blue-100 text-blue-800";
      case "family": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getUsagePercentage = (count: number, limit: number | null) => {
    if (limit === null) return 0; // Unlimited
    return Math.min((count / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Subscription Status</CardTitle>
          </div>
          {subscription.planType !== "free" && (
            <Badge className={getPlanColor(subscription.planType)}>
              {getPlanDisplayName(subscription.planType)}
            </Badge>
          )}
        </div>
        {subscription.planType === "free" && (
          <CardDescription>
            Unlock premium features with wearable integration, advanced planning, and more.
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Trial Status */}
        {subscription.status === "trialing" && subscription.trialDaysLeft && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Free Trial Active</span>
            </div>
            <p className="text-sm text-blue-700">
              {subscription.trialDaysLeft} days remaining in your free trial
            </p>
          </div>
        )}

        {/* Usage Statistics */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-700">Usage This Month</h4>
          
          <div className="space-y-3">
            {/* Daily Tasks */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Tasks</span>
                <span className="text-gray-500">
                  {subscription.usageStats.tasks.count} / {subscription.usageStats.tasks.limit || "∞"}
                </span>
              </div>
              {subscription.usageStats.tasks.limit && (
                <Progress 
                  value={getUsagePercentage(subscription.usageStats.tasks.count, subscription.usageStats.tasks.limit)}
                  className="h-2"
                />
              )}
            </div>

            {/* Caregivers */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Caregiver Connections</span>
                <span className="text-gray-500">
                  {subscription.usageStats.caregivers.count} / {subscription.usageStats.caregivers.limit || "∞"}
                </span>
              </div>
              {subscription.usageStats.caregivers.limit && (
                <Progress 
                  value={getUsagePercentage(subscription.usageStats.caregivers.count, subscription.usageStats.caregivers.limit)}
                  className="h-2"
                />
              )}
            </div>

            {/* Data Exports */}
            {subscription.planType !== "free" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Data Exports</span>
                  <span className="text-gray-500">
                    {subscription.usageStats.dataExports.count} / {subscription.usageStats.dataExports.limit || "∞"}
                  </span>
                </div>
                {subscription.usageStats.dataExports.limit && (
                  <Progress 
                    value={getUsagePercentage(subscription.usageStats.dataExports.count, subscription.usageStats.dataExports.limit)}
                    className="h-2"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upgrade CTA for Free Users */}
        {subscription.planType === "free" && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium text-blue-900">Unlock Premium Features</p>
                  <p className="text-sm text-blue-700">
                    Get unlimited tasks, wearable device integration, meal planning, and priority support.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link href="/pricing">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Feature Access */}
        {subscription.planType !== "free" && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Your Premium Features</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Wearable Devices</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Meal Planning</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Medical Records</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Location Safety</span>
              </div>
              {subscription.features.advancedAnalytics && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Advanced Analytics</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Priority Support</span>
              </div>
            </div>
          </div>
        )}

        {/* Account Management */}
        {subscription.planType !== "free" && (
          <div className="pt-4 border-t border-gray-100">
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}