import '../models/financial_models.dart';
import 'financial_api.dart';

class FinancialRepository {
  const FinancialRepository(this.api);

  final FinancialApi api;

  Future<List<BillModel>> getBills() => api.getBills();

  Future<BillModel> createBill(BillInput input) => api.createBill(input);

  Future<BillModel> updateBill(int id, BillInput input) =>
      api.updateBill(id, input);

  Future<BillModel> updateBillPayment(int id, bool isPaid) =>
      api.updateBillPayment(id, isPaid);

  Future<List<BudgetEntryModel>> getBudgetEntries() =>
      api.getBudgetEntries();

  Future<BudgetEntryModel> createBudgetEntry(BudgetEntryInput input) =>
      api.createBudgetEntry(input);

  Future<void> deleteBudgetEntry(int id) => api.deleteBudgetEntry(id);
}