# Adaptalyfe - Independence Building App

A comprehensive mobile application designed to support teens and adults with neurodevelopmental disorders in building independence through visual task breakdown, emergency safety features, and caregiver support networks.

## Features

- **Daily Task Management** - Visual step-by-step task breakdowns
- **Medication Reminders** - HIPAA-compliant medication tracking
- **Banking Integration** - Secure automated bill pay with Plaid
- **AdaptAI Assistant** - AI-powered support and guidance
- **Emergency Features** - Quick access to emergency contacts
- **Caregiver Network** - Family and caregiver monitoring dashboard
- **Academic Planning** - Student support for high school and college

## Tech Stack

- **Frontend:** React with TypeScript, Tailwind CSS
- **Backend:** Node.js with Express, PostgreSQL
- **Mobile:** Capacitor for iOS/Android native apps
- **Security:** HIPAA-compliant encryption and audit logging

## App Store Deployment

This project is configured for iOS App Store submission using CodeMagic cloud builds.

### Build Process
1. CodeMagic automatically builds the iOS app
2. Uses Capacitor to wrap the web app as native iOS
3. Generates .ipa file for App Store submission

### Requirements
- Apple Developer Account
- iOS Distribution Certificate
- App Store Provisioning Profile

## Local Development

```bash
npm install
npm run dev
```

## Building for iOS

```bash
npm run build
npx cap sync ios
npx cap open ios
```

## License

© 2025 Adaptalyfe. All rights reserved.