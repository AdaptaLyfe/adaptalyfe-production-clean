import { useState, useEffect } from "react";
import { Bell, X, Calendar, Pill, AlertTriangle, CheckCircle, Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NotificationPreferences {
  browserNotifications: boolean;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  billDueReminders: boolean;
  taskReminders: boolean;
  reminderTime: string; // minutes before due
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface Notification {
  id: string;
  type: 'medication' | 'appointment' | 'bill' | 'task' | 'achievement' | 'emergency';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  dueDate?: Date;
}

export function EnhancedNotificationSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    browserNotifications: false,
    medicationReminders: true,
    appointmentReminders: true,
    billDueReminders: true,
    taskReminders: true,
    reminderTime: "30",
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00"
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPreferences(prev => ({
        ...prev,
        browserNotifications: permission === 'granted'
      }));
      return permission === 'granted';
    }
    return false;
  };

  // Load preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('notificationPreferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
  };

  // Generate notifications based on app data
  const generateNotifications = () => {
    const now = new Date();
    const reminderMinutes = parseInt(preferences.reminderTime);
    const newNotifications: Notification[] = [];

    // Check medications (demo data)
    if (preferences.medicationReminders) {
      newNotifications.push({
        id: 'med-1',
        type: 'medication',
        title: 'Medication Reminder',
        message: 'Time to take your Sertraline (50mg)',
        priority: 'high',
        timestamp: now,
        isRead: false,
        dueDate: new Date(now.getTime() + 30 * 60000) // 30 minutes from now
      });
    }

    // Check appointments
    if (preferences.appointmentReminders) {
      newNotifications.push({
        id: 'appt-1',
        type: 'appointment',
        title: 'Upcoming Appointment',
        message: 'Therapy session with Dr. Smith tomorrow at 2:00 PM',
        priority: 'medium',
        timestamp: now,
        isRead: false,
        actionUrl: '/calendar'
      });
    }

    // Check bills
    if (preferences.billDueReminders) {
      newNotifications.push({
        id: 'bill-1',
        type: 'bill',
        title: 'Bill Due Soon',
        message: 'Phone bill ($65.00) is due in 3 days',
        priority: 'medium',
        timestamp: now,
        isRead: false,
        actionUrl: '/financial'
      });
    }

    // Check tasks
    if (preferences.taskReminders) {
      newNotifications.push({
        id: 'task-1',
        type: 'task',
        title: 'Daily Task Reminder',
        message: 'Don\'t forget to complete your homework - Math',
        priority: 'medium',
        timestamp: now,
        isRead: false,
        actionUrl: '/daily-tasks'
      });
    }

    setNotifications(newNotifications);
  };

  // Show browser notification
  const showBrowserNotification = (notification: Notification) => {
    if (!preferences.browserNotifications || !('Notification' in window)) return;

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const startTime = parseTime(preferences.quietHours.start);
      const endTime = parseTime(preferences.quietHours.end);
      
      if (startTime > endTime) { // Overnight quiet hours
        if (currentTime >= startTime || currentTime <= endTime) return;
      } else { // Same day quiet hours
        if (currentTime >= startTime && currentTime <= endTime) return;
      }
    }

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent'
    });

    browserNotification.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      browserNotification.close();
    };
  };

  const parseTime = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Generate notifications on component mount and periodically
  useEffect(() => {
    generateNotifications();
    const interval = setInterval(generateNotifications, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [preferences]);

  // Show browser notifications for new notifications
  useEffect(() => {
    notifications.forEach(notification => {
      if (!notification.isRead && notification.priority !== 'low') {
        showBrowserNotification(notification);
      }
    });
  }, [notifications, preferences.browserNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medication': return <Pill className="w-4 h-4" />;
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'bill': return <AlertTriangle className="w-4 h-4" />;
      case 'task': return <CheckCircle className="w-4 h-4" />;
      case 'achievement': return <CheckCircle className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (showSettings) {
    return (
      <Card className="w-96">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Notification Settings
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Browser Notifications</span>
              <Switch
                checked={preferences.browserNotifications}
                onCheckedChange={(checked) => {
                  if (checked) {
                    requestNotificationPermission().then((granted) => {
                      savePreferences({ ...preferences, browserNotifications: granted });
                    });
                  } else {
                    savePreferences({ ...preferences, browserNotifications: false });
                  }
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Medication Reminders</span>
              <Switch
                checked={preferences.medicationReminders}
                onCheckedChange={(checked) => 
                  savePreferences({ ...preferences, medicationReminders: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Appointment Reminders</span>
              <Switch
                checked={preferences.appointmentReminders}
                onCheckedChange={(checked) => 
                  savePreferences({ ...preferences, appointmentReminders: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Bill Due Reminders</span>
              <Switch
                checked={preferences.billDueReminders}
                onCheckedChange={(checked) => 
                  savePreferences({ ...preferences, billDueReminders: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Task Reminders</span>
              <Switch
                checked={preferences.taskReminders}
                onCheckedChange={(checked) => 
                  savePreferences({ ...preferences, taskReminders: checked })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reminder Time</label>
            <Select
              value={preferences.reminderTime}
              onValueChange={(value) => 
                savePreferences({ ...preferences, reminderTime: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes before</SelectItem>
                <SelectItem value="15">15 minutes before</SelectItem>
                <SelectItem value="30">30 minutes before</SelectItem>
                <SelectItem value="60">1 hour before</SelectItem>
                <SelectItem value="1440">1 day before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Quiet Hours</span>
              <Switch
                checked={preferences.quietHours.enabled}
                onCheckedChange={(checked) => 
                  savePreferences({ 
                    ...preferences, 
                    quietHours: { ...preferences.quietHours, enabled: checked }
                  })
                }
              />
            </div>
            
            {preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <input
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => 
                      savePreferences({
                        ...preferences,
                        quietHours: { ...preferences.quietHours, start: e.target.value }
                      })
                    }
                    className="w-full p-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <input
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => 
                      savePreferences({
                        ...preferences,
                        quietHours: { ...preferences.quietHours, end: e.target.value }
                      })
                    }
                    className="w-full p-1 text-sm border rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative touch-manipulation min-h-[44px]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-96 max-h-96 overflow-hidden z-50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount}</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0 max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-border hover:bg-accent cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 flex-1">
                        <div className={`p-1 rounded-full ${getPriorityColor(notification.priority)} text-white`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {notification.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}