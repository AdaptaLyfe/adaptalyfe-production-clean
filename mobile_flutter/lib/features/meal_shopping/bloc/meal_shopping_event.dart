import 'package:equatable/equatable.dart';

import '../models/meal_shopping_models.dart';

sealed class MealShoppingEvent extends Equatable {
  const MealShoppingEvent();

  @override
  List<Object?> get props => [];
}

final class MealShoppingStarted extends MealShoppingEvent {
  const MealShoppingStarted();
}

final class RefreshMealShopping extends MealShoppingEvent {
  const RefreshMealShopping();
}

final class AddMealPlan extends MealShoppingEvent {
  const AddMealPlan(this.input);

  final MealPlanInput input;

  @override
  List<Object?> get props => [input];
}

final class ToggleMealCompletion extends MealShoppingEvent {
  const ToggleMealCompletion(this.id, this.isCompleted);

  final int id;
  final bool isCompleted;

  @override
  List<Object?> get props => [id, isCompleted];
}

final class DeleteMealPlan extends MealShoppingEvent {
  const DeleteMealPlan(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}

final class AddShoppingItem extends MealShoppingEvent {
  const AddShoppingItem(this.input);

  final ShoppingItemInput input;

  @override
  List<Object?> get props => [input];
}

final class ToggleShoppingItem extends MealShoppingEvent {
  const ToggleShoppingItem(this.id, this.isPurchased, {this.actualCost});

  final int id;
  final bool isPurchased;
  final double? actualCost;

  @override
  List<Object?> get props => [id, isPurchased, actualCost];
}

final class DeleteShoppingItem extends MealShoppingEvent {
  const DeleteShoppingItem(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}