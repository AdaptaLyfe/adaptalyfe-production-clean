import Foundation
import StoreKit
import WebKit

class StoreKitBridge: NSObject, WKScriptMessageHandler {

    weak var webView: WKWebView?

    private var availableProducts: [String: SKProduct] = [:]
    private var pendingCalls: [String: String] = [:]  // callId -> action
    private var purchaseCallId: String?
    private var restoreCallId: String?
    private var queryCallId: String?

    private let PRODUCT_IDS: Set<String> = [
        "adaptalyfe_basic_monthly",
        "adaptalyfe_premium_monthly",
        "adaptalyfe_family_monthly"
    ]

    override init() {
        super.init()
        SKPaymentQueue.default().add(self)
    }

    deinit {
        SKPaymentQueue.default().remove(self)
    }

    // Called when JavaScript sends a message via window.webkit.messageHandlers.storeKit.postMessage(...)
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let action = body["action"] as? String,
              let callId = body["callId"] as? String else {
            return
        }
        let params = body["params"] as? [String: Any]

        switch action {
        case "initialize":
            let available = SKPaymentQueue.canMakePayments()
            sendResult(callId: callId, result: ["available": available])

        case "purchaseSubscription":
            guard let productId = params?["productId"] as? String else {
                sendError(callId: callId, error: "productId is required")
                return
            }
            guard SKPaymentQueue.canMakePayments() else {
                sendError(callId: callId, error: "Payments not available on this device")
                return
            }
            purchaseCallId = callId
            if let product = availableProducts[productId] {
                let payment = SKPayment(product: product)
                SKPaymentQueue.default().add(payment)
            } else {
                let request = SKProductsRequest(productIdentifiers: [productId])
                request.delegate = self
                request.start()
            }

        case "queryProducts":
            queryCallId = callId
            let request = SKProductsRequest(productIdentifiers: PRODUCT_IDS)
            request.delegate = self
            request.start()

        case "restorePurchases":
            restoreCallId = callId
            SKPaymentQueue.default().restoreCompletedTransactions()

        case "getReceiptData":
            if let receiptURL = Bundle.main.appStoreReceiptURL,
               let data = try? Data(contentsOf: receiptURL) {
                sendResult(callId: callId, result: ["receiptData": data.base64EncodedString()])
            } else {
                sendResult(callId: callId, result: ["receiptData": ""])
            }

        default:
            sendError(callId: callId, error: "Unknown action: \(action)")
        }
    }

    // Send success result back to JavaScript
    func sendResult(callId: String, result: [String: Any]) {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: result),
              let jsonString = String(data: jsonData, encoding: .utf8) else { return }
        let js = "window.__storeKitCallbacks && window.__storeKitCallbacks['\(callId)'] && window.__storeKitCallbacks['\(callId)'].resolve(\(jsonString))"
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    // Send error back to JavaScript
    func sendError(callId: String, error: String) {
        let escaped = error.replacingOccurrences(of: "'", with: "\\'")
        let js = "window.__storeKitCallbacks && window.__storeKitCallbacks['\(callId)'] && window.__storeKitCallbacks['\(callId)'].reject('\(escaped)')"
        DispatchQueue.main.async {
            self.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}

// MARK: - SKProductsRequestDelegate
extension StoreKitBridge: SKProductsRequestDelegate {
    func productsRequest(_ request: SKProductsRequest, didReceive response: SKProductsResponse) {
        for product in response.products {
            availableProducts[product.productIdentifier] = product
        }

        // If this was triggered by a purchase attempt
        if let callId = purchaseCallId,
           let productId = availableProducts.keys.first(where: { availableProducts[$0] != nil }) {
            if let product = response.products.first {
                let payment = SKPayment(product: product)
                SKPaymentQueue.default().add(payment)
            } else {
                sendError(callId: callId, error: "Product not found in App Store")
                purchaseCallId = nil
            }
            return
        }

        // If this was a query
        if let callId = queryCallId {
            let formatter = NumberFormatter()
            formatter.numberStyle = .currency
            let productsArray: [[String: Any]] = response.products.map { product in
                formatter.locale = product.priceLocale
                return [
                    "productId": product.productIdentifier,
                    "title": product.localizedTitle,
                    "description": product.localizedDescription,
                    "price": product.price.doubleValue,
                    "priceString": formatter.string(from: product.price) ?? "\(product.price)",
                    "currencyCode": product.priceLocale.currencyCode ?? "USD"
                ]
            }
            sendResult(callId: callId, result: ["products": productsArray])
            queryCallId = nil
        }
    }

    func request(_ request: SKRequest, didFailWithError error: Error) {
        if let callId = purchaseCallId {
            sendError(callId: callId, error: error.localizedDescription)
            purchaseCallId = nil
        }
        if let callId = queryCallId {
            sendError(callId: callId, error: error.localizedDescription)
            queryCallId = nil
        }
    }
}

// MARK: - SKPaymentTransactionObserver
extension StoreKitBridge: SKPaymentTransactionObserver {
    func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
        for transaction in transactions {
            switch transaction.transactionState {
            case .purchased:
                handlePurchased(transaction)
            case .failed:
                handleFailed(transaction)
            case .restored:
                handleRestored(transaction)
            case .deferred, .purchasing:
                break
            @unknown default:
                break
            }
        }
    }

    private func getReceiptBase64() -> String {
        if let url = Bundle.main.appStoreReceiptURL,
           let data = try? Data(contentsOf: url) {
            return data.base64EncodedString()
        }
        return ""
    }

    private func handlePurchased(_ transaction: SKPaymentTransaction) {
        SKPaymentQueue.default().finishTransaction(transaction)
        guard let callId = purchaseCallId else { return }
        sendResult(callId: callId, result: [
            "success": true,
            "productId": transaction.payment.productIdentifier,
            "transactionId": transaction.transactionIdentifier ?? "",
            "receiptData": getReceiptBase64(),
            "originalTransactionId": transaction.original?.transactionIdentifier ?? ""
        ])
        purchaseCallId = nil
    }

    private func handleFailed(_ transaction: SKPaymentTransaction) {
        SKPaymentQueue.default().finishTransaction(transaction)
        guard let callId = purchaseCallId else { return }
        let skError = transaction.error as? SKError
        if skError?.code == .paymentCancelled {
            sendError(callId: callId, error: "USER_CANCELED")
        } else {
            sendError(callId: callId, error: transaction.error?.localizedDescription ?? "Purchase failed")
        }
        purchaseCallId = nil
    }

    private func handleRestored(_ transaction: SKPaymentTransaction) {
        SKPaymentQueue.default().finishTransaction(transaction)
        guard let callId = restoreCallId else { return }
        sendResult(callId: callId, result: [
            "restored": true,
            "productId": transaction.payment.productIdentifier,
            "transactionId": transaction.original?.transactionIdentifier ?? transaction.transactionIdentifier ?? "",
            "receiptData": getReceiptBase64()
        ])
        restoreCallId = nil
    }

    func paymentQueueRestoreCompletedTransactionsFinished(_ queue: SKPaymentQueue) {
        guard let callId = restoreCallId else { return }
        sendResult(callId: callId, result: ["restored": false, "message": "No previous purchases found"])
        restoreCallId = nil
    }

    func paymentQueue(_ queue: SKPaymentQueue, restoreCompletedTransactionsFailedWithError error: Error) {
        guard let callId = restoreCallId else { return }
        sendError(callId: callId, error: "Restore failed: \(error.localizedDescription)")
        restoreCallId = nil
    }
}
