import 'package:equatable/equatable.dart';

import '../models/financial_models.dart';

enum FinancialStatus {
  initial,
  loading,
  loaded,
  failure,
}

class FinancialState extends Equatable {
  const FinancialState({
    this.status = FinancialStatus.initial,
    this.bills = const [],
    this.budgetEntries = const [],
    this.activeOperation,
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
  });

  final FinancialStatus status;
  final List<BillModel> bills;
  final List<BudgetEntryModel> budgetEntries;
  final String? activeOperation;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == FinancialStatus.loading;
  bool get hasData => bills.isNotEmpty || budgetEntries.isNotEmpty;

  double get totalIncome => budgetEntries
      .where((entry) => entry.type == 'income')
      .fold(0, (sum, entry) => sum + entry.amount);

  double get totalExpenses => budgetEntries
      .where((entry) => entry.type == 'expense')
      .fold(0, (sum, entry) => sum + entry.amount);

  double get budgetUsed =>
      totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  double get remaining => totalIncome - totalExpenses;

  FinancialState copyWith({
    FinancialStatus? status,
    List<BillModel>? bills,
    List<BudgetEntryModel>? budgetEntries,
    Object? activeOperation = _notSet,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
  }) {
    return FinancialState(
      status: status ?? this.status,
      bills: bills ?? this.bills,
      budgetEntries: budgetEntries ?? this.budgetEntries,
      activeOperation: identical(activeOperation, _notSet)
          ? this.activeOperation
          : activeOperation as String?,
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
        bills,
        budgetEntries,
        activeOperation,
        errorMessage,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();