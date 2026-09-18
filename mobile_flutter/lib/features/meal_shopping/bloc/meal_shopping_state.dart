import 'package:equatable/equatable.dart';

import '../models/meal_shopping_models.dart';

enum MealShoppingStatus {
  initial,
  loading,
  loaded,
  failure,
}

enum MealShoppingAction {
  none,
  addingMeal,
  completingMeal,
  deletingMeal,
  addingShoppingItem,
  completingShoppingItem,
  deletingShoppingItem,
  addingGroceryStore,
  updatingGroceryStore,
  deletingGroceryStore,
}

class MealShoppingState extends Equatable {
  const MealShoppingState({
    this.status = MealShoppingStatus.initial,
    this.mealPlans = const [],
    this.shoppingItems = const [],
    this.activeShoppingItems = const [],
    this.groceryStores = const [],
    this.action = MealShoppingAction.none,
    this.activeId,
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
  });

  final MealShoppingStatus status;
  final List<MealPlanModel> mealPlans;
  final List<ShoppingItemModel> shoppingItems;
  final List<ShoppingItemModel> activeShoppingItems;
  final List<GroceryStoreModel> groceryStores;
  final MealShoppingAction action;
  final int? activeId;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == MealShoppingStatus.loading;
  bool get hasData => mealPlans.isNotEmpty || shoppingItems.isNotEmpty;

  MealShoppingState copyWith({
    MealShoppingStatus? status,
    List<MealPlanModel>? mealPlans,
    List<ShoppingItemModel>? shoppingItems,
    List<ShoppingItemModel>? activeShoppingItems,
    List<GroceryStoreModel>? groceryStores,
    MealShoppingAction? action,
    Object? activeId = _notSet,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
  }) {
    return MealShoppingState(
      status: status ?? this.status,
      mealPlans: mealPlans ?? this.mealPlans,
      shoppingItems: shoppingItems ?? this.shoppingItems,
      activeShoppingItems: activeShoppingItems ?? this.activeShoppingItems,
      groceryStores: groceryStores ?? this.groceryStores,
      action: action ?? this.action,
      activeId: identical(activeId, _notSet) ? this.activeId : activeId as int?,
      errorMessage: identical(errorMessage, _notSet)
          ? this.errorMessage
          : errorMessage as String?,
      actionMessage: identical(actionMessage, _notSet)
          ? this.actionMessage
          : actionMessage as String?,
      sessionInvalid: sessionInvalid ?? this.sessionInvalid,
    );
  }

  @override
  List<Object?> get props => [
        status,
        mealPlans,
        shoppingItems,
        activeShoppingItems,
        groceryStores,
        action,
        activeId,
        errorMessage,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();