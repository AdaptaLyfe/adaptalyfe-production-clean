import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { DailyTask, Bill } from "@shared/schema";

interface NotificationItem {
  id: string;
  type: 'task' | 'bill' | 'achievement';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  actionUrl?: string;
}

export function useNotifications() {
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const { data: tasks = [] } = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks"],
  });

  const { data: bills = [] } = useQuery<Bill[]>({
    queryKey: ["/api/bills"],
  });

  const { data: todayMood } = useQuery<any>({
    queryKey: ["/api/mood-entries/today"],
  });

  // Request notification permission
  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setHasPermission(permission);
      return permission === 'granted';
    }
    return false;
  };

  // Check current permission status
  useEffect(() => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission);
    }
  }, []);

  // Generate notifications from tasks and bills
  useEffect(() => {
    if (!tasks.length && !bills.length) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const newNotifications: NotificationItem[] = [];

    // Daily task reminders (show in morning if not completed)
    const incompleteDailyTasks = tasks.filter(task => 
      (task.frequency === 'daily' || !task.frequency) && !task.isCompleted
    );
    
    if (incompleteDailyTasks.length > 0) {
      newNotifications.push({
        id: 'daily-tasks-reminder',
        type: 'task',
        title: 'Daily Tasks Ready',
        message: `You have ${incompleteDailyTasks.length} daily tasks to complete today`,
        priority: 'medium',
        actionUrl: '/daily-tasks'
      });
    }

    // Weekly task due date reminders
    const weeklyTasksDue = tasks.filter(task => {
      if (task.frequency !== 'weekly' || task.isCompleted || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate <= threeDaysLater && dueDate >= today;
    });

    weeklyTasksDue.forEach(task => {
      const dueDate = new Date(task.dueDate!);
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      newNotifications.push({
        id: `weekly-task-${task.id}`,
        type: 'task',
        title: `Weekly Task Due ${daysUntil === 0 ? 'Today' : `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}`,
        message: task.title,
        priority: daysUntil <= 1 ? 'high' : 'medium',
        dueDate,
        actionUrl: '/daily-tasks'
      });
    });

    // Monthly task due date reminders  
    const monthlyTasksDue = tasks.filter(task => {
      if (task.frequency !== 'monthly' || task.isCompleted || !task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return dueDate <= weekFromNow && dueDate >= today;
    });

    monthlyTasksDue.forEach(task => {
      const dueDate = new Date(task.dueDate!);
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      newNotifications.push({
        id: `monthly-task-${task.id}`,
        type: 'task',
        title: `Monthly Task Due ${daysUntil === 0 ? 'Today' : `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}`,
        message: task.title,
        priority: daysUntil <= 3 ? 'high' : 'medium',
        dueDate,
        actionUrl: '/daily-tasks'
      });
    });

    // Bill due date reminders
    const upcomingBills = bills.filter(bill => {
      if (bill.isPaid) return false;
      const dueDate = new Date(bill.dueDate);
      return dueDate <= threeDaysLater && dueDate >= today;
    });

    upcomingBills.forEach(bill => {
      const dueDate = new Date(bill.dueDate);
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      newNotifications.push({
        id: `bill-${bill.id}`,
        type: 'bill',
        title: `Bill Due ${daysUntil === 0 ? 'Today' : `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}`,
        message: `${bill.name} - $${bill.amount}`,
        priority: daysUntil <= 1 ? 'high' : 'medium',
        dueDate,
        actionUrl: '/financial'
      });
    });

    // Mood check-in requirement (highest priority)
    if (!todayMood) {
      newNotifications.push({
        id: 'mood-checkin-required',
        type: 'task',
        title: 'Daily Check-in Required',
        message: 'Complete your daily mood check-in to continue',
        priority: 'high',
        actionUrl: '/mood-tracking'
      });
    }

    // Achievement notifications (completed streaks, milestones)
    const completedToday = tasks.filter(task => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= today && completedDate < tomorrow;
    });

    if (completedToday.length >= 5) {
      newNotifications.push({
        id: 'productivity-achievement',
        type: 'achievement',
        title: 'Great Progress!',
        message: `You've completed ${completedToday.length} tasks today. Keep it up!`,
        priority: 'low'
      });
    }

    setNotifications(newNotifications);
  }, [tasks, bills]);

  // Send browser notifications for high priority items
  useEffect(() => {
    if (hasPermission !== 'granted') return;

    const highPriorityNotifications = notifications.filter(n => n.priority === 'high');
    
    highPriorityNotifications.forEach(notification => {
      // Check if we've already shown this notification recently
      const lastShown = localStorage.getItem(`notification-${notification.id}`);
      const now = Date.now();
      
      if (!lastShown || now - parseInt(lastShown) > 6 * 60 * 60 * 1000) { // 6 hours
        new Notification(notification.title, {
          body: notification.message,
          icon: '/generated-icon.png',
          tag: notification.id
        });
        
        localStorage.setItem(`notification-${notification.id}`, now.toString());
      }
    });
  }, [notifications, hasPermission]);

  // Show in-app toast notifications for new items
  useEffect(() => {
    notifications.forEach(notification => {
      const key = `toast-shown-${notification.id}`;
      const today = new Date().toDateString();
      const lastShown = localStorage.getItem(key);
      
      if (lastShown !== today) {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.priority === 'high' ? 'destructive' : 'default',
        });
        
        localStorage.setItem(key, today);
      }
    });
  }, [notifications, toast]);

  return {
    notifications,
    hasPermission,
    requestPermission,
    unreadCount: notifications.length,
    highPriorityCount: notifications.filter(n => n.priority === 'high').length
  };
}