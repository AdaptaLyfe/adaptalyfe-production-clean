# Adaptalyfe Mobile - Expo Go Setup Guide

## Prerequisites

1. Install Expo Go app on your mobile device:
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. Install Expo CLI globally (if not already installed):
   ```bash
   npm install -g @expo/cli
   ```

## Setup Steps

### 1. Navigate to Mobile Project
```bash
cd mobile-app-project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
1. Copy `.env.example` to `.env`
2. Update the URL in `.env` to match your Replit web app URL:
   ```
   EXPO_PUBLIC_API_URL=https://your-replit-url-here.replit.dev
   EXPO_PUBLIC_WEB_URL=https://your-replit-url-here.replit.dev
   ```

### 4. Start Expo Development Server
```bash
npx expo start
```

### 5. Connect with Expo Go
1. Scan the QR code displayed in your terminal with your phone camera
2. This will open the app in Expo Go

## Features Available in Mobile App

- 📱 Native mobile interface optimized for touch
- 🔄 Real-time sync with your web application data
- 📍 Location services for safety features
- 📸 Camera access for document scanning
- 🔔 Push notifications for reminders
- 🔒 Secure authentication matching web app

## Development Tips

- Keep your Replit web server running while testing the mobile app
- The mobile app connects to your web server's API endpoints
- Changes to the mobile code will hot-reload automatically
- Use Expo Go's developer menu (shake device) for debugging

## Troubleshooting

**Connection Issues:**
- Ensure your phone and computer are on the same network
- Update the API URL in your .env file to match your Replit URL
- Check that your Replit web server is running

**Build Issues:**
- Run `npx expo install --fix` to resolve dependency conflicts
- Clear Expo cache: `npx expo start --clear`

## Next Steps

1. Test the mobile app with Expo Go
2. Once satisfied, you can build for production with EAS Build
3. Submit to app stores when ready

The mobile app is configured to use the same data and authentication as your web application, providing a seamless cross-platform experience for Adaptalyfe users.