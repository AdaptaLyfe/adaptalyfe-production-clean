import '../../../core/network/api_client.dart';
import '../models/meal_shopping_models.dart';

class MealShoppingApi {
  const MealShoppingApi(this.client);

  final ApiClient client;

  Future<List<MealPlanModel>> getMealPlans() =>
      _getList('/api/meal-plans', MealPlanModel.fromJson);

  Future<MealPlanModel> createMealPlan(MealPlanInput input) =>
      _post('/api/meal-plans', input.toJson(), MealPlanModel.fromJson);

  Future<MealPlanModel> updateMealCompletion(
    int id,
    bool isCompleted,
  ) =>
      _patch(
        '/api/meal-plans/$id/completion',
        {'isCompleted': isCompleted},
        MealPlanModel.fromJson,
      );

  Future<void> deleteMealPlan(int id) async {
    await client.delete<dynamic>('/api/meal-plans/$id');
  }

  Future<List<ShoppingItemModel>> getShoppingItems() =>
      _getList('/api/shopping-lists', ShoppingItemModel.fromJson);

  Future<List<ShoppingItemModel>> getActiveShoppingItems() =>
      _getList('/api/shopping-lists/active', ShoppingItemModel.fromJson);

  Future<ShoppingItemModel> createShoppingItem(ShoppingItemInput input) =>
      _post('/api/shopping-lists', input.toJson(), ShoppingItemModel.fromJson);

  Future<ShoppingItemModel> updateShoppingPurchased(
    int id,
    bool isPurchased, {
    double? actualCost,
  }) =>
      _patch(
        '/api/shopping-lists/$id/purchased',
        {
          'isPurchased': isPurchased,
          if (actualCost != null) 'actualCost': actualCost,
        },
        ShoppingItemModel.fromJson,
      );

  Future<void> deleteShoppingItem(int id) async {
    await client.delete<dynamic>('/api/shopping-lists/$id');
  }

  Future<List<GroceryStoreModel>> getGroceryStores() =>
      _getList('/api/grocery-stores', GroceryStoreModel.fromJson);

  Future<GroceryStoreModel> createGroceryStore(GroceryStoreInput input) =>
      _post('/api/grocery-stores', input.toJson(), GroceryStoreModel.fromJson);

  Future<GroceryStoreModel> updateGroceryStore(
    int id,
    GroceryStoreInput input,
  ) =>
      _put(
        '/api/grocery-stores/$id',
        input.toJson(),
        GroceryStoreModel.fromJson,
      );

  Future<void> deleteGroceryStore(int id) async {
    await client.delete<dynamic>('/api/grocery-stores/$id');
  }

  Future<List<T>> _getList<T>(
    String path,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.get<dynamic>(path);
    if (response.data is! List) {
      throw const FormatException('Invalid meal or shopping list response');
    }
    return (response.data as List)
        .whereType<Map>()
        .map((item) => fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<T> _post<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.post<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  Future<T> _patch<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.patch<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  Future<T> _put<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.put<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  T _parseItem<T>(
    Object? data,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    if (data is! Map) {
      throw const FormatException('Invalid meal or shopping item response');
    }
    return fromJson(Map<String, dynamic>.from(data));
  }
}