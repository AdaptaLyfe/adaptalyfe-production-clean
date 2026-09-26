import 'package:equatable/equatable.dart';

class MealPlanModel extends Equatable {
  const MealPlanModel({
    required this.id,
    required this.mealType,
    required this.mealName,
    required this.plannedDate,
    required this.isCompleted,
    required this.recipe,
    required this.cookingTime,
  });

  factory MealPlanModel.fromJson(Map<String, dynamic> json) {
    return MealPlanModel(
      id: _asInt(json['id']),
      mealType: _asString(json['mealType']),
      mealName: _asString(json['mealName']),
      plannedDate: _asString(json['plannedDate']),
      isCompleted: json['isCompleted'] == true,
      recipe: _asNullableString(json['recipe']),
      cookingTime: _asNullableInt(json['cookingTime']),
    );
  }

  final int id;
  final String mealType;
  final String mealName;
  final String plannedDate;
  final bool isCompleted;
  final String? recipe;
  final int? cookingTime;

  @override
  List<Object?> get props => [
        id,
        mealType,
        mealName,
        plannedDate,
        isCompleted,
        recipe,
        cookingTime,
      ];
}

class MealPlanInput extends Equatable {
  const MealPlanInput({
    required this.mealType,
    required this.mealName,
    required this.plannedDate,
    this.isCompleted = false,
    this.recipe,
    this.cookingTime,
  });

  final String mealType;
  final String mealName;
  final String plannedDate;
  final bool isCompleted;
  final String? recipe;
  final int? cookingTime;

  Map<String, dynamic> toJson() => {
        'mealType': mealType.trim(),
        'mealName': mealName.trim(),
        'plannedDate': plannedDate,
        'isCompleted': isCompleted,
        'recipe': recipe?.trim() ?? '',
        'cookingTime': cookingTime ?? 0,
      };

  @override
  List<Object?> get props => [
        mealType,
        mealName,
        plannedDate,
        isCompleted,
        recipe,
        cookingTime,
      ];
}

class ShoppingItemModel extends Equatable {
  const ShoppingItemModel({
    required this.id,
    required this.storeId,
    required this.itemName,
    required this.category,
    required this.quantity,
    required this.isPurchased,
    required this.estimatedCost,
    required this.actualCost,
    required this.addedDate,
    required this.purchasedDate,
  });

  factory ShoppingItemModel.fromJson(Map<String, dynamic> json) {
    return ShoppingItemModel(
      id: _asInt(json['id']),
      storeId: _asNullableInt(json['storeId']),
      itemName: _asString(json['itemName']),
      category: _asString(json['category']),
      quantity: _asNullableString(json['quantity']),
      isPurchased: json['isPurchased'] == true,
      estimatedCost: _asNullableDouble(json['estimatedCost']),
      actualCost: _asNullableDouble(json['actualCost']),
      addedDate: _asDate(json['addedDate']),
      purchasedDate: _asDate(json['purchasedDate']),
    );
  }

  final int id;
  final int? storeId;
  final String itemName;
  final String category;
  final String? quantity;
  final bool isPurchased;
  final double? estimatedCost;
  final double? actualCost;
  final DateTime? addedDate;
  final DateTime? purchasedDate;

  @override
  List<Object?> get props => [
        id,
        storeId,
        itemName,
        category,
        quantity,
        isPurchased,
        estimatedCost,
        actualCost,
        addedDate,
        purchasedDate,
      ];
}

class ShoppingItemInput extends Equatable {
  const ShoppingItemInput({
    required this.itemName,
    required this.category,
    this.quantity,
    this.isPurchased = false,
    this.estimatedCost,
    this.actualCost,
    this.storeId,
  });

  final String itemName;
  final String category;
  final String? quantity;
  final bool isPurchased;
  final double? estimatedCost;
  final double? actualCost;
  final int? storeId;

  Map<String, dynamic> toJson() => {
        'itemName': itemName.trim(),
        'category': category.trim(),
        'quantity': quantity?.trim() ?? '',
        'isPurchased': isPurchased,
        if (estimatedCost != null) 'estimatedCost': estimatedCost,
        if (actualCost != null) 'actualCost': actualCost,
        if (storeId != null) 'storeId': storeId,
      };

  @override
  List<Object?> get props => [
        itemName,
        category,
        quantity,
        isPurchased,
        estimatedCost,
        actualCost,
        storeId,
      ];
}

class GroceryStoreModel extends Equatable {
  const GroceryStoreModel({
    required this.id,
    required this.name,
    required this.website,
    required this.onlineOrderingUrl,
    required this.address,
    required this.phoneNumber,
    required this.isPreferred,
    required this.deliveryAvailable,
    required this.pickupAvailable,
  });

  factory GroceryStoreModel.fromJson(Map<String, dynamic> json) {
    return GroceryStoreModel(
      id: _asInt(json['id']),
      name: _asString(json['name']),
      website: _asNullableString(json['website']),
      onlineOrderingUrl: _asNullableString(json['onlineOrderingUrl']),
      address: _asNullableString(json['address']),
      phoneNumber: _asNullableString(json['phoneNumber']),
      isPreferred: json['isPreferred'] == true,
      deliveryAvailable: json['deliveryAvailable'] == true,
      pickupAvailable: json['pickupAvailable'] == true,
    );
  }

  final int id;
  final String name;
  final String? website;
  final String? onlineOrderingUrl;
  final String? address;
  final String? phoneNumber;
  final bool isPreferred;
  final bool deliveryAvailable;
  final bool pickupAvailable;

  @override
  List<Object?> get props => [
        id,
        name,
        website,
        onlineOrderingUrl,
        address,
        phoneNumber,
        isPreferred,
        deliveryAvailable,
        pickupAvailable,
      ];
}

class GroceryStoreInput extends Equatable {
  const GroceryStoreInput({
    required this.name,
    this.website,
    this.onlineOrderingUrl,
    this.address,
    this.phoneNumber,
    this.isPreferred = false,
    this.deliveryAvailable = false,
    this.pickupAvailable = false,
  });

  final String name;
  final String? website;
  final String? onlineOrderingUrl;
  final String? address;
  final String? phoneNumber;
  final bool isPreferred;
  final bool deliveryAvailable;
  final bool pickupAvailable;

  Map<String, dynamic> toJson() => {
        'name': name.trim(),
        'website': _emptyToNull(website),
        'onlineOrderingUrl': _emptyToNull(onlineOrderingUrl),
        'address': _emptyToNull(address),
        'phoneNumber': _emptyToNull(phoneNumber),
        'isPreferred': isPreferred,
        'deliveryAvailable': deliveryAvailable,
        'pickupAvailable': pickupAvailable,
      };

  @override
  List<Object?> get props => [
        name,
        website,
        onlineOrderingUrl,
        address,
        phoneNumber,
        isPreferred,
        deliveryAvailable,
        pickupAvailable,
      ];
}

String _asString(Object? value) => value is String ? value : '';

String? _asNullableString(Object? value) {
  if (value is! String || value.trim().isEmpty) return null;
  return value;
}

int _asInt(Object? value) =>
    value is int ? value : value is num ? value.toInt() : int.tryParse('$value') ?? 0;

int? _asNullableInt(Object? value) {
  if (value == null) return null;
  return value is int
      ? value
      : value is num
          ? value.toInt()
          : int.tryParse('$value');
}

double? _asNullableDouble(Object? value) {
  if (value == null) return null;
  return value is num ? value.toDouble() : double.tryParse('$value');
}

DateTime? _asDate(Object? value) =>
    value is String && value.isNotEmpty ? DateTime.tryParse(value) : null;

bool _hasText(String? value) => value != null && value.trim().isNotEmpty;

String? _emptyToNull(String? value) {
  final trimmed = value?.trim() ?? '';
  return trimmed.isEmpty ? null : trimmed;
}