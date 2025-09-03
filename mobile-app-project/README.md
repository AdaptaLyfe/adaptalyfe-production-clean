# Adaptalyfe Mobile App

A React Native mobile application built with Expo that connects to the Adaptalyfe web platform to provide a seamless cross-platform experience for users with developmental disabilities.

## Quick Start for Expo Go

### Prerequisites
1. Install the Expo Go app on your phone:
   - **iOS**: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
   - **Android**: [Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Make sure your Replit web app is running (the main project server)

### Setup Steps

1. **Open Terminal in Replit**
   - Navigate to the mobile-app-project folder:
   ```bash
   cd mobile-app-project
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Expo Development Server**
   ```bash
   npx expo start
   ```

4. **Connect with Expo Go**
   - A QR code will appear in your terminal
   - Open Expo Go on your phone
   - Scan the QR code with your phone camera (iOS) or the "Scan QR Code" button in Expo Go (Android)
   - The app will load and connect to your Replit server

## Features

- **Cross-Platform Sync**: All data syncs with your web application
- **Native Mobile Experience**: Optimized touch interface for mobile devices
- **Offline Capabilities**: Core features work even without internet
- **Push Notifications**: Reminders and alerts sent directly to your phone
- **Camera Integration**: Document scanning and photo features
- **Location Services**: Safety features and location-based reminders
- **Secure Authentication**: Same login as web application

## App Structure

- **Home**: Dashboard with quick actions and today's tasks
- **Tasks**: Daily task management with completion tracking
- **Mood**: Mood tracking and emotional wellness features
- **Calendar**: Schedule management and appointment tracking
- **Messages**: Communication with caregivers and support network
- **Settings**: Preferences and security controls

## Configuration

The app automatically connects to your Replit web server. The connection URLs are configured in:
- `.env` file - Environment variables
- `app.config.js` - Expo configuration
- `constants/Config.ts` - API endpoints

## Development Commands

```bash
# Start development server
npx expo start

# Start with QR code cleared
npx expo start --clear

# Start on specific platform
npx expo start --ios
npx expo start --android

# Build for production
npx expo build

# Check for issues
npx expo doctor
```

## Troubleshooting

**Can't connect to server:**
- Ensure your main Replit project is running
- Check that both devices are on the same network
- Verify the URL in `.env` matches your Replit project URL

**App crashes or won't load:**
- Try clearing the Expo cache: `npx expo start --clear`
- Restart the Expo development server
- Check for errors in the terminal

**QR code not working:**
- Make sure you're using the Expo Go app, not your phone's built-in camera
- Try typing the URL manually in Expo Go
- Ensure your phone and computer are on the same WiFi network

## Next Steps

Once you've tested the app with Expo Go:
1. Customize the branding and colors
2. Add additional features specific to your needs
3. Build production versions with EAS Build
4. Submit to app stores when ready

The mobile app provides the same powerful features as the web version, optimized for mobile use and enhanced with native device capabilities.