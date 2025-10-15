import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Circle, Star, Plus, Clock, Edit3, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
import type { DailyTask } from "@shared/schema";

export default function DailyTasks() {
  const { isPremiumUser } = useSubscriptionEnforcement();
  
  // Block access if trial expired and no active subscription
  if (!isPremiumUser) {
    return (
      <div className="container mx-auto p-6">
        <PremiumFeaturePrompt
          title="Daily Task Management"
          description="Organize and track your daily tasks with reminders, categories, and progress tracking. Subscribe to continue using Adaptalyfe's core task management features."
          feature="tasks"
          requiredPlan="premium"
          className="max-w-md mx-auto mt-20"
        />
      </div>
    );
  }
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "personal_care",
    frequency: "daily",
    estimatedMinutes: "",
    pointValue: "",
    scheduledTime: ""
  });
  const [editTask, setEditTask] = useState({
    title: "",
    description: "",
    category: "personal_care",
    frequency: "daily",
    estimatedMinutes: "",
    pointValue: "",
    scheduledTime: ""
  });
  
  const { data: tasks = [], isLoading } = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      return apiRequest("POST", "/api/daily-tasks", taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      setIsAddDialogOpen(false);
      setNewTask({ title: "", description: "", category: "personal_care", frequency: "daily", estimatedMinutes: "", pointValue: "", scheduledTime: "" });
      toast({
        title: "Task created!",
        description: "New task added to your daily list",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, isCompleted, task }: { taskId: number; isCompleted: boolean; task?: any }) => {
      return apiRequest("PATCH", `/api/daily-tasks/${taskId}/complete`, { isCompleted });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points/balance"] });
      
      const { isCompleted, task } = variables;
      let description = "Great job staying on track!";
      
      if (isCompleted && task && task.pointValue > 0) {
        description = `Excellent! You earned ${task.pointValue} points for completing this task!`;
      }
      
      toast({
        title: isCompleted ? "Task completed!" : "Task updated!",
        description,
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: number; updates: any }) => {
      return apiRequest("PATCH", `/api/daily-tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      setIsEditDialogOpen(false);
      setEditingTask(null);
      toast({
        title: "Task updated!",
        description: "Your task has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive",
      });
      return;
    }
    createTaskMutation.mutate({
      ...newTask,
      pointValue: parseInt(newTask.pointValue as string) || 0,
      estimatedMinutes: parseInt(newTask.estimatedMinutes as string) || 15
    });
  };

  const handleEditTask = (task: DailyTask) => {
    setEditingTask(task);
    setEditTask({
      title: task.title,
      description: task.description || "",
      category: task.category,
      frequency: task.frequency || "daily",
      estimatedMinutes: task.estimatedMinutes?.toString() || "",
      pointValue: task.pointValue?.toString() || "",
      scheduledTime: task.scheduledTime || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = () => {
    if (!editTask.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive",
      });
      return;
    }
    if (editingTask) {
      updateTaskMutation.mutate({
        taskId: editingTask.id,
        updates: {
          ...editTask,
          pointValue: parseInt(editTask.pointValue as string) || 0,
          estimatedMinutes: parseInt(editTask.estimatedMinutes as string) || 15
        }
      });
    }
  };

  const completedTasks = (tasks || []).filter(task => task.isCompleted).length;
  const totalTasks = (tasks || []).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const tasksByCategory = (tasks || []).reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, DailyTask[]>);

  const categoryColors = {
    morning: "bg-sunny-orange",
    cooking: "bg-vibrant-green",
    organization: "bg-bright-blue",
    planning: "bg-happy-purple",
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Daily Tasks</h1>
        <Card className="border-t-4 border-vibrant-green">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Today's Progress</h3>
                <p className="text-sm sm:text-base text-gray-600">{completedTasks} of {totalTasks} tasks completed</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{progressPercentage}%</div>
                <p className="text-xs sm:text-sm text-gray-600">Complete</p>
              </div>
            </div>
            <div className="w-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full h-5 sm:h-6 shadow-inner border border-gray-400">
              <div 
                className="bg-gradient-to-r from-green-500 via-green-400 to-emerald-400 h-5 sm:h-6 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden border-2 border-green-600"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-200 to-transparent opacity-50"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-green-600/20 to-transparent"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
          <Card key={category} className="border-t-4 border-gray-200">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 ${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-400'} rounded-lg flex-shrink-0`}></div>
                <span className="capitalize text-base sm:text-lg">{category} Tasks</span>
                <span className="text-xs sm:text-sm font-normal text-gray-600">
                  ({categoryTasks.filter(t => t.isCompleted).length}/{categoryTasks.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {categoryTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-11 h-11 sm:w-12 sm:h-12 p-0 rounded-full flex items-center justify-center flex-shrink-0 ${
                        task.isCompleted
                          ? "bg-vibrant-green hover:bg-vibrant-green"
                          : "bg-green-500 hover:bg-vibrant-green"
                      }`}
                      onClick={() => toggleTaskMutation.mutate({ 
                        taskId: task.id, 
                        isCompleted: !task.isCompleted,
                        task: task
                      })}
                      disabled={toggleTaskMutation.isPending}
                      data-testid={`button-toggle-task-${task.id}`}
                    >
                      {task.isCompleted ? (
                        <CheckCircle className="text-white" size={20} />
                      ) : (
                        <Circle className="text-white" size={20} />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-gray-900 text-sm sm:text-base ${task.isCompleted ? 'line-through' : ''}`}>
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-400 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">{task.estimatedMinutes} min</span>
                        </div>
                        {task.frequency && task.frequency !== 'daily' && (
                          <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium whitespace-nowrap">
                            {task.frequency}
                          </span>
                        )}
                        {task.scheduledTime && (
                          <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-medium whitespace-nowrap">
                            {new Date(`2000-01-01T${task.scheduledTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                        {task.pointValue && task.pointValue > 0 && (
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-500 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs text-yellow-600 font-medium whitespace-nowrap">{task.pointValue} pts</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-11 h-11 sm:w-12 sm:h-12 p-0 hover:bg-blue-100 rounded-lg"
                        onClick={() => handleEditTask(task)}
                        data-testid={`button-edit-task-${task.id}`}
                      >
                        <Edit3 className="text-blue-600" size={18} />
                      </Button>
                      {task.isCompleted && (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-sunny-orange rounded-full flex items-center justify-center">
                          <Star className="text-white" size={18} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 sm:mt-8 text-center pb-4">
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          className="bg-vibrant-green hover:bg-green-600 text-black font-bold shadow-lg border border-green-700 w-full sm:w-auto"
          data-testid="button-add-task"
        >
          <Plus size={18} className="mr-2 text-black" />
          <span className="text-black font-bold">Add New Task</span>
        </Button>
      </div>

      {/* Add Task Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setIsAddDialogOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-start justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Add New Daily Task</h2>
                <button
                  onClick={() => setIsAddDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold -mt-1 w-11 h-11 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-testid="select-category-add"
                >
                  <option value="personal_care">Personal Care</option>
                  <option value="household">Household</option>
                  <option value="work">Work</option>
                  <option value="health">Health</option>
                  <option value="social">Social</option>
                  <option value="education">Education</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Frequency</label>
                <select
                  value={newTask.frequency}
                  onChange={(e) => setNewTask({ ...newTask, frequency: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-testid="select-frequency-add"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Scheduled Time (optional)</label>
                <Input
                  type="time"
                  placeholder="e.g., 10:00 AM"
                  value={newTask.scheduledTime}
                  onChange={(e) => setNewTask({ ...newTask, scheduledTime: e.target.value })}
                />
                <p className="text-xs text-gray-500">Leave blank for no specific time</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estimated Time (minutes)</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter minutes (e.g., 15, 30, 60)"
                  value={newTask.estimatedMinutes}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 1 && parseInt(value) <= 480)) {
                      setNewTask({ ...newTask, estimatedMinutes: value });
                    }
                  }}
                />
                <p className="text-xs text-gray-500">How long will this task take? (1-480 minutes)</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Point Value (awarded when completed)</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter points (0 for none)"
                  value={newTask.pointValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string or valid numbers 0-100
                    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 100)) {
                      setNewTask({ ...newTask, pointValue: value });
                    }
                  }}
                />
                <p className="text-xs text-gray-500">Enter any number 0-100, or leave empty for 0 points</p>
              </div>
              <div className="flex gap-2 sm:gap-3 pt-2">
                <Button 
                  onClick={handleCreateTask} 
                  disabled={createTaskMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-11"
                >
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
                <Button 
                  onClick={() => setIsAddDialogOpen(false)} 
                  variant="outline"
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Edit Task Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setIsEditDialogOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-start justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Task</h2>
                <button
                  onClick={() => setIsEditDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold -mt-1 w-11 h-11 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <Input
                placeholder="Task title"
                value={editTask.title}
                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
              />
              <Textarea
                placeholder="Description (optional)"
                value={editTask.description}
                onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  value={editTask.category}
                  onChange={(e) => setEditTask({ ...editTask, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-testid="select-category-edit"
                >
                  <option value="personal_care">Personal Care</option>
                  <option value="household">Household</option>
                  <option value="work">Work</option>
                  <option value="health">Health</option>
                  <option value="social">Social</option>
                  <option value="education">Education</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Frequency</label>
                <select
                  value={editTask.frequency}
                  onChange={(e) => setEditTask({ ...editTask, frequency: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-testid="select-frequency-edit"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Scheduled Time (optional)</label>
                <Input
                  type="time"
                  placeholder="e.g., 10:00 AM"
                  value={editTask.scheduledTime}
                  onChange={(e) => setEditTask({ ...editTask, scheduledTime: e.target.value })}
                />
                <p className="text-xs text-gray-500">Leave blank for no specific time</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estimated Time (minutes)</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter minutes (e.g., 15, 30, 60)"
                  value={editTask.estimatedMinutes}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 1 && parseInt(value) <= 480)) {
                      setEditTask({ ...editTask, estimatedMinutes: value });
                    }
                  }}
                />
                <p className="text-xs text-gray-500">How long will this task take? (1-480 minutes)</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Point Value (awarded when completed)</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter points (0 for none)"
                  value={editTask.pointValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string or valid numbers 0-100
                    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 100)) {
                      setEditTask({ ...editTask, pointValue: value });
                    }
                  }}
                />
                <p className="text-xs text-gray-500">Enter any number 0-100, or leave empty for 0 points</p>
              </div>
              <div className="flex gap-2 sm:gap-3 pt-2">
                <Button 
                  onClick={handleUpdateTask} 
                  className="flex-1 bg-vibrant-green hover:bg-green-600 text-black font-bold border-2 border-green-700 shadow-lg h-11"
                  disabled={updateTaskMutation.isPending}
                >
                  {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
