import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, Check, Clock, Star, Zap, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: string;
  scheduledFor: string;
  createdAt: string;
  relatedId?: number;
}

interface UserPreferences {
  notificationSettings: {
    pushEnabled: boolean;
    soundEnabled: boolean;
    reminderFrequency: string;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  reminderTiming: {
    taskReminders: number; // minutes before due
    appointmentReminders: number;
    medicationReminders: number;
  };
}

export function SmartNotifications() {
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  // Fetch notifications
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['/api/notifications']
  });

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ['/api/user-preferences']
  });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: Notification) => !n.isRead).length : 0;

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  // Update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>) => {
      return await apiRequest('PUT', '/api/user-preferences', newPreferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-preferences'] });
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved."
      });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task_reminder': return <Clock className="h-4 w-4" />;
      case 'achievement': return <Star className="h-4 w-4" />;
      case 'streak': return <Zap className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (showSettings) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSettings(false)}
              className="ml-auto"
            >
              Back to Notifications
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">General Settings</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Push Notifications</label>
                <p className="text-sm text-gray-600">Receive notifications on your device</p>
              </div>
              <Switch 
                checked={preferences?.notificationSettings?.pushEnabled || false}
                onCheckedChange={(checked) => 
                  updatePreferencesMutation.mutate({
                    notificationSettings: {
                      ...preferences?.notificationSettings,
                      pushEnabled: checked
                    }
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  {preferences?.notificationSettings?.soundEnabled ? 
                    <Volume2 className="h-4 w-4" /> : 
                    <VolumeX className="h-4 w-4" />
                  }
                  Sound Alerts
                </label>
                <p className="text-sm text-gray-600">Play sound for important notifications</p>
              </div>
              <Switch 
                checked={preferences?.notificationSettings?.soundEnabled || false}
                onCheckedChange={(checked) => 
                  updatePreferencesMutation.mutate({
                    notificationSettings: {
                      ...preferences?.notificationSettings,
                      soundEnabled: checked
                    }
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Reminder Timing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Task Reminders</label>
                <Select 
                  value={preferences?.reminderTiming?.taskReminders?.toString() || "15"}
                  onValueChange={(value) => 
                    updatePreferencesMutation.mutate({
                      reminderTiming: {
                        ...preferences?.reminderTiming,
                        taskReminders: parseInt(value)
                      }
                    })
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
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Appointment Reminders</label>
                <Select 
                  value={preferences?.reminderTiming?.appointmentReminders?.toString() || "60"}
                  onValueChange={(value) => 
                    updatePreferencesMutation.mutate({
                      reminderTiming: {
                        ...preferences?.reminderTiming,
                        appointmentReminders: parseInt(value)
                      }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="120">2 hours before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Medication Reminders</label>
                <Select 
                  value={preferences?.reminderTiming?.medicationReminders?.toString() || "10"}
                  onValueChange={(value) => 
                    updatePreferencesMutation.mutate({
                      reminderTiming: {
                        ...preferences?.reminderTiming,
                        medicationReminders: parseInt(value)
                      }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes before</SelectItem>
                    <SelectItem value="10">10 minutes before</SelectItem>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Smart Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSettings(true)}
            className="ml-auto"
          >
            Settings
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No notifications yet</p>
            <p className="text-sm text-gray-500">We'll notify you about important tasks and achievements</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification: Notification) => (
              <div 
                key={notification.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  notification.isRead 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-white border-blue-200 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className={`font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {formatTime(notification.createdAt)}
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markReadMutation.mutate(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {notification.type.replace('_', ' ')}
                      </Badge>
                      {notification.priority !== 'normal' && (
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}