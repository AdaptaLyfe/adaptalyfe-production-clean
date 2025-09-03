import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adaptalyfe.app',
  appName: 'Adaptalyfe',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    App: {
      launchUrl: 'https://adaptalyfe.app',
      launchAutoHide: false
    }
  }
};

export default config;
