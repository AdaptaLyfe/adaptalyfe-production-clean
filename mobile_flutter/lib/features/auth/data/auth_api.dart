import '../../../core/network/api_client.dart';
import '../../../core/network/current_user_api.dart';

/// API boundary for the existing Adaptalyfe authentication endpoints.
class AuthApi {
  AuthApi(this.client) : _currentUserApi = CurrentUserApi(client);

  final ApiClient client;
  final CurrentUserApi _currentUserApi;

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
    return _currentUserApi.getCurrentUser();
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