import 'package:equatable/equatable.dart';

import '../models/financial_models.dart';

sealed class FinancialEvent extends Equatable {
  const FinancialEvent();

  @override
  List<Object?> get props => [];
}

final class FinancialStarted extends FinancialEvent {
  const FinancialStarted();
}

final class RefreshFinancial extends FinancialEvent {
  const RefreshFinancial();
}

final class AddBill extends FinancialEvent {
  const AddBill(this.input);

  final BillInput input;

  @override
  List<Object?> get props => [input];
}

final class EditBill extends FinancialEvent {
  const EditBill({
    required this.billId,
    required this.input,
  });

  final int billId;
  final BillInput input;

  @override
  List<Object?> get props => [billId, input];
}

final class SetBillPaymentStatus extends FinancialEvent {
  const SetBillPaymentStatus({
    required this.billId,
    required this.isPaid,
  });

  final int billId;
  final bool isPaid;

  @override
  List<Object?> get props => [billId, isPaid];
}

final class AddBudgetEntry extends FinancialEvent {
  const AddBudgetEntry(this.input);

  final BudgetEntryInput input;

  @override
  List<Object?> get props => [input];
}

final class DeleteBudgetEntry extends FinancialEvent {
  const DeleteBudgetEntry(this.entryId);

  final int entryId;

  @override
  List<Object?> get props => [entryId];
}