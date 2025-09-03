import { useQuery } from "@tanstack/react-query";

export function useSubscription() {
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  }) as { data: any };

  const isPremium = user?.subscriptionTier === 'premium' || user?.subscriptionStatus === 'active';
  const isBasic = !isPremium;

  return {
    user,
    isPremium,
    isBasic,
    subscriptionTier: user?.subscriptionTier || 'basic',
    subscriptionStatus: user?.subscriptionStatus || 'inactive',
    hasFeatureAccess: (feature: string) => feature === 'basic' || isPremium
  };
}