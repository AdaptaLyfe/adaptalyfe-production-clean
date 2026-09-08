import Foundation
import StoreKit
import Capacitor

@objc(AppleStoreKitPlugin)
public class AppleStoreKitPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "AppleStoreKitPlugin"
    public let jsName = "AppleStoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "queryProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchaseSubscription", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getReceiptData", returnType: CAPPluginReturnPromise)
    ]

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
            call.resolve(["receiptData": receiptData.base64EncodedString()])
        } else {
            call.resolve(["receiptData": ""])
        }
    }

    deinit {
        SKPaymentQueue.default().remove(self)
    }
}

extension AppleStoreKitPlugin: SKProductsRequestDelegate {
    public func productsRequest(_ request: SKProductsRequest, didReceive response: SKProductsResponse) {
        for product in response.products {
            availableProducts[product.productIdentifier] = product
        }
        if let purchaseCall = purchaseCall,
           let productId = purchaseCall.getString("productId"),
           let product = availableProducts[productId] {
            let payment = SKPayment(product: product)
            SKPaymentQueue.default().add(payment)
            return
        }
        if let queryCall = productQueryCall {
            let formatter = NumberFormatter()
            formatter.numberStyle = .currency
            let productsArray = response.products.map { product -> [String: Any] in
                formatter.locale = product.priceLocale
                return [
                    "productId": product.productIdentifier,
                    "title": product.localizedTitle,
                    "description": product.localizedDescription,
                    "price": product.price.doubleValue,
                    "priceString": formatter.string(from: product.price) ?? "$\(product.price)",
                    "currencyCode": product.priceLocale.currencyCode ?? "USD"
                ]
            }
            queryCall.resolve(["products": productsArray])
            productQueryCall = nil
        }
    }

    public func request(_ request: SKRequest, didFailWithError error: Error) {
        productQueryCall?.reject("Failed to fetch products: \(error.localizedDescription)")
        productQueryCall = nil
        purchaseCall?.reject("Failed to fetch products: \(error.localizedDescription)")
        purchaseCall = nil
    }
}

extension AppleStoreKitPlugin: SKPaymentTransactionObserver {
    public func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        for transaction in transactions {
            switch transaction.transactionState {
            case .purchased:  handlePurchased(transaction)
            case .failed:     handleFailed(transaction)
            case .restored:   handleRestored(transaction)
            default:          break
            }
        }
    }

    private func handlePurchased(_ transaction: SKPaymentTransaction) {
        SKPaymentQueue.default().finishTransaction(transaction)
        var receiptData = ""
        if let url = Bundle.main.appStoreReceiptURL, let data = try? Data(contentsOf: url) {
            receiptData = data.base64EncodedString()
        }
        purchaseCall?.resolve([
            "success": true,
            "productId": transaction.payment.productIdentifier,
            "transactionId": transaction.transactionIdentifier ?? "",
            "receiptData": receiptData,
            "originalTransactionId": transaction.original?.transactionIdentifier ?? ""
        ])
        purchaseCall = nil
    }

    private func handleFailed(_ transaction: SKPaymentTransaction) {
        SKPaymentQueue.default().finishTransaction(transaction)
        let errorCode = (transaction.error as? SKError)?.code
        if errorCode == .paymentCancelled {
            purchaseCall?.reject("USER_CANCELED")
        } else {
            purchaseCall?.reject(transaction.error?.localizedDescription ?? "Purchase failed")
        }
        purchaseCall = nil
    }

    private func handleRestored(_ transaction: SKPaymentTransaction) {
        SKPaymentQueue.default().finishTransaction(transaction)
        var receiptData = ""
        if let url = Bundle.main.appStoreReceiptURL, let data = try? Data(contentsOf: url) {
            receiptData = data.base64EncodedString()
        }
        restoreCall?.resolve([
            "restored": true,
            "productId": transaction.payment.productIdentifier,
            "transactionId": transaction.original?.transactionIdentifier ?? transaction.transactionIdentifier ?? "",
            "receiptData": receiptData
        ])
        restoreCall = nil
    }

    public func paymentQueueRestoreCompletedTransactionsFinished(_ queue: SKPaymentQueue) {
        restoreCall?.resolve(["restored": false, "message": "No previous purchases found"])
        restoreCall = nil
    }

    public func paymentQueue(_ queue: SKPaymentQueue, restoreCompletedTransactionsFailedWithError error: Error) {
        restoreCall?.reject("Restore failed: \(error.localizedDescription)")
        restoreCall = nil
    }
}
