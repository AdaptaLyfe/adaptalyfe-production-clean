import Foundation
import StoreKit
import Capacitor

@objc(AppleStoreKitPlugin)
public class AppleStoreKitPlugin: CAPPlugin, SKProductsRequestDelegate, SKPaymentTransactionObserver {

    private var productsRequest: SKProductsRequest?
    private var productQueryCall: CAPPluginCall?
    private var purchaseCall: CAPPluginCall?
    private var restoreCall: CAPPluginCall?
    private var availableProducts: [String: SKProduct] = [:]

    private let PRODUCT_IDS: Set<String> = [
        "adaptalyfe_basic_monthly",
        "adaptalyfe_premium_monthly",
        "adaptalyfe_family_monthly"
    ]

    public override func load() {
        SKPaymentQueue.default().add(self)
    }

    // MARK: - Plugin Methods

    @objc func initialize(_ call: CAPPluginCall) {
        let canMakePayments = SKPaymentQueue.canMakePayments()
        call.resolve(["available": canMakePayments])
    }

    @objc func queryProducts(_ call: CAPPluginCall) {
        guard SKPaymentQueue.canMakePayments() else {
            call.reject("Payments not available on this device")
            return
        }
        productQueryCall = call
        productsRequest = SKProductsRequest(productIdentifiers: PRODUCT_IDS)
        productsRequest?.delegate = self
        productsRequest?.start()
    }

    @objc func purchaseSubscription(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"), !productId.isEmpty else {
            call.reject("productId is required")
            return
        }
        guard SKPaymentQueue.canMakePayments() else {
            call.reject("Payments not available on this device")
            return
        }
        if let product = availableProducts[productId] {
            purchaseCall = call
            let payment = SKPayment(product: product)
            SKPaymentQueue.default().add(payment)
        } else {
            productQueryCall = nil
            purchaseCall = call
            let request = SKProductsRequest(productIdentifiers: [productId])
            request.delegate = self
            request.start()
            productsRequest = request
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        restoreCall = call
        SKPaymentQueue.default().restoreCompletedTransactions()
    }

    @objc func getReceiptData(_ call: CAPPluginCall) {
        if let receiptURL = Bundle.main.appStoreReceiptURL,
           let receiptData = try? Data(contentsOf: receiptURL) {
            let base64Receipt = receiptData.base64EncodedString()
            call.resolve(["receiptData": base64Receipt])
        } else {
            call.resolve(["receiptData": ""])
        }
    }

    // MARK: - SKProductsRequestDelegate

    public func productsRequest(_ request: SKProductsRequest, didReceive response: SKProductsResponse) {
        for product in response.products {
            availableProducts[product.productIdentifier] = product
        }

        if let purchaseCall = purchaseCall {
            guard let productId = purchaseCall.getString("productId"),
                  let product = availableProducts[productId] else {
                purchaseCall.reject("Product not found in App Store")
                self.purchaseCall = nil
                return
            }
            let payment = SKPayment(product: product)
            SKPaymentQueue.default().add(payment)
            return
        }

        if let queryCall = productQueryCall {
            let productsArray = response.products.map { product -> [String: Any] in
                let formatter = NumberFormatter()
                formatter.numberStyle = .currency
                formatter.locale = product.priceLocale
                let priceString = formatter.string(from: product.price) ?? "$\(product.price)"
                return [
                    "productId": product.productIdentifier,
                    "title": product.localizedTitle,
                    "description": product.localizedDescription,
                    "price": product.price.doubleValue,
                    "priceString": priceString,
                    "currencyCode": product.priceLocale.currencyCode ?? "USD"
                ]
            }
            queryCall.resolve(["products": productsArray])
            productQueryCall = nil
        }
    }

    public func request(_ request: SKRequest, didFailWithError error: Error) {
        if let call = productQueryCall {
            call.reject("Failed to fetch products: \(error.localizedDescription)")
            productQueryCall = nil
        }
        if let call = purchaseCall {
            call.reject("Failed to fetch products: \(error.localizedDescription)")
            purchaseCall = nil
        }
    }

    // MARK: - SKPaymentTransactionObserver

    public func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        for transaction in transactions {
            switch transaction.transactionState {
            case .purchased:
                handlePurchased(transaction)
            case .failed:
                handleFailed(transaction)
            case .restored:
                handleRestored(transaction)
            case .deferred:
                break
            case .purchasing:
                break
            @unknown default:
                break
            }
        }
    }

    private func handlePurchased(_ transaction: SKPaymentTransaction) {
        SKPaymentQueue.default().finishTransaction(transaction)
        var receiptData = ""
        if let receiptURL = Bundle.main.appStoreReceiptURL,
           let data = try? Data(contentsOf: receiptURL) {
            receiptData = data.base64EncodedString()
        }
        if let call = purchaseCall {
            call.resolve([
                "success": true,
                "productId": transaction.payment.productIdentifier,
                "transactionId": transaction.transactionIdentifier ?? "",
                "receiptData": receiptData,
                "originalTransactionId": transaction.original?.transactionIdentifier ?? ""
            ])
            purchaseCall = nil
        }
    }

    private func handleFailed(_ transaction: SKPaymentTransaction) {
        SKPaymentQueue.default().finishTransaction(transaction)
        if let call = purchaseCall {
            let errorCode = (transaction.error as? SKError)?.code
            if errorCode == .paymentCancelled {
                call.reject("USER_CANCELED")
            } else {
                call.reject(transaction.error?.localizedDescription ?? "Purchase failed")
            }
            purchaseCall = nil
        }
    }

    private func handleRestored(_ transaction: SKPaymentTransaction) {
        SKPaymentQueue.default().finishTransaction(transaction)
        var receiptData = ""
        if let receiptURL = Bundle.main.appStoreReceiptURL,
           let data = try? Data(contentsOf: receiptURL) {
            receiptData = data.base64EncodedString()
        }
        if let call = restoreCall {
            call.resolve([
                "restored": true,
                "productId": transaction.payment.productIdentifier,
                "transactionId": transaction.original?.transactionIdentifier ?? transaction.transactionIdentifier ?? "",
                "receiptData": receiptData
            ])
            restoreCall = nil
        }
    }

    public func paymentQueueRestoreCompletedTransactionsFinished(_ queue: SKPaymentQueue) {
        if let call = restoreCall {
            call.resolve(["restored": false, "message": "No previous purchases found"])
            restoreCall = nil
        }
    }

    public func paymentQueue(_ queue: SKPaymentQueue, restoreCompletedTransactionsFailedWithError error: Error) {
        if let call = restoreCall {
            call.reject("Restore failed: \(error.localizedDescription)")
            restoreCall = nil
        }
    }

    deinit {
        SKPaymentQueue.default().remove(self)
    }
}
