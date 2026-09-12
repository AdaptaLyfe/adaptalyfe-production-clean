import '../../../core/network/current_user_api.dart';
import '../../../core/network/api_client.dart';
import '../../settings/data/dashboard_layout_store.dart';
import '../../settings/models/settings_models.dart';
import '../../../models/user_model.dart';
import '../models/home_models.dart';
import 'home_quick_actions_store.dart';

class HomeRepository {
  const HomeRepository(
    this.api,
    this.client,
    this.dashboardLayoutStore,
    this.quickActionsStore,
  );

  final CurrentUserApi api;
  final ApiClient client;
  final DashboardLayoutStore dashboardLayoutStore;
  final HomeQuickActionsStore quickActionsStore;

  Future<UserModel> getCurrentUser() async {
    final responseData = await api.getCurrentUser();
    final nestedUser = responseData['user'];
    final userData = nestedUser is Map
        ? Map<String, dynamic>.from(nestedUser)
        : responseData;

    return UserModel.fromJson(userData);
  }

  Future<DailyGuideModel> getDailyGuide() async {
    final now = DateTime.now();
    final response = await client.post<dynamic>(
      '/api/ai/daily-guide',
      data: {
        'localDate': _dateOnly(now),
        'localTime': _timeOnly(now),
        'timezone': now.timeZoneName,
      },
    );
    if (response.data is! Map) {
      throw const FormatException('Invalid daily guide response');
    }
    return DailyGuideModel.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  Future<Map<String, dynamic>> sendChatMessage(
    String message, {
    int? careRecipientId,
  }) async {
    final now = DateTime.now();
    final response = await client.post<dynamic>(
      '/api/chat',
      data: {
        'message': message.trim(),
        'localDate': _dateOnly(now),
        'localTime': _timeOnly(now),
        'timezone': now.timeZoneName,
        if (careRecipientId != null) 'careRecipientId': careRecipientId,
      },
    );
    if (response.data is! Map) {
      throw const FormatException('Invalid AdaptAI response');
    }
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> executeChatAction(
    HomeChatAction action,
  ) async {
    final response = await client.post<dynamic>(
      '/api/ai/actions/execute',
      data: {
        'action': action.action,
        'parameters': action.parameters,
        'confirmed': true,
      },
    );
    if (response.data is! Map) {
      throw const FormatException('Invalid AdaptAI action response');
    }
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<List<DashboardModuleModel>> loadDashboardModules() =>
      dashboardLayoutStore.load();

  Future<void> saveDashboardModules(List<DashboardModuleModel> modules) =>
      dashboardLayoutStore.save(modules);

  Future<void> resetDashboardModules() => dashboardLayoutStore.reset();

  Future<List<HomeQuickAction>> loadQuickActions() =>
      quickActionsStore.load();

  Future<void> saveQuickActions(List<HomeQuickAction> actions) =>
      quickActionsStore.save(actions);

  Future<void> resetQuickActions() => quickActionsStore.reset();

  static String _dateOnly(DateTime value) =>
      '${value.year.toString().padLeft(4, '0')}-${value.month.toString().padLeft(2, '0')}-${value.day.toString().padLeft(2, '0')}';

  static String _timeOnly(DateTime value) =>
      '${value.hour.toString().padLeft(2, '0')}:${value.minute.toString().padLeft(2, '0')}';
}