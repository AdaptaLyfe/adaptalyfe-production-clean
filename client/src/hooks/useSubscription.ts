import { useQuery } from "@tanstack/react-query";

export function useSubscription() {
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  }) as { data: any };

  const tier = user?.subscriptionTier || 'free';
  const status = user?.subscriptionStatus || 'inactive';

  const isActive = status === 'active';
  const isFamily = tier === 'family' && isActive;
  const isPremium = (tier === 'premium' || tier === 'family') && isActive;
  const isBasic = tier === 'basic' && isActive;
  const isAnyPaid = isActive && tier !== 'free';

  // Returns true if the user can access a feature at the given required tier
  const hasFeatureAccess = (requiredTier: 'basic' | 'premium' | 'family') => {
    if (!isActive) return false;
    if (requiredTier === 'basic') return isAnyPaid;
    if (requiredTier === 'premium') return isPremium;
    if (requiredTier === 'family') return isFamily;
    return false;
  };

  return {
    user,
    tier,
    status,
    isPremium,
    isFamily,
    isBasic,
    isAnyPaid,
    isActive,
    subscriptionTier: tier,
    subscriptionStatus: status,
    hasFeatureAccess,
  };
}
