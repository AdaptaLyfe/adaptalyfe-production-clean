#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(AppleStoreKitPlugin, "AppleStoreKit",
    CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(queryProducts, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(purchaseSubscription, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(restorePurchases, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getReceiptData, CAPPluginReturnPromise);
)
