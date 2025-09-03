import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MealPlanningModule from "@/components/meal-planning-module";
import ShoppingListModule from "@/components/shopping-list-module";
import PremiumFeaturePrompt from "@/components/premium-feature-prompt";
import { ChefHat, ShoppingCart } from "lucide-react";
import { useSubscriptionEnforcement } from "@/middleware/subscription-middleware";

export default function MealShopping() {
  const { hasFeature } = useSubscriptionEnforcement();
  
  // Check if user has access to meal planning features
  if (!hasFeature('mealPlanning')) {
    return (
      <div className="container mx-auto p-6">
        <PremiumFeaturePrompt
          title="Meal Planning & Shopping"
          description="Create personalized meal plans, manage recipes, and generate smart shopping lists. This premium feature helps you maintain a healthy diet and budget."
          feature="mealPlanning"
          requiredPlan="premium"
          className="max-w-md mx-auto mt-20"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meal Planning & Shopping</h1>
        <p className="text-lg text-gray-600">
          Plan nutritious meals and manage your grocery shopping efficiently
        </p>
      </div>

      <Tabs defaultValue="meal-planning" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="meal-planning" className="flex items-center space-x-2">
            <ChefHat className="w-4 h-4" />
            <span>Meal Planning</span>
          </TabsTrigger>
          <TabsTrigger value="shopping-list" className="flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Shopping List</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="meal-planning" className="mt-6">
          <MealPlanningModule />
        </TabsContent>
        
        <TabsContent value="shopping-list" className="mt-6">
          <ShoppingListModule />
        </TabsContent>
      </Tabs>
    </div>
  );
}