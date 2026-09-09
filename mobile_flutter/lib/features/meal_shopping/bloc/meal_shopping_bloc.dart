import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/meal_shopping_repository.dart';
import '../models/meal_shopping_models.dart';
import 'meal_shopping_event.dart';
import 'meal_shopping_state.dart';

class MealShoppingBloc extends Bloc<MealShoppingEvent, MealShoppingState> {
  MealShoppingBloc(this.repository) : super(const MealShoppingState()) {
    on<MealShoppingStarted>(_load);
    on<RefreshMealShopping>(_load);
    on<AddMealPlan>(_addMealPlan);
    on<ToggleMealCompletion>(_toggleMeal);
    on<AddShoppingItem>(_addShoppingItem);
    on<ToggleShoppingItem>(_toggleShoppingItem);
  }

  final MealShoppingRepository repository;

  Future<void> _load(
    MealShoppingEvent event,
    Emitter<MealShoppingState> emit,
  ) async {
    emit(
      state.copyWith(
        status: MealShoppingStatus.loading,
        action: MealShoppingAction.none,
        activeId: null,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );
    try {
      final snapshot = await _fetchAll();
      _emitSnapshot(emit, snapshot);
    } catch (error) {
      _emitFailure(emit, error);
    }
  }

  Future<void> _addMealPlan(
    AddMealPlan event,
    Emitter<MealShoppingState> emit,
  ) async {
    emit(
      state.copyWith(
        action: MealShoppingAction.addingMeal,
        activeId: null,
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.createMealPlan(event.input);
      await _reloadAfterMutation(
        emit,
        successMessage: 'Meal plan saved successfully.',
      );
    } catch (error) {
      _emitActionFailure(emit, error, 'Failed to save meal plan. Please try again.');
    }
  }

  Future<void> _toggleMeal(
    ToggleMealCompletion event,
    Emitter<MealShoppingState> emit,
  ) async {
    emit(
      state.copyWith(
        action: MealShoppingAction.completingMeal,
        activeId: event.id,
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.updateMealCompletion(event.id, event.isCompleted);
      await _reloadAfterMutation(
        emit,
        successMessage: event.isCompleted
            ? 'Meal marked as complete.'
            : 'Meal marked as incomplete.',
      );
    } catch (error) {
      _emitActionFailure(
        emit,
        error,
        'Failed to update meal completion. Please try again.',
      );
    }
  }

  Future<void> _addShoppingItem(
    AddShoppingItem event,
    Emitter<MealShoppingState> emit,
  ) async {
    emit(
      state.copyWith(
        action: MealShoppingAction.addingShoppingItem,
        activeId: null,
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.createShoppingItem(event.input);
      await _reloadAfterMutation(
        emit,
        successMessage: 'Shopping item added successfully.',
      );
    } catch (error) {
      _emitActionFailure(
        emit,
        error,
        'Failed to save shopping item. Please try again.',
      );
    }
  }

  Future<void> _toggleShoppingItem(
    ToggleShoppingItem event,
    Emitter<MealShoppingState> emit,
  ) async {
    emit(
      state.copyWith(
        action: MealShoppingAction.completingShoppingItem,
        activeId: event.id,
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.updateShoppingPurchased(
        event.id,
        event.isPurchased,
        actualCost: event.actualCost,
      );
      await _reloadAfterMutation(
        emit,
        successMessage: event.isPurchased
            ? 'Shopping item marked as purchased.'
            : 'Shopping item marked as active.',
      );
    } catch (error) {
      _emitActionFailure(
        emit,
        error,
        'Failed to update shopping item. Please try again.',
      );
    }
  }

  Future<void> _reloadAfterMutation(
    Emitter<MealShoppingState> emit, {
    required String successMessage,
  }) async {
    final snapshot = await _fetchAll();
    _emitSnapshot(
      emit,
      snapshot,
      actionMessage: successMessage,
    );
  }

  Future<
      (
        List<MealPlanModel>,
        List<ShoppingItemModel>,
        List<ShoppingItemModel>
      )> _fetchAll() async {
    final results = await Future.wait([
      repository.getMealPlans(),
      repository.getShoppingItems(),
      repository.getActiveShoppingItems(),
    ]);
    return (
      results[0] as List<MealPlanModel>,
      results[1] as List<ShoppingItemModel>,
      results[2] as List<ShoppingItemModel>,
    );
  }

  void _emitSnapshot(
    Emitter<MealShoppingState> emit,
    (
      List<MealPlanModel>,
      List<ShoppingItemModel>,
      List<ShoppingItemModel>
    ) snapshot, {
    String? actionMessage,
  }) {
    emit(
      state.copyWith(
        status: MealShoppingStatus.loaded,
        mealPlans: snapshot.$1,
        shoppingItems: snapshot.$2,
        activeShoppingItems: snapshot.$3,
        action: MealShoppingAction.none,
        activeId: null,
        errorMessage: null,
        actionMessage: actionMessage,
        sessionInvalid: false,
      ),
    );
  }

  void _emitFailure(Emitter<MealShoppingState> emit, Object error) {
    emit(
      state.copyWith(
        status: state.hasData
            ? MealShoppingStatus.loaded
            : MealShoppingStatus.failure,
        action: MealShoppingAction.none,
        activeId: null,
        errorMessage: _messageFor(error),
        sessionInvalid:
            error is ApiException && error.type == ApiErrorType.unauthorized,
      ),
    );
  }

  void _emitActionFailure(
    Emitter<MealShoppingState> emit,
    Object error,
    String fallback,
  ) {
    emit(
      state.copyWith(
        status: state.hasData
            ? MealShoppingStatus.loaded
            : MealShoppingStatus.failure,
        action: MealShoppingAction.none,
        activeId: null,
        errorMessage: error is ApiException ? error.message : fallback,
        sessionInvalid:
            error is ApiException && error.type == ApiErrorType.unauthorized,
      ),
    );
  }

  String _messageFor(Object error) {
    if (error is ApiException) return error.message;
    if (error is FormatException) return error.message;
    return 'Unable to load meal plans and shopping lists. Please try again.';
  }
}