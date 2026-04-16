import UIKit
import Capacitor
import AppTrackingTransparency

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var hasRequestedTracking = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        if !hasRequestedTracking {
            hasRequestedTracking = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self.showTrackingPrePrompt()
            }
        }
    }

    private func showTrackingPrePrompt() {
        guard #available(iOS 14, *) else { return }
        guard let rootVC = window?.rootViewController else { return }

        let alert = UIAlertController(
            title: "Help Us Improve Adaptalyfe",
            message: "Adaptalyfe uses analytics to understand how features are used so we can improve the app experience and better support your daily independence goals.\n\nNo personal or health information is shared with advertisers.",
            preferredStyle: .alert
        )

        let allowAction = UIAlertAction(title: "Allow", style: .default) { _ in
            ATTrackingManager.requestTrackingAuthorization { status in
                DispatchQueue.main.async {
                    print("ATT status: \(status.rawValue)")
                }
            }
        }

        let denyAction = UIAlertAction(title: "Ask App Not to Track", style: .cancel) { _ in
            print("ATT: User chose not to track")
        }

        alert.addAction(allowAction)
        alert.addAction(denyAction)
        alert.preferredAction = allowAction

        if let popover = alert.popoverPresentationController {
            popover.sourceView = rootVC.view
            popover.sourceRect = CGRect(
                x: rootVC.view.bounds.midX,
                y: rootVC.view.bounds.midY,
                width: 0,
                height: 0
            )
            popover.permittedArrowDirections = []
        }

        var topVC = rootVC
        while let presented = topVC.presentedViewController {
            topVC = presented
        }
        topVC.present(alert, animated: true, completion: nil)
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
