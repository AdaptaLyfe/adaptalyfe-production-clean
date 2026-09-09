---
name: Flutter native notifications
description: Boundary between native notification delivery and server notification state.
---

Native notifications are owned by a platform service for permissions, Firebase Messaging, foreground/background presentation, tap routing, and local scheduling. Server notification list/read state remains in the notification repository and BLoC.

**Why:** The existing backend has notification list/read routes but no device-token registration or FCM send route. Sending tokens to an invented endpoint would silently fail and couple transport to business state.

**How to apply:** Keep local medication, appointment, check-in, and emergency reminders in the native service. Add a backend token contract only if server-driven remote delivery becomes an explicit requirement.