package com.adaptalyfe.app;

import android.util.Log;
import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.android.billingclient.api.*;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "GooglePlayBilling")
public class GooglePlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private static final String TAG = "GooglePlayBilling";
    private BillingClient billingClient;
    private PluginCall pendingPurchaseCall;

    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases()
                .build();

            billingClient.startConnection(new BillingClientStateListener() {
                @Override
                public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        Log.d(TAG, "Billing client connected");
                        JSObject result = new JSObject();
                        result.put("connected", true);
                        call.resolve(result);
                    } else {
                        Log.e(TAG, "Billing setup failed: " + billingResult.getDebugMessage());
                        JSObject result = new JSObject();
                        result.put("connected", false);
                        result.put("error", billingResult.getDebugMessage());
                        call.resolve(result);
                    }
                }

                @Override
                public void onBillingServiceDisconnected() {
                    Log.w(TAG, "Billing service disconnected");
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize billing", e);
            call.reject("Failed to initialize billing: " + e.getMessage());
        }
    }

    @PluginMethod
    public void queryProducts(PluginCall call) {
        if (billingClient == null || !billingClient.isReady()) {
            call.reject("Billing client not ready");
            return;
        }

        try {
            List<String> productIds = new ArrayList<>();
            org.json.JSONArray ids = call.getArray("productIds");
            if (ids != null) {
                for (int i = 0; i < ids.length(); i++) {
                    productIds.add(ids.getString(i));
                }
            }

            List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
            for (String id : productIds) {
                productList.add(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(id)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()
                );
            }

            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build();

            billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    org.json.JSONArray products = new org.json.JSONArray();
                    for (ProductDetails details : productDetailsList) {
                        JSObject product = new JSObject();
                        product.put("productId", details.getProductId());
                        product.put("name", details.getName());
                        product.put("description", details.getDescription());

                        List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
                        if (offers != null && !offers.isEmpty()) {
                            ProductDetails.SubscriptionOfferDetails offer = offers.get(0);
                            product.put("offerToken", offer.getOfferToken());
                            List<ProductDetails.PricingPhase> phases = offer.getPricingPhases().getPricingPhaseList();
                            if (!phases.isEmpty()) {
                                ProductDetails.PricingPhase phase = phases.get(phases.size() - 1);
                                product.put("price", phase.getFormattedPrice());
                                product.put("priceMicros", phase.getPriceAmountMicros());
                                product.put("currencyCode", phase.getPriceCurrencyCode());
                                product.put("billingPeriod", phase.getBillingPeriod());
                            }
                        }
                        products.put(product);
                    }
                    JSObject result = new JSObject();
                    result.put("products", products);
                    call.resolve(result);
                } else {
                    call.reject("Query failed: " + billingResult.getDebugMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Query products error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void purchaseSubscription(PluginCall call) {
        if (billingClient == null || !billingClient.isReady()) {
            call.reject("Billing client not ready");
            return;
        }

        String productId = call.getString("productId");
        if (productId == null || productId.isEmpty()) {
            call.reject("Product ID is required");
            return;
        }

        pendingPurchaseCall = call;

        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        productList.add(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        );

        QueryProductDetailsParams queryParams = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build();

        billingClient.queryProductDetailsAsync(queryParams, (billingResult, productDetailsList) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || productDetailsList.isEmpty()) {
                pendingPurchaseCall = null;
                call.reject("Product not found: " + productId);
                return;
            }

            ProductDetails productDetails = productDetailsList.get(0);
            List<ProductDetails.SubscriptionOfferDetails> offers = productDetails.getSubscriptionOfferDetails();
            if (offers == null || offers.isEmpty()) {
                pendingPurchaseCall = null;
                call.reject("No subscription offers available");
                return;
            }

            String offerToken = call.getString("offerToken");
            if (offerToken == null || offerToken.isEmpty()) {
                offerToken = offers.get(0).getOfferToken();
            }

            List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
            productDetailsParamsList.add(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(productDetails)
                    .setOfferToken(offerToken)
                    .build()
            );

            BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build();

            getActivity().runOnUiThread(() -> {
                BillingResult launchResult = billingClient.launchBillingFlow(getActivity(), billingFlowParams);
                if (launchResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    pendingPurchaseCall = null;
                    call.reject("Failed to launch billing flow: " + launchResult.getDebugMessage());
                }
            });
        });
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        if (billingClient == null || !billingClient.isReady()) {
            call.reject("Billing client not ready");
            return;
        }

        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS)
                .build(),
            (billingResult, purchaseList) -> {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    org.json.JSONArray purchases = new org.json.JSONArray();
                    for (Purchase purchase : purchaseList) {
                        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            JSObject p = new JSObject();
                            p.put("purchaseToken", purchase.getPurchaseToken());
                            p.put("orderId", purchase.getOrderId());
                            List<String> products = purchase.getProducts();
                            if (!products.isEmpty()) {
                                p.put("productId", products.get(0));
                            }
                            p.put("purchaseTime", purchase.getPurchaseTime());
                            purchases.put(p);
                        }
                    }
                    JSObject result = new JSObject();
                    result.put("purchases", purchases);
                    call.resolve(result);
                } else {
                    call.reject("Failed to query purchases: " + billingResult.getDebugMessage());
                }
            }
        );
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, List<Purchase> purchases) {
        if (pendingPurchaseCall == null) return;

        PluginCall call = pendingPurchaseCall;
        pendingPurchaseCall = null;

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null && !purchases.isEmpty()) {
            Purchase purchase = purchases.get(0);
            JSObject result = new JSObject();
            result.put("purchaseToken", purchase.getPurchaseToken());
            result.put("orderId", purchase.getOrderId());
            List<String> products = purchase.getProducts();
            if (!products.isEmpty()) {
                result.put("productId", products.get(0));
            }
            result.put("purchaseTime", purchase.getPurchaseTime());
            result.put("purchaseState", purchase.getPurchaseState());
            call.resolve(result);
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", "Purchase canceled");
            call.resolve(result);
        } else {
            call.reject("Purchase failed: " + billingResult.getDebugMessage(), String.valueOf(billingResult.getResponseCode()));
        }
    }
}
