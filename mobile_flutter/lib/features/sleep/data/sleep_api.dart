import '../../../core/network/api_client.dart';
import '../models/sleep_models.dart';

class SleepApi {
  const SleepApi(this.client);

  final ApiClient client;

  Future<List<SleepSessionModel>> getSessions() =>
      _getList('/api/sleep-sessions', SleepSessionModel.fromJson);

  Future<SleepSessionModel> getSessionByDate(String sleepDate) async {
    final response =
        await client.get<dynamic>('/api/sleep-sessions/date/$sleepDate');
    return _parseItem(response.data, SleepSessionModel.fromJson);
  }

  Future<SleepSessionModel> createSession(SleepSessionInput input) =>
      _post('/api/sleep-sessions', input.toJson(), SleepSessionModel.fromJson);

  Future<SleepSessionModel> updateSession(
    int id,
    SleepSessionInput input,
  ) =>
      _put(
        '/api/sleep-sessions/$id',
        input.toJson(),
        SleepSessionModel.fromJson,
      );

  Future<void> deleteSession(int id) async {
    await client.delete<dynamic>('/api/sleep-sessions/$id');
  }

  Future<List<T>> _getList<T>(
    String path,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.get<dynamic>(path);
    if (response.data is! List) {
      throw const FormatException('Invalid sleep session collection response');
    }
    return (response.data as List)
        .whereType<Map>()
        .map((item) => fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<T> _post<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.post<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  Future<T> _put<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.put<dynamic>(path, data: data);
    return _parseItem(response.data, fromJson);
  }

  T _parseItem<T>(
    Object? data,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    if (data is! Map) {
      throw const FormatException('Invalid sleep session response');
    }
    return fromJson(Map<String, dynamic>.from(data));
  }
}