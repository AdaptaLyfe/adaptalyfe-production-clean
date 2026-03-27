import { registerPlugin } from '@capacitor/core';

const GOOGLE_PLAY_PRODUCT_IDS = {
  basic_monthly: 'adaptalyfe_basic_monthly',
  premium_monthly: 'adaptalyfe_premium_monthly',
  family_monthly: 'adaptalyfe_family_monthly',
} as const;

const PRODUCT_TO_PLAN: Record<string, { planType: string; billingCycle: string; amount: number }> = {
  adaptalyfe_basic_monthly: { planType: 'basic', billingCycle: 'monthly', amount: 499 },
  adaptalyfe_premium_monthly: { planType: 'premium', billingCycle: 'monthly', amount: 1299 },
  adaptalyfe_family_monthly: { planType: 'family', billingCycle: 'monthly', amount: 2499 },
};

// Capacitor 7 way to access a custom native plugin
let _billingPlugin: any = null;
function getBillingPlugin(): any {
  if (_billingPlugin) return _billingPlugin;
  try {
    // Capacitor 4+ / 7: use registerPlugin
    _billingPlugin = registerPlugin('GooglePlayBilling');
    return _billingPlugin;
  } catch {
    // Fallback: check legacy window.Capacitor.Plugins
    try {
      const cap = (window as any).Capacitor;
      if (cap?.Plugins?.GooglePlayBilling) {
        _billingPlugin = cap.Plugins.GooglePlayBilling;
        return _billingPlugin;
      }
    } catch {}
    return null;
  }
}

export function isAndroidApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cap = (window as any).Capacitor;
    return cap?.isNativePlatform?.() && cap?.getPlatform?.() === 'android';
  } catch {
    return false;
  }
}

export function getGooglePlayProductId(planType: string, billingCycle: string): string {
  const key = `${planType}_${billingCycle}` as keyof typeof GOOGLE_PLAY_PRODUCT_IDS;
  return GOOGLE_PLAY_PRODUCT_IDS[key] || '';
}

export function getPlanFromProductId(productId: string) {
  return PRODUCT_TO_PLAN[productId] || null;
}

export function getProductIds(): string[] {
  return Object.values(GOOGLE_PLAY_PRODUCT_IDS);
}

interface GooglePlayPurchaseResult {
  success: boolean;
  purchaseToken?: string;
  orderId?: string;
  productId?: string;
  error?: string;
}

export async function initGooglePlayBilling(): Promise<boolean> {
  if (!isAndroidApp()) return false;

  try {
    const plugin = getBillingPlugin();
    if (!plugin) {
      console.warn('GooglePlayBilling plugin not found via registerPlugin or window.Capacitor.Plugins');
      return false;
    }
    const result = await plugin.initialize();
    const connected = result?.connected === true;
    console.log('Google Play Billing initialize result:', result, 'connected:', connected);
    return connected;
  } catch (error) {
    console.error('Failed to initialize Google Play Billing:', error);
    return false;
  }
}

export async function queryProducts(): Promise<any[]> {
  if (!isAndroidApp()) return [];

  try {
    const plugin = getBillingPlugin();
    if (!plugin) return [];
    const result = await plugin.queryProducts({
      productIds: getProductIds(),
      productType: 'subs'
    });
    return result?.products || [];
  } catch (error) {
    console.error('Failed to query products:', error);
    return [];
  }
}

export async function purchaseSubscription(productId: string): Promise<GooglePlayPurchaseResult> {
  if (!isAndroidApp()) {
    return { success: false, error: 'Not running on Android' };
  }

  try {
    const plugin = getBillingPlugin();
    if (!plugin) {
      return { success: false, error: 'Billing plugin not available' };
    }

    const result = await plugin.purchaseSubscription({
      productId,
      offerToken: ''
    });

    if (result?.purchaseToken) {
      return {
        success: true,
        purchaseToken: result.purchaseToken,
        orderId: result.orderId,
        productId: result.productId || productId,
      };
    }

    return { success: false, error: result?.error || 'Purchase failed' };
  } catch (error: any) {
    if (error?.code === 'USER_CANCELED' || error?.message?.includes('canceled')) {
      return { success: false, error: 'Purchase canceled' };
    }
    console.error('Purchase error:', error);
    return { success: false, error: error?.message || 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<GooglePlayPurchaseResult[]> {
  if (!isAndroidApp()) return [];

  try {
    const plugin = getBillingPlugin();
    if (!plugin) return [];
    const result = await plugin.restorePurchases({ productType: 'subs' });
    return (result?.purchases || []).map((p: any) => ({
      success: true,
      purchaseToken: p.purchaseToken,
      orderId: p.orderId,
      productId: p.productId,
    }));
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return [];
  }
}

export async function verifyPurchaseOnServer(
  purchaseToken: string,
  productId: string,
  orderId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/google-play/verify-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ purchaseToken, productId, orderId }),
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

export { GOOGLE_PLAY_PRODUCT_IDS, PRODUCT_TO_PLAN };
