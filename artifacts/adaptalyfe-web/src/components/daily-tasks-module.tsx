import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Star, Info, ListChecks, Calendar, Clock } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatTimeAgo } from "@/lib/utils";
import type { DailyTask } from "@shared/schema";

export default function DailyTasksModule() {
  const { toast } = useToast();
  
  const { data: tasks = [], isLoading } = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks"],
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, isCompleted }: { taskId: number; isCompleted: boolean }) => {
      return apiRequest("PATCH", `/api/daily-tasks/${taskId}/complete`, { isCompleted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      toast({
        title: "Task updated",
        description: "Task completion status has been updated.",
      });
    },
  });

  const toggleTask = (task: DailyTask) => {
    toggleTaskMutation.mutate({
      taskId: task.id,
      isCompleted: !task.isCompleted,
    });
  };

  // Group tasks by frequency
  const dailyTasks = tasks.filter(task => task.frequency === 'daily' || !task.frequency);
  const weeklyTasks = tasks.filter(task => task.frequency === 'weekly');
  const monthlyTasks = tasks.filter(task => task.frequency === 'monthly');

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return 'bg-blue-100 text-blue-700';
      case 'weekly':
        return 'bg-purple-100 text-purple-700';
      case 'monthly':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDueDate = (dueDate: Date | string | null) => {
    if (!dueDate) return null;
    const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const renderTaskList = (taskList: DailyTask[], showDueDate = false) => {
    const completedTasks = taskList.filter(task => task.isCompleted);
    const pendingTasks = taskList.filter(task => !task.isCompleted);

    return (
      <div className="space-y-4">
        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
              <Circle className="w-4 h-4 text-orange-500" />
              To Do ({pendingTasks.length})
            </h4>
            <div className="space-y-2">
              {pendingTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="bg-white/70 p-3 rounded-lg border border-white/50 hover:bg-white/90 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleTask(task)}
                        className="text-green-500 hover:text-green-600 transition-colors mt-0.5"
                        disabled={toggleTaskMutation.isPending}
                      >
                        <Circle className="w-4 h-4" />
                      </button>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-800 text-sm">{task.title}</h5>
                        <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className={`text-xs px-2 py-0 ${getFrequencyBadgeColor(task.frequency || 'daily')}`}>
                            {task.frequency || 'daily'}
                          </Badge>
                          <span className="text-xs px-2 py-0 bg-gray-100 text-gray-600 rounded">
                            {task.category}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedMinutes}min
                          </span>
                          {showDueDate && task.dueDate && (
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDueDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Completed ({completedTasks.length})
            </h4>
            <div className="space-y-2">
              {completedTasks.slice(0, 2).map((task) => (
                <div
                  key={task.id}
                  className="bg-green-50/50 p-3 rounded-lg border border-green-100"
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleTask(task)}
                      className="text-green-600 hover:text-gray-400 transition-colors mt-0.5"
                      disabled={toggleTaskMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <div>
                      <h5 className="font-medium text-gray-800 line-through text-sm">{task.title}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={`text-xs px-2 py-0 ${getFrequencyBadgeColor(task.frequency || 'daily')}`}>
                          {task.frequency || 'daily'}
                        </Badge>
                        {task.completedAt && (
                          <span className="text-xs text-gray-500">
                            Completed {formatTimeAgo(new Date(task.completedAt))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {taskList.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No tasks in this category yet.</p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ListChecks className="w-6 h-6 text-blue-600" />
          Task Management
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ListChecks className="w-6 h-6 text-blue-600" />
          Task Management
        </h2>
        <Link href="/daily-tasks">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Circle className="w-4 h-4" />
            Daily ({dailyTasks.length})
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Weekly ({weeklyTasks.length})
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Monthly ({monthlyTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {renderTaskList(dailyTasks)}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          {renderTaskList(weeklyTasks, true)}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          {renderTaskList(monthlyTasks, true)}
        </TabsContent>
      </Tabs>
    </div>
  );
}