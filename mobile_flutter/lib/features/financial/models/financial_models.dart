import 'package:equatable/equatable.dart';

class BillModel extends Equatable {
  const BillModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.amount,
    required this.dueDate,
    required this.isRecurring,
    required this.isPaid,
    required this.category,
    required this.payeeWebsite,
    required this.payeeAccountNumber,
  });

  factory BillModel.fromJson(Map<String, dynamic> json) {
    return BillModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      name: _asString(json['name']),
      amount: _asDouble(json['amount']),
      dueDate: _asInt(json['dueDate']),
      isRecurring: json['isRecurring'] != false,
      isPaid: json['isPaid'] == true,
      category: _asString(json['category']),
      payeeWebsite: _asNullableString(json['payeeWebsite']),
      payeeAccountNumber: _asNullableString(json['payeeAccountNumber']),
    );
  }

  final int id;
  final int userId;
  final String name;
  final double amount;
  final int dueDate;
  final bool isRecurring;
  final bool isPaid;
  final String category;
  final String? payeeWebsite;
  final String? payeeAccountNumber;

  BillModel copyWith({
    bool? isPaid,
    String? payeeWebsite,
    String? payeeAccountNumber,
  }) {
    return BillModel(
      id: id,
      userId: userId,
      name: name,
      amount: amount,
      dueDate: dueDate,
      isRecurring: isRecurring,
      isPaid: isPaid ?? this.isPaid,
      category: category,
      payeeWebsite: payeeWebsite ?? this.payeeWebsite,
      payeeAccountNumber: payeeAccountNumber ?? this.payeeAccountNumber,
    );
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        name,
        amount,
        dueDate,
        isRecurring,
        isPaid,
        category,
        payeeWebsite,
        payeeAccountNumber,
      ];
}

class BillInput extends Equatable {
  const BillInput({
    required this.name,
    required this.amount,
    required this.dueDate,
    required this.category,
    required this.isRecurring,
  });

  final String name;
  final double amount;
  final int dueDate;
  final String category;
  final bool isRecurring;

  Map<String, dynamic> toJson() => {
        'name': name,
        'amount': amount,
        'dueDate': dueDate,
        'category': category,
        'isRecurring': isRecurring,
      };

  @override
  List<Object?> get props => [name, amount, dueDate, category, isRecurring];
}

class BudgetEntryModel extends Equatable {
  const BudgetEntryModel({
    required this.id,
    required this.userId,
    required this.category,
    required this.amount,
    required this.type,
    required this.description,
    required this.isRecurring,
    required this.recurringFrequency,
    required this.entryDate,
    required this.createdAt,
  });

  factory BudgetEntryModel.fromJson(Map<String, dynamic> json) {
    return BudgetEntryModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      category: _asString(json['category']),
      amount: _asDouble(json['amount']),
      type: _asString(json['type'], fallback: 'expense'),
      description: _asNullableString(json['description']),
      isRecurring: json['isRecurring'] == true,
      recurringFrequency: _asNullableString(json['recurringFrequency']),
      entryDate: _asDateTime(json['entryDate']),
      createdAt: _asDateTime(json['createdAt']),
    );
  }

  final int id;
  final int userId;
  final String category;
  final double amount;
  final String type;
  final String? description;
  final bool isRecurring;
  final String? recurringFrequency;
  final DateTime? entryDate;
  final DateTime? createdAt;

  @override
  List<Object?> get props => [
        id,
        userId,
        category,
        amount,
        type,
        description,
        isRecurring,
        recurringFrequency,
        entryDate,
        createdAt,
      ];
}

class BudgetEntryInput extends Equatable {
  const BudgetEntryInput({
    required this.category,
    required this.amount,
    required this.type,
    this.description,
  });

  final String category;
  final double amount;
  final String type;
  final String? description;

  Map<String, dynamic> toJson() => {
        'category': category,
        'amount': amount,
        'type': type,
        'description': description ?? '',
      };

  @override
  List<Object?> get props => [category, amount, type, description];
}

int _asInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse('$value') ?? 0;
}

double _asDouble(Object? value) {
  if (value is num) return value.toDouble();
  return double.tryParse('$value') ?? 0;
}

String _asString(Object? value, {String fallback = ''}) {
  return value is String ? value : fallback;
}

String? _asNullableString(Object? value) {
  if (value is! String || value.trim().isEmpty) return null;
  return value;
}

DateTime? _asDateTime(Object? value) {
  if (value is! String || value.isEmpty) return null;
  return DateTime.tryParse(value);
}