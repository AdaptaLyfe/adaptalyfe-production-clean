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

// Check if the native StoreKit bridge is available
function hasStoreKitBridge(): boolean {
  return !!(window as any).webkit?.messageHandlers?.storeKit;
}

// Call native StoreKit bridge via WKWebView message handler
function callBridge(action: string, params?: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!hasStoreKitBridge()) {
      reject(new Error('StoreKit bridge not available'));
      return;
    }

    const callId = `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Set up callback registry
    if (!(window as any).__storeKitCallbacks) {
      (window as any).__storeKitCallbacks = {};
    }
    (window as any).__storeKitCallbacks[callId] = { resolve, reject };

    // Timeout after 60 seconds
    const timeout = setTimeout(() => {
      if ((window as any).__storeKitCallbacks?.[callId]) {
        delete (window as any).__storeKitCallbacks[callId];
        reject(new Error('StoreKit request timed out'));
      }
    }, 60000);

    // Override resolve/reject to clean up timeout
    (window as any).__storeKitCallbacks[callId] = {
      resolve: (value: any) => {
        clearTimeout(timeout);
        delete (window as any).__storeKitCallbacks[callId];
        resolve(value);
      },
      reject: (reason: any) => {
        clearTimeout(timeout);
        delete (window as any).__storeKitCallbacks[callId];
        reject(new Error(reason));
      }
    };

    // Send message to native
    (window as any).webkit.messageHandlers.storeKit.postMessage({ action, params, callId });
  });
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
    if (!hasStoreKitBridge()) {
      console.log('StoreKit bridge not yet available, retrying...');
      // Retry after short delay (bridge may not be installed yet)
      await new Promise(r => setTimeout(r, 500));
      if (!hasStoreKitBridge()) {
        console.log('StoreKit bridge not available');
        return false;
      }
    }
    const result = await callBridge('initialize');
    return result?.available === true;
  } catch (error) {
    console.error('Failed to initialize StoreKit:', error);
    return false;
  }
}

export async function queryProducts(): Promise<any[]> {
  if (!isIOSApp()) return [];
  try {
    const result = await callBridge('queryProducts');
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
  if (!hasStoreKitBridge()) {
    return { success: false, error: 'StoreKit not available on this device' };
  }
  try {
    const result = await callBridge('purchaseSubscription', { productId });
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
    const result = await callBridge('restorePurchases');
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
