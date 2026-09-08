import '../../../core/network/api_client.dart';
import '../models/financial_models.dart';

class FinancialApi {
  const FinancialApi(this.client);

  final ApiClient client;

  Future<List<BillModel>> getBills() async {
    final response = await client.get<dynamic>('/api/bills');
    return _parseList(response.data, BillModel.fromJson, 'bills');
  }

  Future<BillModel> createBill(BillInput input) async {
    final response = await client.post<dynamic>(
      '/api/bills',
      data: input.toJson(),
    );
    return BillModel.fromJson(_parseMap(response.data, 'bill'));
  }

  Future<BillModel> updateBill(int id, BillInput input) async {
    final response = await client.patch<dynamic>(
      '/api/bills/$id',
      data: input.toJson(),
    );
    return BillModel.fromJson(_parseMap(response.data, 'bill'));
  }

  Future<BillModel> updateBillPayment(int id, bool isPaid) async {
    final response = await client.patch<dynamic>(
      '/api/bills/$id/pay',
      data: {'isPaid': isPaid},
    );
    return BillModel.fromJson(_parseMap(response.data, 'bill'));
  }

  Future<List<BudgetEntryModel>> getBudgetEntries() async {
    final response = await client.get<dynamic>('/api/budget-entries');
    return _parseList(
      response.data,
      BudgetEntryModel.fromJson,
      'budget entries',
    );
  }

  Future<BudgetEntryModel> createBudgetEntry(BudgetEntryInput input) async {
    final response = await client.post<dynamic>(
      '/api/budget-entries',
      data: input.toJson(),
    );
    return BudgetEntryModel.fromJson(
      _parseMap(response.data, 'budget entry'),
    );
  }

  Future<void> deleteBudgetEntry(int id) async {
    await client.delete<dynamic>('/api/budget-entries/$id');
  }

  List<T> _parseList<T>(
    dynamic data,
    T Function(Map<String, dynamic>) parser,
    String label,
  ) {
    if (data is! List) {
      throw FormatException('Invalid $label response');
    }

    return data
        .whereType<Map>()
        .map((item) => parser(Map<String, dynamic>.from(item)))
        .toList();
  }

  Map<String, dynamic> _parseMap(dynamic data, String label) {
    if (data is! Map) {
      throw FormatException('Invalid $label response');
    }
    return Map<String, dynamic>.from(data);
  }
}