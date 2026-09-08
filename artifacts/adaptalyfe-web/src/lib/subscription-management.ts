export type SubscriptionPlatform = "app_store" | "google_play" | "web";

export function getSubscriptionManagementMessage(platform: unknown): string {
  switch (platform) {
    case "app_store":
      return "Your subscription is active. Manage it in your Apple ID settings.";
    case "google_play":
      return "Your subscription is active. Manage it in Google Play Store settings.";
    case "web":
      return "Your subscription is active. Manage your subscription on the web.";
    default:
      return "Your subscription is active. Subscription management details are unavailable.";
  }
}