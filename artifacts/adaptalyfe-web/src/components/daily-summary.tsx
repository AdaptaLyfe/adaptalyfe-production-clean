import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import type { DailyTask, Bill, MoodEntry } from "@shared/schema";

export default function DailySummary() {
  const { data: tasksData } = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks"],
  });

  const { data: billsData } = useQuery<Bill[]>({
    queryKey: ["/api/bills"],
  });

  const { data: todayMood } = useQuery<MoodEntry>({
    queryKey: ["/api/mood-entries/today"],
  });

  // Ensure we always have arrays, even if API returns null
  const tasks = Array.isArray(tasksData) ? tasksData : [];
  const bills = Array.isArray(billsData) ? billsData : [];

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Filter today's tasks and upcoming items
  const todayDailyTasks = tasks.filter(task => 
    (task.frequency === 'daily' || !task.frequency) && !task.isCompleted
  );

  const weeklyTasksDueSoon = tasks.filter(task => {
    if (task.frequency !== 'weekly' || task.isCompleted || !task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 2 && diffDays >= 0;
  });

  const billsDueSoon = bills.filter(bill => {
    if (bill.isPaid) return false;
    const dueDate = new Date(bill.dueDate);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  });

  const completedToday = tasks.filter(task => {
    if (!task.completedAt) return false;
    const completedDate = new Date(task.completedAt);
    return completedDate.toDateString() === today.toDateString();
  });

  const totalDailyTasks = tasks.filter(task => task.frequency === 'daily' || !task.frequency).length;
  const dailyProgress = totalDailyTasks > 0 ? Math.round((completedToday.length / totalDailyTasks) * 100) : 0;

  const formatDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Today's Summary
        </CardTitle>
        <p className="text-sm text-gray-600">
          {today.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Progress */}
        <div className="bg-white/70 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Daily Progress
            </h3>
            <Badge 
              variant="secondary" 
              className={`${dailyProgress >= 80 ? 'bg-green-100 text-green-700' : 
                         dailyProgress >= 50 ? 'bg-yellow-100 text-yellow-700' : 
                         'bg-gray-100 text-gray-700'}`}
            >
              {dailyProgress}%
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {completedToday.length} of {totalDailyTasks} daily tasks completed
          </p>
        </div>

        {/* Today's Tasks */}
        {todayDailyTasks.length > 0 && (
          <div className="bg-white/70 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              Pending Daily Tasks ({todayDailyTasks.length})
            </h3>
            <div className="space-y-2">
              {todayDailyTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{task.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {task.category}
                    </Badge>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.estimatedMinutes}min
                    </span>
                  </div>
                </div>
              ))}
              {todayDailyTasks.length > 3 && (
                <Link href="/daily-tasks">
                  <Button variant="ghost" size="sm" className="text-xs w-full">
                    View {todayDailyTasks.length - 3} more tasks
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Deadlines */}
        {(weeklyTasksDueSoon.length > 0 || billsDueSoon.length > 0) && (
          <div className="bg-amber-50/70 p-4 rounded-lg border border-amber-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Upcoming Deadlines
            </h3>
            <div className="space-y-2">
              {weeklyTasksDueSoon.map((task) => (
                <div key={`task-${task.id}`} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{task.title}</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                    {formatDaysUntil(task.dueDate!)}
                  </Badge>
                </div>
              ))}
              {billsDueSoon.map((bill) => (
                <div key={`bill-${bill.id}`} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3 text-green-600" />
                    <span className="text-gray-700">{bill.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">${bill.amount}</span>
                    <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                      {formatDaysUntil(bill.dueDate.toString())}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Required Mood Check */}
        {!todayMood && (
          <div className="bg-red-50/70 p-4 rounded-lg border-2 border-red-300 ring-2 ring-red-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Required Daily Check-in
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  Complete your mood check-in to continue using Adaptalyfe
                </p>
              </div>
              <Link href="/mood-tracking">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 animate-bounce">
                  Complete Now
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* All Clear Message */}
        {todayDailyTasks.length === 0 && weeklyTasksDueSoon.length === 0 && billsDueSoon.length === 0 && todayMood && (
          <div className="bg-green-50/70 p-4 rounded-lg border border-green-200 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold text-gray-800">All caught up!</h3>
            <p className="text-sm text-gray-600">No urgent tasks or deadlines today.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}