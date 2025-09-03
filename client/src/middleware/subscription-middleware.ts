import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { User } from "@shared/schema";

export interface SubscriptionData {
  id: number;
  planType: string;
  status: string;
  trialDaysLeft: number | null;
  features: {
    wearableDevices: boolean;
    mealPlanning: boolean;
    medicationManagement: boolean;
    locationSafety: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
  };
}

export function useSubscriptionEnforcement() {
  const [location, setLocation] = useLocation();
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });
  const { data: subscription } = useQuery<SubscriptionData>({ queryKey: ["/api/subscription"] });

  useEffect(() => {
    if (!user || !subscription) return;

    // Admin users get full access without restrictions
    const isAdmin = user.accountType === 'admin' || user.username === 'admin' || user.name?.toLowerCase().includes('admin');
    if (isAdmin) return;

    // List of premium features that require subscription
    const premiumRoutes = [
      '/wearable-devices',
      '/meal-planning',
      '/medication-management',
      '/location-safety',
      '/analytics',
      '/pharmacy'
    ];

    // Check if current route is premium
    const isPremiumRoute = premiumRoutes.some(route => location.startsWith(route));
    
    if (isPremiumRoute) {
      // If trial expired and no active subscription, redirect to subscription page
      if (subscription.status === 'expired' || 
          (subscription.status !== 'active' && subscription.trialDaysLeft === 0)) {
        setLocation('/subscription');
        return;
      }

      // Check specific feature access
      const routeFeatureMap: Record<string, keyof SubscriptionData['features']> = {
        '/wearable-devices': 'wearableDevices',
        '/meal-planning': 'mealPlanning',
        '/medication-management': 'medicationManagement',
        '/location-safety': 'locationSafety',
        '/analytics': 'advancedAnalytics',
        '/pharmacy': 'medicationManagement'
      };

      const currentRouteFeature = Object.entries(routeFeatureMap).find(([route]) => 
        location.startsWith(route)
      )?.[1];

      if (currentRouteFeature && !subscription.features[currentRouteFeature]) {
        setLocation('/subscription');
      }
    }
  }, [location, user, subscription, setLocation]);

  const isAdmin = user?.accountType === 'admin' || user?.username === 'admin' || user?.name?.toLowerCase().includes('admin');

  return {
    subscription,
    isPremiumUser: isAdmin || subscription?.status === 'active' || 
                   (subscription?.status === 'trialing' && (subscription?.trialDaysLeft || 0) > 0),
    hasFeature: (feature: keyof SubscriptionData['features']) => 
      isAdmin || subscription?.features[feature] || false
  };
}

export function checkFeatureAccess(feature: keyof SubscriptionData['features'], subscription?: SubscriptionData): boolean {
  if (!subscription) return false;
  
  // If trial expired and no active subscription
  if (subscription.status === 'expired' || 
      (subscription.status !== 'active' && subscription.trialDaysLeft === 0)) {
    return false;
  }

  return subscription.features[feature];
}

export function getPremiumPromptMessage(feature: string): string {
  const messages: Record<string, string> = {
    wearableDevices: "Connect wearable devices to track your health metrics in real-time. Upgrade to Premium to unlock this feature.",
    mealPlanning: "Create personalized meal plans and shopping lists. Upgrade to Premium to access advanced meal planning.",
    medicationManagement: "Track medications, set reminders, and manage your pharmacy information. Upgrade to Premium to unlock medication management.",
    locationSafety: "Set up safe zones and get location-based alerts. Upgrade to Family plan to access advanced safety features.",
    advancedAnalytics: "View detailed analytics and progress reports. Upgrade to Family plan to unlock advanced analytics.",
    prioritySupport: "Get priority customer support and assistance. Upgrade to Premium to access priority support."
  };

  return messages[feature] || "This is a premium feature. Upgrade your subscription to unlock it.";
}