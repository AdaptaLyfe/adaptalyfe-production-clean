export default {
  expo: {
    name: "Adaptalyfe",
    slug: "adaptalyfe-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0ea5e9"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.adaptalyfe.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0ea5e9"
      },
      package: "com.adaptalyfe.app"
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-camera",
        {
          cameraPermission: "Allow Adaptalyfe to access your camera for document scanning and photos",
          microphonePermission: "Allow Adaptalyfe to access your microphone for voice commands",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Adaptalyfe to use your location for safety features and reminders."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#0ea5e9"
        }
      ]
    ],
    scheme: "adaptalyfe",
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "adaptalyfe-mobile"
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev",
      webUrl: process.env.EXPO_PUBLIC_WEB_URL || "https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev"
    }
  }
};