import '../../../core/network/current_user_api.dart';
import '../../../models/user_model.dart';

class HomeRepository {
  const HomeRepository(this.api);

  final CurrentUserApi api;

  Future<UserModel> getCurrentUser() async {
    final responseData = await api.getCurrentUser();
    final nestedUser = responseData['user'];
    final userData = nestedUser is Map
        ? Map<String, dynamic>.from(nestedUser)
        : responseData;

    return UserModel.fromJson(userData);
  }
}