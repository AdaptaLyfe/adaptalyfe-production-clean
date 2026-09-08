import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/financial_repository.dart';
import '../models/financial_models.dart';
import 'financial_event.dart';
import 'financial_state.dart';

class FinancialBloc extends Bloc<FinancialEvent, FinancialState> {
  FinancialBloc(this.repository) : super(const FinancialState()) {
    on<FinancialStarted>(_loadFinancial);
    on<RefreshFinancial>(_loadFinancial);
    on<AddBill>(_addBill);
    on<EditBill>(_editBill);
    on<SetBillPaymentStatus>(_setBillPaymentStatus);
    on<AddBudgetEntry>(_addBudgetEntry);
    on<DeleteBudgetEntry>(_deleteBudgetEntry);
  }

  final FinancialRepository repository;

  Future<void> _loadFinancial(
    FinancialEvent event,
    Emitter<FinancialState> emit,
  ) async {
    emit(
      state.copyWith(
        status: FinancialStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );

    try {
      final results = await Future.wait([
        repository.getBills(),
        repository.getBudgetEntries(),
      ]);
      await _emitLoaded(
        emit,
        bills: results[0] as List<BillModel>,
        budgetEntries: results[1] as List<BudgetEntryModel>,
      );
    } on ApiException catch (error) {
      _emitFailure(emit, error);
    } catch (error) {
      _emitFailure(emit, error);
    }
  }

  Future<void> _addBill(AddBill event, Emitter<FinancialState> emit) async {
    await _runMutation(
      emit,
      operation: 'add-bill',
      successMessage: 'Bill added successfully.',
      action: () => repository.createBill(event.input),
    );
  }

  Future<void> _editBill(EditBill event, Emitter<FinancialState> emit) async {
    await _runMutation(
      emit,
      operation: 'edit-bill',
      successMessage: 'Bill updated successfully.',
      action: () => repository.updateBill(event.billId, event.input),
    );
  }

  Future<void> _setBillPaymentStatus(
    SetBillPaymentStatus event,
    Emitter<FinancialState> emit,
  ) async {
    await _runMutation(
      emit,
      operation: 'pay-bill-${event.billId}',
      successMessage:
          event.isPaid ? 'Bill marked as paid.' : 'Bill marked as unpaid.',
      action: () => repository.updateBillPayment(event.billId, event.isPaid),
    );
  }

  Future<void> _addBudgetEntry(
    AddBudgetEntry event,
    Emitter<FinancialState> emit,
  ) async {
    await _runMutation(
      emit,
      operation: 'add-budget-entry',
      successMessage: 'Financial entry added successfully.',
      action: () => repository.createBudgetEntry(event.input),
    );
  }

  Future<void> _deleteBudgetEntry(
    DeleteBudgetEntry event,
    Emitter<FinancialState> emit,
  ) async {
    await _runMutation(
      emit,
      operation: 'delete-budget-entry-${event.entryId}',
      successMessage: 'Financial record deleted.',
      action: () => repository.deleteBudgetEntry(event.entryId),
    );
  }

  Future<void> _runMutation<T>(
    Emitter<FinancialState> emit, {
    required String operation,
    required String successMessage,
    required Future<T> Function() action,
  }) async {
    emit(
      state.copyWith(
        activeOperation: operation,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );

    try {
      await action();
      final results = await Future.wait([
        repository.getBills(),
        repository.getBudgetEntries(),
      ]);
      await _emitLoaded(
        emit,
        bills: results[0] as List<BillModel>,
        budgetEntries: results[1] as List<BudgetEntryModel>,
        actionMessage: successMessage,
      );
    } on ApiException catch (error) {
      _emitFailure(emit, error);
    } catch (error) {
      _emitFailure(emit, error);
    }
  }

  Future<void> _emitLoaded(
    Emitter<FinancialState> emit, {
    required List<BillModel> bills,
    required List<BudgetEntryModel> budgetEntries,
    String? actionMessage,
  }) async {
    emit(
      state.copyWith(
        status: FinancialStatus.loaded,
        bills: bills,
        budgetEntries: budgetEntries,
        activeOperation: null,
        errorMessage: null,
        actionMessage: actionMessage,
        sessionInvalid: false,
      ),
    );
  }

  void _emitFailure(Emitter<FinancialState> emit, Object error) {
    final message = error is ApiException
        ? error.message
        : error is FormatException
            ? error.message
            : 'Unable to update your financial information. Please try again.';

    emit(
      state.copyWith(
        status: state.hasData ? FinancialStatus.loaded : FinancialStatus.failure,
        activeOperation: null,
        errorMessage: message,
        sessionInvalid:
            error is ApiException && error.type == ApiErrorType.unauthorized,
      ),
    );
  }
}