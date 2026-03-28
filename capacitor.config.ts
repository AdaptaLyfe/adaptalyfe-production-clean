import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adaptalyfe.app',
  appName: 'Adaptalyfe',
  webDir: 'dist/public',
  server: {
    url: 'https://app.getadaptalyfeapp.com',
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,      // CRITICAL: don't auto-hide — we hide it from JS after app loads
      launchShowDuration: 0,      // 0 = never auto-hide (launchAutoHide:false handles it)
      backgroundColor: "#ecfdf5", // Green tint matching the loading screen
      showSpinner: true,
      spinnerColor: "#10b981",    // Adaptalyfe green spinner
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "large"
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff'
    },
    Keyboard: {
      resize: 'native'
    }
  },
  android: {
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
