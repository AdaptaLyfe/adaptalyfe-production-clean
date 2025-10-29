import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';

/**
 * Detect the current platform
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
}

/**
 * Check if running as a native mobile app
 */
export function isNativeMobile(): boolean {
  const platform = getPlatform();
  return platform === 'ios' || platform === 'android';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

/**
 * Check if running on web
 */
export function isWeb(): boolean {
  return getPlatform() === 'web';
}

/**
 * Initialize mobile app features (status bar, keyboard, etc.)
 * Call this once when the app starts
 */
export async function initializeMobileApp() {
  if (!isNativeMobile()) {
    console.log('Running on web - skipping mobile initialization');
    return;
  }

  console.log(`Initializing mobile app for ${getPlatform()}`);

  try {
    // Configure status bar - use dark icons on light background
    await StatusBar.setStyle({ style: Style.Dark });
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    }

    // Hide splash screen after a delay
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 2000);

    // Set up keyboard behavior
    if (Keyboard) {
      Keyboard.addListener('keyboardWillShow', (info) => {
        console.log('Keyboard will show:', info);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        console.log('Keyboard will hide');
      });
    }

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });

    // Handle back button on Android
    if (isAndroid()) {
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
    }

    console.log('Mobile app initialized successfully');
  } catch (error) {
    console.error('Error initializing mobile app:', error);
  }
}

/**
 * Get device info for debugging
 */
export function getDeviceInfo() {
  return {
    platform: getPlatform(),
    isNative: isNativeMobile(),
    isCapacitor: Capacitor.isNativePlatform(),
  };
}
