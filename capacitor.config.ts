import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adaptalyfe.app',
  appName: 'Adaptalyfe',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // For local development, you can uncomment and set your IP:
    // url: 'http://192.168.1.X:5000',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      showSpinner: true,
      spinnerColor: "#6366f1"
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff'
    },
    Keyboard: {
      resize: 'native'
    }
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
