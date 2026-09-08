import '../../../core/network/api_client.dart';
import '../../../models/user_model.dart';

class HomeRepository {
  const HomeRepository(this.apiClient);

  final ApiClient apiClient;

  Future<UserModel> getCurrentUser() async {
    final response = await apiClient.get<dynamic>('/api/user');
    final payload = response.data;

    if (payload is! Map) {
      throw const FormatException('Invalid current-user response');
    }

    final responseData = Map<String, dynamic>.from(payload);
    final nestedUser = responseData['user'];
    final userData = nestedUser is Map
        ? Map<String, dynamic>.from(nestedUser)
        : responseData;

    return UserModel.fromJson(userData);
  }
}