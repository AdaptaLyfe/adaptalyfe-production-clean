import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, CheckCircle, AlertCircle, Settings } from "lucide-react";

interface TaskReminder {
  id: number;
  taskId: number;
  taskTitle: string;
  scheduledTime: string;
  reminderSent: boolean;
  isCompleted: boolean;
  category: string;
  estimatedMinutes: number;
  pointValue: number;
}

export default function TaskReminders() {
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  // Fetch user's tasks with scheduled times
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["/api/daily-tasks"],
  });

  // Fetch user preferences for reminder settings
  const { data: preferences } = useQuery({
    queryKey: ["/api/user-preferences"],
  });

  // Filter tasks that have scheduled times
  const scheduledTasks = tasks.filter((task: any) => task.scheduledTime);

  // Update reminder preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: any) => {
      return await apiRequest('PUT', '/api/user-preferences', newPreferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-preferences'] });
      toast({
        title: "Settings Updated",
        description: "Your reminder preferences have been saved."
      });
    }
  });

  // Test reminder functionality
  const testReminderMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/test-reminder');
    },
    onSuccess: () => {
      toast({
        title: "Test Reminder Sent",
        description: "Check your notifications for the test reminder."
      });
    }
  });

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTaskStatusBadge = (task: any) => {
    if (task.isCompleted) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (task.scheduledTime <= currentTime) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    return <Badge variant="secondary">Pending</Badge>;
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Reminder Settings
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSettings(false)}
                className="ml-auto"
              >
                Back to Reminders
              </Button>
            </CardTitle>
            <CardDescription>
              Configure how and when you receive task reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Reminder Settings</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Enable Task Reminders</label>
                  <p className="text-sm text-gray-600">Receive notifications when tasks are due</p>
                </div>
                <Switch 
                  checked={preferences?.reminderTiming?.taskReminders !== false}
                  onCheckedChange={(checked) => 
                    updatePreferencesMutation.mutate({
                      reminderTiming: {
                        ...preferences?.reminderTiming,
                        taskReminders: checked ? 5 : false
                      }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Overdue Notifications</label>
                  <p className="text-sm text-gray-600">Get notified if tasks become overdue</p>
                </div>
                <Switch 
                  checked={preferences?.reminderTiming?.overdueReminders !== false}
                  onCheckedChange={(checked) => 
                    updatePreferencesMutation.mutate({
                      reminderTiming: {
                        ...preferences?.reminderTiming,
                        overdueReminders: checked
                      }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Browser Notifications</label>
                  <p className="text-sm text-gray-600">Show notifications in your browser</p>
                </div>
                <Switch 
                  checked={preferences?.notificationSettings?.pushEnabled !== false}
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
            </div>

            <div className="pt-4">
              <Button
                onClick={() => testReminderMutation.mutate()}
                disabled={testReminderMutation.isPending}
                variant="outline"
              >
                {testReminderMutation.isPending ? "Sending..." : "Test Reminder"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Task Reminders</h1>
          <p className="text-gray-600 mt-2">
            Manage your scheduled tasks and reminder preferences
          </p>
        </div>
        <Button
          onClick={() => setShowSettings(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {scheduledTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Tasks</h3>
            <p className="text-gray-600 text-center mb-4">
              You don't have any tasks with specific times set. Add scheduled times to your tasks to receive reminders.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/daily-tasks'}>
              Go to Daily Tasks
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Scheduled Tasks ({scheduledTasks.length})
              </CardTitle>
              <CardDescription>
                Tasks with specific times will automatically send reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scheduledTasks
                  .sort((a: any, b: any) => a.scheduledTime.localeCompare(b.scheduledTime))
                  .map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {task.isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                        )}
                        
                        <div>
                          <h4 className={`font-medium ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{formatTime(task.scheduledTime)}</span>
                            <span>•</span>
                            <span>{task.estimatedMinutes} min</span>
                            {task.pointValue > 0 && (
                              <>
                                <span>•</span>
                                <span>{task.pointValue} points</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="capitalize">{task.category.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getTaskStatusBadge(task)}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How Reminders Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div>
                    <strong>On-Time Reminders:</strong> You'll get a notification exactly when your task is scheduled
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                  <div>
                    <strong>Overdue Alerts:</strong> If a task isn't completed 30 minutes after its scheduled time, you'll get a gentle reminder
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div>
                    <strong>Smart Timing:</strong> Reminders are sent only once per day to avoid notification spam
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}