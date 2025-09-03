import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, ChefHat, Plus, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { insertMealPlanSchema, type MealPlan, type InsertMealPlan } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function MealPlanningModule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: mealPlans, isLoading } = useQuery<MealPlan[]>({
    queryKey: ["/api/meal-plans"],
  });

  const createMealPlanMutation = useMutation({
    mutationFn: async (data: InsertMealPlan) => {
      const response = await apiRequest("POST", "/api/meal-plans", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      form.reset();
      toast({
        title: "Success",
        description: "Meal plan saved successfully!",
      });
    },
    onError: (error) => {
      console.error("Failed to create meal plan:", error);
      toast({
        title: "Error",
        description: "Failed to save meal plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCompletionMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
      return await apiRequest("PATCH", `/api/meal-plans/${id}/completion`, { isCompleted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
    },
  });

  const form = useForm<Omit<InsertMealPlan, 'userId'>>({
    resolver: zodResolver(insertMealPlanSchema.omit({ userId: true })),
    defaultValues: {
      mealType: "breakfast",
      mealName: "",
      plannedDate: format(new Date(), "yyyy-MM-dd"),
      isCompleted: false,
      recipe: "",
      cookingTime: 30,
    },
  });

  const handleSubmit = (data: Omit<InsertMealPlan, 'userId'>) => {
    console.log("Submitting meal plan data:", data);
    createMealPlanMutation.mutate(data as InsertMealPlan);
  };

  const toggleCompletion = (mealPlan: MealPlan) => {
    updateCompletionMutation.mutate({
      id: mealPlan.id,
      isCompleted: !mealPlan.isCompleted,
    });
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case "breakfast": return "bg-sunny-orange text-white";
      case "lunch": return "bg-vibrant-green text-white";
      case "dinner": return "bg-bright-blue text-white";
      case "snack": return "bg-cheerful-pink text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const groupedMealPlans = mealPlans?.reduce((acc, meal) => {
    const date = meal.plannedDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(meal);
    return acc;
  }, {} as Record<string, MealPlan[]>);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ChefHat className="text-sunny-orange" />
            <span>Meal Planning</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ChefHat className="text-sunny-orange" />
            <span>Add New Meal</span>
          </CardTitle>
          <CardDescription>
            Plan your meals to develop healthy eating habits and cooking skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit, (errors) => {
              console.error("Form validation errors:", errors);
              toast({
                title: "Form Error",
                description: "Please fill in all required fields correctly.",
                variant: "destructive",
              });
            })} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mealName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Scrambled eggs and toast" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select meal type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plannedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cookingTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cooking Time (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          value={field.value?.toString() || ""}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="recipe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe/Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write simple cooking instructions or notes..."
                        className="min-h-[100px]"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={createMealPlanMutation.isPending} 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => console.log("Button clicked, form values:", form.getValues())}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createMealPlanMutation.isPending ? "Adding..." : "Add Meal Plan"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="text-bright-blue" />
            <span>Meal Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!groupedMealPlans || Object.keys(groupedMealPlans).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No meals planned yet. Add your first meal plan above!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMealPlans)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([date, meals]) => (
                  <div key={date} className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">
                      {format(new Date(date), "EEEE, MMMM d, yyyy")}
                    </h3>
                    <div className="grid gap-3">
                      {meals
                        .sort((a, b) => {
                          const order = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
                          return order[a.mealType as keyof typeof order] - order[b.mealType as keyof typeof order];
                        })
                        .map((meal) => (
                          <div
                            key={meal.id}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              meal.isCompleted
                                ? "border-vibrant-green bg-green-50"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={meal.isCompleted || false}
                                  onCheckedChange={() => toggleCompletion(meal)}
                                  disabled={updateCompletionMutation.isPending}
                                />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium">{meal.mealName}</h4>
                                    <Badge className={getMealTypeColor(meal.mealType)}>
                                      {meal.mealType}
                                    </Badge>
                                  </div>
                                  {meal.cookingTime && (
                                    <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{meal.cookingTime} minutes</span>
                                    </div>
                                  )}
                                  {meal.recipe && (
                                    <p className="text-sm text-gray-600 mt-2 max-w-2xl">
                                      {meal.recipe}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {meal.isCompleted && (
                                <CheckCircle2 className="w-5 h-5 text-vibrant-green" />
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}