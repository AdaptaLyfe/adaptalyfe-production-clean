// Push notification service for Adaptalyfe mobile app
import { useState, useEffect } from 'react';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

class NotificationService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  
  // Initialize notification service
  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }
    
    try {
      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }
  
  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, default: false };
    }
    
    const permission = await Notification.requestPermission();
    
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }
  
  // Schedule local notification (for medications, appointments)
  scheduleLocalNotification(title: string, body: string, scheduledTime: Date, tag?: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    
    const now = new Date().getTime();
    const scheduleTime = scheduledTime.getTime();
    const delay = scheduleTime - now;
    
    if (delay > 0) {
      setTimeout(() => {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: tag || 'skillbridge-notification',
          requireInteraction: true,
          actions: [
            { action: 'view', title: 'View Details' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        });
      }, delay);
    }
  }
  
  // Schedule medication reminder
  scheduleMedicationReminder(medicationName: string, time: Date) {
    this.scheduleLocalNotification(
      'Medication Reminder',
      `Time to take your ${medicationName}`,
      time,
      `medication-${medicationName}`
    );
  }
  
  // Schedule appointment reminder
  scheduleAppointmentReminder(appointmentTitle: string, time: Date) {
    // Remind 1 hour before
    const reminderTime = new Date(time.getTime() - 60 * 60 * 1000);
    
    this.scheduleLocalNotification(
      'Appointment Reminder',
      `${appointmentTitle} in 1 hour`,
      reminderTime,
      `appointment-${appointmentTitle}`
    );
  }
  
  // Schedule daily check-in reminder
  scheduleDailyCheckIn(time: Date = new Date()) {
    // Set for tomorrow at same time if time has passed today
    const tomorrow = new Date(time);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.scheduleLocalNotification(
      'Daily Check-in',
      'How are you feeling today? Remember to complete your mood check.',
      tomorrow,
      'daily-checkin'
    );
  }
  
  // Emergency notification (immediate)
  sendEmergencyNotification(message: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SkillBridge Emergency Alert', {
        body: message,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'emergency',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200]
      });
    }
  }
  
  // Get notification permission status
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, default: false };
    }
    
    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }
}

export const notificationService = new NotificationService();

// Hook for notification management
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    notificationService.getPermissionStatus()
  );
  
  const requestPermission = async () => {
    const newPermission = await notificationService.requestPermission();
    setPermission(newPermission);
    return newPermission;
  };
  
  useEffect(() => {
    // Initialize notification service
    notificationService.initialize();
  }, []);
  
  return {
    permission,
    requestPermission,
    scheduleLocalNotification: notificationService.scheduleLocalNotification.bind(notificationService),
    scheduleMedicationReminder: notificationService.scheduleMedicationReminder.bind(notificationService),
    scheduleAppointmentReminder: notificationService.scheduleAppointmentReminder.bind(notificationService),
    scheduleDailyCheckIn: notificationService.scheduleDailyCheckIn.bind(notificationService),
    sendEmergencyNotification: notificationService.sendEmergencyNotification.bind(notificationService)
  };
}