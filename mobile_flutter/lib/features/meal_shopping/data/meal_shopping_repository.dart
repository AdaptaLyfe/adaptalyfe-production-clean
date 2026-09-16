import '../models/meal_shopping_models.dart';
import 'meal_shopping_api.dart';

class MealShoppingRepository {
  const MealShoppingRepository(this.api);

  final MealShoppingApi api;

  Future<List<MealPlanModel>> getMealPlans() => api.getMealPlans();
  Future<MealPlanModel> createMealPlan(MealPlanInput input) =>
      api.createMealPlan(input);
  Future<MealPlanModel> updateMealCompletion(int id, bool isCompleted) =>
      api.updateMealCompletion(id, isCompleted);
  Future<void> deleteMealPlan(int id) => api.deleteMealPlan(id);

  Future<List<ShoppingItemModel>> getShoppingItems() =>
      api.getShoppingItems();
  Future<List<ShoppingItemModel>> getActiveShoppingItems() =>
      api.getActiveShoppingItems();
  Future<ShoppingItemModel> createShoppingItem(ShoppingItemInput input) =>
      api.createShoppingItem(input);
  Future<ShoppingItemModel> updateShoppingPurchased(
    int id,
    bool isPurchased, {
    double? actualCost,
  }) =>
      api.updateShoppingPurchased(
        id,
        isPurchased,
        actualCost: actualCost,
      );
  Future<void> deleteShoppingItem(int id) => api.deleteShoppingItem(id);
}