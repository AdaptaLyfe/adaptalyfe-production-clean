import UIKit
import Capacitor
import AppTrackingTransparency

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var hasRequestedTracking = false
    private let storeKitBridge = StoreKitBridge()
    private var bridgeInstalled = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Install StoreKit bridge into the WebView (only once)
        if !bridgeInstalled {
            installStoreKitBridge()
        }

        // Show ATT permission prompt once
        if !hasRequestedTracking {
            hasRequestedTracking = true
            if #available(iOS 14, *) {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    ATTrackingManager.requestTrackingAuthorization { status in
                        print("ATT status: \(status.rawValue)")
                    }
                }
            }
        }
    }

    private func installStoreKitBridge() {
        guard let rootVC = window?.rootViewController else { return }

        // Find the CAPBridgeViewController (Capacitor's root controller)
        let capVC = findCAPBridgeViewController(in: rootVC)
        guard let webView = capVC?.webView ?? findWKWebView(in: rootVC.view) else { return }

        storeKitBridge.webView = webView
        webView.configuration.userContentController.add(storeKitBridge, name: "storeKit")
        bridgeInstalled = true
        print("✅ StoreKit bridge installed successfully")
    }

    private func findCAPBridgeViewController(in vc: UIViewController) -> CAPBridgeViewController? {
        if let cap = vc as? CAPBridgeViewController { return cap }
        for child in vc.children {
            if let found = findCAPBridgeViewController(in: child) { return found }
        }
        return nil
    }

    private func findWKWebView(in view: UIView) -> WKWebView? {
        if let wk = view as? WKWebView { return wk }
        for sub in view.subviews {
            if let found = findWKWebView(in: sub) { return found }
        }
        return nil
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
