import '../../../core/network/api_client.dart';

/// API boundary for the existing Adaptalyfe authentication endpoints.
class AuthApi {
  const AuthApi(this.client);

  final ApiClient client;

  Future<Map<String, dynamic>> login({
    required String username,
    required String password,
  }) {
    return _asObject(
      client.post<dynamic>(
        '/api/login',
        data: {
          'username': username,
          'password': password,
        },
      ),
    );
  }

  Future<Map<String, dynamic>> register({
    required String name,
    String? email,
    required String username,
    required String password,
    String plan = 'basic',
    bool subscribeNewsletter = false,
  }) {
    return _asObject(
      client.post<dynamic>(
        '/api/register',
        data: {
          'name': name,
          'email': email,
          'username': username,
          'password': password,
          'plan': plan,
          'subscribeNewsletter': subscribeNewsletter,
        },
      ),
    );
  }

  Future<Map<String, dynamic>> getCurrentUser() {
    return _asObject(client.get<dynamic>('/api/user'));
  }

  Future<Map<String, dynamic>> logout() {
    return _asObject(
      client.post<dynamic>(
        '/api/logout',
        data: <String, dynamic>{},
      ),
    );
  }

  Future<Map<String, dynamic>> _asObject(
    Future<ApiResponse<dynamic>> request,
  ) async {
    final response = await request;
    final data = response.data;

    if (data is Map) {
      return Map<String, dynamic>.from(data);
    }

    throw const FormatException('Expected an object response from the API');
  }
}