import Flutter
import UIKit
import UserNotifications
import AVFoundation

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
    }
    application.registerForRemoteNotifications()
    GeneratedPluginRegistrant.register(with: self)
    let controller = window?.rootViewController as! FlutterViewController
    let textToSpeechChannel = FlutterMethodChannel(
      name: "adaptalyfe/text_to_speech",
      binaryMessenger: controller.binaryMessenger
    )
    let speechSynthesizer = AVSpeechSynthesizer()
    textToSpeechChannel.setMethodCallHandler { call, result in
      guard call.method == "speak" else {
        result(FlutterMethodNotImplemented)
        return
      }
      guard
        let arguments = call.arguments as? [String: Any],
        let text = arguments["text"] as? String,
        !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
      else {
        result(
          FlutterError(
            code: "INVALID_TEXT",
            message: "Text-to-speech text is empty.",
            details: nil
          )
        )
        return
      }
      let rate = (arguments["rate"] as? NSNumber)?.floatValue ?? 1.0
      let utterance = AVSpeechUtterance(string: text)
      utterance.rate = AVSpeechUtteranceDefaultSpeechRate * max(0.5, min(rate, 2.0))
      speechSynthesizer.stopSpeaking(at: .immediate)
      speechSynthesizer.speak(utterance)
      result(nil)
    }
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}