import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Daily Tasks</h1>
        <Card className="border-t-4 border-vibrant-green">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Today's Progress</h3>
                <p className="text-gray-600">{completedTasks} of {totalTasks} tasks completed</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">{progressPercentage}%</div>
                <p className="text-sm text-gray-600">Complete</p>
              </div>
            </div>
            <div className="w-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full h-6 shadow-inner border border-gray-400">
              <div 
                className="bg-gradient-to-r from-green-500 via-green-400 to-emerald-400 h-6 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden border-2 border-green-600"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-200 to-transparent opacity-50"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-green-600/20 to-transparent"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
          <Card key={category} className="border-t-4 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-400'} rounded-lg`}></div>
                <span className="capitalize">{category} Tasks</span>
                <span className="text-sm font-normal text-gray-600">
                  ({categoryTasks.filter(t => t.isCompleted).length}/{categoryTasks.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryTasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-8 h-8 p-0 rounded-full flex items-center justify-center ${
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
                    >
                      {task.isCompleted ? (
                        <CheckCircle className="text-white" size={20} />
                      ) : (
                        <Circle className="text-white" size={20} />
                      )}
                    </Button>
                    <div className="flex-1">
                      <h4 className={`font-medium text-gray-900 ${task.isCompleted ? 'line-through' : ''}`}>
                        {task.title}
                      </h4>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{task.estimatedMinutes} minutes</span>
                        </div>
                        {task.frequency && task.frequency !== 'daily' && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                              {task.frequency}
                            </span>
                          </div>
                        )}
                        {task.scheduledTime && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                              {new Date(`2000-01-01T${task.scheduledTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        {task.pointValue && task.pointValue > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star size={14} className="text-yellow-500" />
                            <span className="text-xs text-yellow-600 font-medium">{task.pointValue} points</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 hover:bg-blue-100"
                        onClick={() => handleEditTask(task)}
                      >
                        <Edit3 className="text-blue-600" size={16} />
                      </Button>
                      {task.isCompleted && (
                        <div className="w-10 h-10 bg-sunny-orange rounded-full flex items-center justify-center">
                          <Star className="text-white" size={20} />
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

      <div className="mt-8 text-center">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-vibrant-green hover:bg-green-600 text-black font-bold shadow-lg border border-green-700">
              <Plus size={20} className="mr-2 text-black" />
              <span className="text-black font-bold">Add New Task</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Daily Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
              <Select 
                value={newTask.category} 
                onValueChange={(value) => setNewTask({ ...newTask, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal_care">Personal Care</SelectItem>
                  <SelectItem value="household">Household</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={newTask.frequency} 
                onValueChange={(value) => setNewTask({ ...newTask, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              
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
              <div className="flex space-x-2">
                <Button 
                  onClick={handleCreateTask} 
                  disabled={createTaskMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
                <Button 
                  onClick={() => setIsAddDialogOpen(false)} 
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
              <Select 
                value={editTask.category} 
                onValueChange={(value) => setEditTask({ ...editTask, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal_care">Personal Care</SelectItem>
                  <SelectItem value="household">Household</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={editTask.frequency} 
                onValueChange={(value) => setEditTask({ ...editTask, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              
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
              <div className="flex space-x-2">
                <Button 
                  onClick={handleUpdateTask} 
                  className="flex-1 bg-vibrant-green hover:bg-green-600 text-black font-bold border-2 border-green-700 shadow-lg"
                  disabled={updateTaskMutation.isPending}
                >
                  {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
