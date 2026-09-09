import 'api_client.dart';

/// Shared API boundary for the authenticated current-user endpoint.
///
/// Authentication and Home both consume this endpoint, so its HTTP and
/// response-shape handling lives here instead of being duplicated.
class CurrentUserApi {
  const CurrentUserApi(this.client);

  final ApiClient client;

  Future<Map<String, dynamic>> getCurrentUser() async {
    final response = await client.get<dynamic>('/api/user');
    final data = response.data;

    if (data is! Map) {
      throw const FormatException('Invalid current-user response');
    }

    return Map<String, dynamic>.from(data);
  }
}