# Push Notifications Setup Guide (Optional)

This guide walks through adding push notification support to your Adaptalyfe mobile apps using Firebase Cloud Messaging (FCM).

---

## Why Push Notifications?

Push notifications allow you to:
- Send reminders for tasks and appointments
- Alert users about important updates
- Engage users who haven't opened the app recently
- Notify caregivers of important events

---

## Prerequisites

1. **Firebase Project** - You already have Firebase setup for the web app
2. **Apple Developer Account** - For iOS push certificates
3. **Google Play Console Account** - Already registered
4. **Capacitor Push Notifications Plugin** - Will be installed

---

## Step 1: Install Capacitor Push Notifications Plugin

```bash
npm install @capacitor/push-notifications
npx cap sync
```

---

## Step 2: Firebase Configuration

### iOS Setup (APNs - Apple Push Notification service)

1. **Generate APNs Key in Apple Developer Account:**
   - Go to https://developer.apple.com/account
   - Certificates, Identifiers & Profiles → Keys
   - Click "+" to create new key
   - Name: "Adaptalyfe Push Notifications"
   - Enable "Apple Push Notifications service (APNs)"
   - Download the `.p8` file (SAVE IT - you can only download once!)
   - Note the Key ID

2. **Upload APNs Key to Firebase:**
   - Firebase Console → Project Settings
   - Cloud Messaging tab
   - iOS app section → APNs Certificates
   - Upload APNs Authentication Key (.p8 file)
   - Enter Key ID and Team ID (from Apple Developer account)

### Android Setup (FCM)

1. **Get FCM Server Key:**
   - Firebase Console → Project Settings
   - Cloud Messaging tab
   - Copy "Server key" (or create new one)
   - Save for backend implementation

2. **Download google-services.json:**
   - Firebase Console → Project Settings
   - Your apps → Android app
   - Download `google-services.json`
   - Place in: `android/app/google-services.json`

3. **Update Android build files:**
   
   **`android/build.gradle`:**
   ```gradle
   buildscript {
       dependencies {
           classpath 'com.google.gms:google-services:4.4.0'
       }
   }
   ```
   
   **`android/app/build.gradle`:**
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   
   dependencies {
       implementation 'com.google.firebase:firebase-messaging:23.4.0'
   }
   ```

---

## Step 3: Update Native Configurations

### iOS - Info.plist

Already added in the iOS configuration, but verify:

```xml
<key>FirebaseAppDelegateProxyEnabled</key>
<false/>
```

### iOS - AppDelegate.swift

You may need to customize iOS push handling. Open Xcode:

```bash
npx cap open ios
```

In `ios/App/App/AppDelegate.swift`, Capacitor handles most of it automatically.

### Android - AndroidManifest.xml

Already added permissions, but verify these exist:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.INTERNET" />
```

---

## Step 4: Frontend Implementation

### Create Push Notification Service

**`client/src/lib/pushNotifications.ts`:**

```typescript
import { PushNotifications } from '@capacitor/push-notifications';
import { isMobilePlatform } from './mobile';

export async function initPushNotifications() {
  // Only run on mobile platforms
  if (!isMobilePlatform()) {
    console.log('Push notifications only available on mobile');
    return;
  }

  try {
    // Request permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Push notification permission denied');
      return;
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for registration success
    await PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      // Send token to your backend
      sendTokenToBackend(token.value);
    });

    // Listen for registration errors
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Listen for push notifications received
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('Push received: ' + JSON.stringify(notification));
        // Handle notification when app is in foreground
        showInAppNotification(notification);
      }
    );

    // Listen for push notification actions (tapped)
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
        // Handle notification tap - navigate to relevant screen
        handleNotificationTap(notification);
      }
    );
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
}

async function sendTokenToBackend(token: string) {
  try {
    await fetch('/api/push-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch (error) {
    console.error('Error sending token to backend:', error);
  }
}

function showInAppNotification(notification: any) {
  // Show toast or custom in-app notification
  // You can use your existing toast system
  console.log('Show in-app notification:', notification);
}

function handleNotificationTap(notification: any) {
  // Navigate based on notification data
  const data = notification.notification.data;
  
  if (data.route) {
    // Navigate to the route specified in notification
    window.location.href = data.route;
  }
}

export async function getPushToken(): Promise<string | null> {
  if (!isMobilePlatform()) return null;
  
  try {
    const result = await PushNotifications.getDeliveredNotifications();
    // Implementation depends on your needs
    return null;
  } catch {
    return null;
  }
}
```

### Initialize in Your App

**Update `client/src/main.tsx`:**

```typescript
import { initMobile } from './lib/mobile';
import { initPushNotifications } from './lib/pushNotifications';

async function initializeApp() {
  await initMobile();
  
  // Initialize push notifications after mobile is ready
  if (isMobilePlatform()) {
    await initPushNotifications();
  }
}

initializeApp();
```

---

## Step 5: Backend Implementation

### Store Push Tokens

**Update `shared/schema.ts`:**

```typescript
export const pushTokens = pgTable('push_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  token: text('token').notNull(),
  platform: text('platform').notNull(), // 'ios' or 'android'
  createdAt: timestamp('created_at').defaultNow(),
});
```

### API Route to Store Tokens

**In `server/routes.ts`:**

```typescript
app.post('/api/push-token', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { token } = req.body;
  const platform = req.headers['user-agent']?.includes('iOS') ? 'ios' : 'android';

  try {
    // Store or update token
    await storage.upsertPushToken({
      userId: req.user.id,
      token,
      platform,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to store push token' });
  }
});
```

### Send Push Notifications

**Create `server/services/pushNotifications.ts`:**

```typescript
import admin from 'firebase-admin';

// Initialize Firebase Admin (do this once in your server startup)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error };
  }
}

export async function sendBatchNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const message = {
    notification: {
      title,
      body,
    },
    data: data || {},
    tokens, // Up to 500 tokens per batch
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(response.successCount + ' messages were sent successfully');
    return response;
  } catch (error) {
    console.error('Error sending batch messages:', error);
    throw error;
  }
}
```

### Example: Send Task Reminder

```typescript
// In your scheduled job or reminder service
import { sendPushNotification } from './services/pushNotifications';

async function sendTaskReminder(userId: number, taskId: number, taskTitle: string) {
  // Get user's push tokens
  const tokens = await storage.getPushTokensByUserId(userId);
  
  for (const tokenRecord of tokens) {
    await sendPushNotification(
      tokenRecord.token,
      'Task Reminder',
      `Don't forget: ${taskTitle}`,
      {
        type: 'task_reminder',
        taskId: taskId.toString(),
        route: `/tasks/${taskId}`,
      }
    );
  }
}
```

---

## Step 6: Testing Push Notifications

### Test on iOS

1. **Build and run on real device** (push doesn't work on simulator):
   ```bash
   npx cap open ios
   # Select your device in Xcode
   # Run the app
   ```

2. **Grant permission** when prompted

3. **Send test notification from Firebase Console:**
   - Firebase Console → Cloud Messaging
   - Send test message
   - Paste FCM token from console logs

### Test on Android

1. **Build and run:**
   ```bash
   npx cap open android
   # Run on emulator or device
   ```

2. **Send test notification:**
   - Same as iOS - use Firebase Console
   - Or use your backend API

### Test from Backend

```bash
# Using curl
curl -X POST http://localhost:5000/api/send-test-notification \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "title": "Test", "body": "Hello!"}'
```

---

## Step 7: Advanced Features

### Custom Notification Sounds (iOS)

1. Add sound file to Xcode project
2. Update notification payload:
   ```typescript
   {
     notification: {
       title: 'Task Reminder',
       body: 'Complete your task!',
       sound: 'custom_sound.wav'
     }
   }
   ```

### Notification Channels (Android)

```typescript
// In your Android app
import { PushNotifications } from '@capacitor/push-notifications';

await PushNotifications.createChannel({
  id: 'task-reminders',
  name: 'Task Reminders',
  description: 'Notifications for task reminders',
  importance: 5,
  visibility: 1,
  sound: 'custom_sound.wav',
});
```

### Rich Notifications (Images)

```typescript
{
  notification: {
    title: 'New Achievement!',
    body: 'You earned a badge',
    image: 'https://yourdomain.com/badge.png'
  }
}
```

---

## Troubleshooting

### iOS Issues

**"No valid APNs certificate"**
- Verify .p8 file is uploaded to Firebase
- Check Key ID and Team ID are correct
- Ensure bundle ID matches

**"Notifications not received"**
- Test on real device (not simulator)
- Check permission is granted
- Verify app is not in Do Not Disturb mode

### Android Issues

**"google-services.json not found"**
- Ensure file is in `android/app/` directory
- Rebuild: `cd android && ./gradlew clean`

**"Token not registering"**
- Check Firebase project ID matches
- Verify google-services.json is correct
- Check Play Services are updated on device

### General

**"Token becomes invalid"**
- Tokens can expire - implement token refresh
- Store tokens with timestamp, refresh periodically
- Handle registration errors and re-register

---

## Environment Variables

Add these to your `.env`:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"

# FCM Server Key (for Android)
FCM_SERVER_KEY=your-fcm-server-key
```

---

## Best Practices

1. **Permission Timing**: Ask for permission at meaningful moments (after user sees value)
2. **Token Management**: Refresh tokens periodically, handle device changes
3. **User Preferences**: Let users control notification types and frequency
4. **Rate Limiting**: Don't spam users with too many notifications
5. **Analytics**: Track notification open rates and engagement
6. **Fallback**: Always have web notifications as fallback for web users

---

## Summary

With push notifications, your Adaptalyfe app can:
- ✅ Send task and appointment reminders
- ✅ Alert users about important events
- ✅ Engage users with personalized messages
- ✅ Notify caregivers of critical updates

The setup integrates seamlessly with your existing Firebase infrastructure and works across both iOS and Android platforms.

---

## Optional: Implement Later

This feature is optional and can be added after initial app launch:
- Launch app without push notifications first
- Gather user feedback on desired notification types
- Implement push based on actual user needs
- Update app with new version including push support

Push notifications require Firebase Admin SDK setup and ongoing server management, so consider starting simple and adding this feature based on user demand.
