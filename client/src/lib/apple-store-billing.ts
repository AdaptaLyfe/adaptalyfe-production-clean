const APPLE_PRODUCT_IDS = {
  basic_monthly: 'adaptalyfe_basic_monthly',
  premium_monthly: 'adaptalyfe_premium_monthly',
  family_monthly: 'adaptalyfe_family_monthly',
} as const;

const PRODUCT_TO_PLAN: Record<string, { planType: string; billingCycle: string; amount: number }> = {
  adaptalyfe_basic_monthly: { planType: 'basic', billingCycle: 'monthly', amount: 499 },
  adaptalyfe_premium_monthly: { planType: 'premium', billingCycle: 'monthly', amount: 1299 },
  adaptalyfe_family_monthly: { planType: 'family', billingCycle: 'monthly', amount: 2499 },
};

export function isIOSApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cap = (window as any).Capacitor;
    return cap?.isNativePlatform?.() && cap?.getPlatform?.() === 'ios';
  } catch {
    return false;
  }
}

export function getAppleProductId(planType: string, billingCycle: string): string {
  const key = `${planType}_${billingCycle}` as keyof typeof APPLE_PRODUCT_IDS;
  return APPLE_PRODUCT_IDS[key] || '';
}

export function getPlanFromProductId(productId: string) {
  return PRODUCT_TO_PLAN[productId] || null;
}

export function getProductIds(): string[] {
  return Object.values(APPLE_PRODUCT_IDS);
}

function getPlugin() {
  const cap = (window as any).Capacitor;
  return cap?.Plugins?.AppleStoreKit || null;
}

interface ApplePurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  receiptData?: string;
  originalTransactionId?: string;
  error?: string;
}

export async function initAppleStoreKit(): Promise<boolean> {
  if (!isIOSApp()) return false;
  try {
    const plugin = getPlugin();
    if (!plugin) {
      console.log('AppleStoreKit plugin not available');
      return false;
    }
    const result = await plugin.initialize();
    return result?.available === true;
  } catch (error) {
    console.error('Failed to initialize Apple StoreKit:', error);
    return false;
  }
}

export async function queryProducts(): Promise<any[]> {
  if (!isIOSApp()) return [];
  try {
    const plugin = getPlugin();
    if (!plugin) return [];
    const result = await plugin.queryProducts();
    return result?.products || [];
  } catch (error) {
    console.error('Failed to query Apple products:', error);
    return [];
  }
}

export async function purchaseSubscription(productId: string): Promise<ApplePurchaseResult> {
  if (!isIOSApp()) {
    return { success: false, error: 'Not running on iOS' };
  }
  try {
    const plugin = getPlugin();
    if (!plugin) {
      return { success: false, error: 'StoreKit plugin not available' };
    }
    const result = await plugin.purchaseSubscription({ productId });
    if (result?.success) {
      return {
        success: true,
        productId: result.productId || productId,
        transactionId: result.transactionId,
        receiptData: result.receiptData,
        originalTransactionId: result.originalTransactionId,
      };
    }
    return { success: false, error: 'Purchase failed' };
  } catch (error: any) {
    if (error?.message === 'USER_CANCELED' || error?.message?.includes('cancel')) {
      return { success: false, error: 'Purchase canceled' };
    }
    console.error('Apple purchase error:', error);
    return { success: false, error: error?.message || 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<ApplePurchaseResult[]> {
  if (!isIOSApp()) return [];
  try {
    const plugin = getPlugin();
    if (!plugin) return [];
    const result = await plugin.restorePurchases();
    if (result?.restored && result.receiptData) {
      return [{
        success: true,
        productId: result.productId,
        transactionId: result.transactionId,
        receiptData: result.receiptData,
      }];
    }
    return [];
  } catch (error) {
    console.error('Failed to restore Apple purchases:', error);
    return [];
  }
}

export async function verifyPurchaseOnServer(
  receiptData: string,
  productId: string,
  transactionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/apple/verify-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ receiptData, productId, transactionId }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || 'Verification failed' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

export { APPLE_PRODUCT_IDS, PRODUCT_TO_PLAN };
