import { Bell, BellRing, Clock, DollarSign, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import { Link } from "wouter";

export default function NotificationCenter() {
  const { notifications, hasPermission, requestPermission, unreadCount, highPriorityCount } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'bill':
        return <DollarSign className="w-4 h-4 text-red-600" />;
      case 'achievement':
        return <Star className="w-4 h-4 text-yellow-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeUntil = (dueDate?: Date) => {
    if (!dueDate) return '';
    const now = new Date();
    const diffHours = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours <= 0) return 'Now';
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.ceil(diffHours / 24);
    return `${diffDays}d`;
  };

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            {highPriorityCount > 0 ? (
              <BellRing className="w-4 h-4 text-red-500" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                {hasPermission !== 'granted' && (
                  <Button
                    onClick={requestPermission}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    Enable Browser Alerts
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">All caught up!</p>
                  <p className="text-xs text-gray-400">No new notifications</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-4 hover:bg-gray-50 transition-colors ${
                        notification.priority === 'high' 
                          ? 'border-red-400 bg-red-50/50' 
                          : notification.priority === 'medium'
                          ? 'border-amber-400 bg-amber-50/50'
                          : 'border-blue-400 bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </h4>
                            {notification.dueDate && (
                              <Badge
                                variant="secondary"
                                className={`text-xs ml-2 ${getPriorityColor(notification.priority)}`}
                              >
                                {formatTimeUntil(notification.dueDate)}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.actionUrl && (
                            <Link href={notification.actionUrl}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs mt-2 h-6 px-2"
                              >
                                View Details
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}