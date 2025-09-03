import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Star, 
  Trophy, 
  Target, 
  Plus, 
  Award, 
  CheckCircle, 
  Clock,
  TrendingUp,
  BookOpen,
  Users,
  Home,
  Briefcase,
  Heart,
  Brain,
  Edit,
  Trash2
} from "lucide-react";

const skillFormSchema = z.object({
  skillName: z.string().min(1, "Skill name is required"),
  description: z.string().optional(),
  skillCategory: z.enum(["academic", "social", "independent_living", "career", "personal", "health"]),
  currentLevel: z.number().min(1).max(10).default(1),
  targetLevel: z.number().min(1).max(10).default(5),
  targetDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

const categoryConfig = {
  academic: { label: "Academic Skills", icon: BookOpen, color: "bg-blue-500" },
  social: { label: "Social Skills", icon: Users, color: "bg-green-500" },
  independent_living: { label: "Independent Living", icon: Home, color: "bg-purple-500" },
  career: { label: "Career Readiness", icon: Briefcase, color: "bg-orange-500" },
  personal: { label: "Personal Development", icon: Heart, color: "bg-pink-500" },
  health: { label: "Health & Wellness", icon: Brain, color: "bg-teal-500" },
};

export default function SkillsMilestones() {
  const queryClient = useQueryClient();
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [isEditSkillOpen, setIsEditSkillOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const form = useForm({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      skillName: "",
      description: "",
      skillCategory: "independent_living" as const,
      currentLevel: 1,
      targetLevel: 5,
      targetDate: "",
      priority: "medium" as const,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      skillName: "",
      description: "",
      skillCategory: "independent_living" as const,
      currentLevel: 1,
      targetLevel: 5,
      targetDate: "",
      priority: "medium" as const,
    },
  });

  // Fetch transition skills data
  const { data: transitionSkills = [], isLoading: skillsLoading, refetch: refetchSkills } = useQuery({
    queryKey: ["/api/transition-skills"],
    queryFn: async () => {
      const response = await fetch('/api/transition-skills');
      if (!response.ok) throw new Error('Failed to fetch skills');
      return response.json();
    },
    staleTime: 0,
  });

  // Create skill mutation
  const createSkillMutation = useMutation({
    mutationFn: async (skillData: any) => {
      return apiRequest("POST", "/api/transition-skills", skillData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transition-skills"] });
      refetchSkills();
      setIsAddSkillOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "New skill milestone added!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add skill milestone",
        variant: "destructive",
      });
    },
  });

  // Update skill progress mutation
  const updateSkillMutation = useMutation({
    mutationFn: async ({ id, currentLevel }: { id: number; currentLevel: number }) => {
      return apiRequest("PATCH", `/api/transition-skills/${id}`, { currentLevel });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transition-skills"] });
      refetchSkills();
      toast({
        title: "Progress Updated",
        description: "Great job on improving your skills!",
      });
    },
  });

  // Edit skill mutation
  const editSkillMutation = useMutation({
    mutationFn: async ({ id, skillData }: { id: number; skillData: any }) => {
      return apiRequest("PATCH", `/api/transition-skills/${id}`, skillData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transition-skills"] });
      refetchSkills();
      setIsEditSkillOpen(false);
      setEditingSkill(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Skill updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update skill",
        variant: "destructive",
      });
    },
  });

  // Delete skill mutation
  const deleteSkillMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/transition-skills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transition-skills"] });
      refetchSkills();
      toast({
        title: "Success",
        description: "Skill deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete skill",
        variant: "destructive",
      });
    },
  });

  const handleProgressUpdate = (skillId: number, newLevel: number) => {
    updateSkillMutation.mutate({ id: skillId, currentLevel: newLevel });
  };

  const handleEditSkill = (skill: any) => {
    setEditingSkill(skill);
    editForm.reset({
      skillName: skill.skillName || "",
      description: skill.description || "",
      skillCategory: skill.skillCategory || "independent_living",
      currentLevel: skill.currentLevel || 1,
      targetLevel: skill.targetLevel || 5,
      targetDate: skill.targetDate || "",
      priority: skill.priority || "medium",
    });
    setIsEditSkillOpen(true);
  };

  const handleDeleteSkill = (id: number) => {
    if (window.confirm("Are you sure you want to delete this skill? This action cannot be undone.")) {
      deleteSkillMutation.mutate(id);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressStatus = (current: number, target: number) => {
    const percentage = getProgressPercentage(current, target);
    if (percentage >= 100) return { text: "Completed", color: "text-green-600" };
    if (percentage >= 75) return { text: "Almost There", color: "text-blue-600" };
    if (percentage >= 50) return { text: "Good Progress", color: "text-yellow-600" };
    return { text: "Getting Started", color: "text-gray-600" };
  };

  const filteredSkills = selectedCategory === "all" 
    ? transitionSkills 
    : transitionSkills.filter((skill: any) => skill.skillCategory === selectedCategory);

  if (skillsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your skills and milestones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills & Milestones</h1>
        <p className="text-gray-600">
          Track your progress in life skills, set goals, and celebrate achievements
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Skills</p>
                <p className="text-2xl font-bold text-gray-900">{transitionSkills.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transitionSkills.filter((s: any) => (s.currentLevel || 1) >= (s.targetLevel || 5)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transitionSkills.filter((s: any) => {
                    const current = s.currentLevel || 1;
                    const target = s.targetLevel || 5;
                    return current < target && current > 1;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transitionSkills.length > 0 ? 
                    Math.round(transitionSkills.reduce((avg: number, s: any) => 
                      avg + getProgressPercentage(s.currentLevel || 1, s.targetLevel || 5), 0) / transitionSkills.length) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus size={16} className="mr-2" />
              Add Skill Milestone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Skill Milestone</DialogTitle>
              <DialogDescription>
                Set a new skill goal to track your progress
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createSkillMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="skillName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Time Management, Cooking, Communication" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skillCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(categoryConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currentLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Level (1-10)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10}
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Level (1-10)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10}
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 5)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this skill involves and why it's important..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createSkillMutation.isPending}
                >
                  {createSkillMutation.isPending ? "Adding..." : "Add Skill Milestone"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Skill Dialog */}
        <Dialog open={isEditSkillOpen} onOpenChange={setIsEditSkillOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Skill Milestone</DialogTitle>
              <DialogDescription>
                Update your skill details and progress goals
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((data) => {
                if (editingSkill) {
                  editSkillMutation.mutate({ id: editingSkill.id, skillData: data });
                }
              })} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="skillName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Time Management, Cooking, Communication" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="skillCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(categoryConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="currentLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Level (1-10)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10}
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="targetLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Level (1-10)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10}
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 5)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this skill involves and why it's important..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsEditSkillOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="outline"
                    className="flex-1" 
                    disabled={editSkillMutation.isPending}
                  >
                    {editSkillMutation.isPending ? "Updating..." : "Update Skill"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map((skill: any) => {
          const CategoryIcon = categoryConfig[skill.skillCategory as keyof typeof categoryConfig]?.icon || Target;
          const status = getProgressStatus(skill.currentLevel || 1, skill.targetLevel || 5);
          const progressPercentage = getProgressPercentage(skill.currentLevel || 1, skill.targetLevel || 5);
          
          return (
            <Card key={skill.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      categoryConfig[skill.skillCategory as keyof typeof categoryConfig]?.color || "bg-gray-500"
                    }`}>
                      <CategoryIcon className="text-white" size={20} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{skill.skillName}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {categoryConfig[skill.skillCategory as keyof typeof categoryConfig]?.label || skill.skillCategory}
                      </Badge>
                    </div>
                  </div>
                  {progressPercentage >= 100 && (
                    <Trophy className="text-yellow-500" size={20} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {skill.description && (
                    <p className="text-sm text-gray-600">{skill.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Level {skill.currentLevel || 1}</span>
                      <span>Target: {skill.targetLevel || 5}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProgressUpdate(skill.id, Math.max(1, (skill.currentLevel || 1) - 1))}
                        disabled={updateSkillMutation.isPending || (skill.currentLevel || 1) <= 1}
                      >
                        -
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleProgressUpdate(skill.id, Math.min(10, (skill.currentLevel || 1) + 1))}
                        disabled={updateSkillMutation.isPending || (skill.currentLevel || 1) >= 10}
                      >
                        Update Progress
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProgressUpdate(skill.id, Math.min(10, (skill.currentLevel || 1) + 1))}
                        disabled={updateSkillMutation.isPending || (skill.currentLevel || 1) >= 10}
                      >
                        +
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditSkill(skill)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteSkill(skill.id)}
                        disabled={deleteSkillMutation.isPending}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-12">
          <Target className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Skills Found</h3>
          <p className="text-gray-600 mb-4">
            {selectedCategory === "all" 
              ? "Start tracking your progress by adding your first skill milestone!"
              : `No skills found in the ${categoryConfig[selectedCategory as keyof typeof categoryConfig]?.label || selectedCategory} category.`
            }
          </p>
          <Button onClick={() => setIsAddSkillOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
            <Plus size={16} className="mr-2" />
            Add Your First Skill
          </Button>
        </div>
      )}
    </div>
  );
}