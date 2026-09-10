import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/home_repository.dart';
import 'home_event.dart';
import 'home_state.dart';
import '../../settings/models/settings_models.dart';

class HomeBloc extends Bloc<HomeEvent, HomeState> {
  HomeBloc(this.repository) : super(const HomeInitial()) {
    on<HomeStarted>(_loadHome);
    on<RefreshHome>(_loadHome);
    on<LoadDailyGuide>(_loadDailyGuide);
    on<SendHomeChatMessage>(_sendChatMessage);
    on<ConfirmHomeChatAction>(_confirmChatAction);
    on<CancelHomeChatAction>(_cancelChatAction);
    on<ToggleHomeModule>(_toggleModule);
    on<MoveHomeModule>(_moveModule);
    on<SaveHomeModuleConfig>(_saveModuleConfig);
    on<ToggleHomeQuickAction>(_toggleQuickAction);
    on<MoveHomeQuickAction>(_moveQuickAction);
    on<ResetHomeQuickActions>(_resetQuickActions);
    on<SaveHomeQuickActions>(_saveQuickActions);
    on<SaveHomeQuickActionConfig>(_saveQuickActionConfig);
  }

  final HomeRepository repository;

  Future<void> _loadHome(
    HomeEvent event,
    Emitter<HomeState> emit,
  ) async {
    emit(const HomeLoading());

    try {
      final user = await repository.getCurrentUser();
      final modules = await repository.loadDashboardModules();
      final quickActions = await repository.loadQuickActions();
      emit(
        HomeLoaded(
          user,
          dashboardModules: modules,
          quickActions: quickActions,
        ),
      );
      add(const LoadDailyGuide());
    } on ApiException catch (error) {
      emit(
        HomeError(
          error.message,
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (error) {
      emit(HomeError(_messageFor(error)));
    }
  }

  Future<void> _loadDailyGuide(
    LoadDailyGuide event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    emit(current.copyWith(
      guideStatus: HomeGuideStatus.loading,
      guideError: null,
    ));
    try {
      final guide = await repository.getDailyGuide();
      final latest = state;
      if (latest is HomeLoaded) {
        emit(latest.copyWith(
          guideStatus: HomeGuideStatus.loaded,
          dailyGuide: guide,
          guideError: null,
        ));
      }
    } on ApiException catch (error) {
      final latest = state;
      if (latest is HomeLoaded) {
        emit(latest.copyWith(
          guideStatus: HomeGuideStatus.failure,
          guideError: error.message,
        ));
      }
    } catch (error) {
      final latest = state;
      if (latest is HomeLoaded) {
        emit(latest.copyWith(
          guideStatus: HomeGuideStatus.failure,
          guideError: _messageFor(error),
        ));
      }
    }
  }

  Future<void> _sendChatMessage(
    SendHomeChatMessage event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded || event.message.trim().isEmpty) return;
    final messages = [
      ...current.chatMessages,
      HomeChatMessage(
        text: event.message.trim(),
        isUser: true,
        timestamp: DateTime.now(),
      ),
    ];
    emit(current.copyWith(
      chatMessages: messages,
      chatLoading: true,
      chatError: null,
    ));
    try {
      final response = await repository.sendChatMessage(
        event.message,
        careRecipientId: event.careRecipientId,
      );
      final answer = _chatText(response);
      final action = _chatAction(response);
      final latest = state;
      if (latest is HomeLoaded) {
        emit(latest.copyWith(
          chatMessages: [
            ...latest.chatMessages,
            HomeChatMessage(
              text: answer,
              isUser: false,
              timestamp: DateTime.now(),
            ),
          ],
          chatLoading: false,
          pendingChatAction: action,
          chatActionStatus: action == null
              ? HomeChatActionStatus.idle
              : HomeChatActionStatus.pending,
        ));
      }
    } on ApiException catch (error) {
      _emitChatError(error.message, emit);
    } catch (error) {
      _emitChatError(_messageFor(error), emit);
    }
  }

  Future<void> _confirmChatAction(
    ConfirmHomeChatAction event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded || current.pendingChatAction == null) return;
    emit(current.copyWith(
      chatLoading: true,
      chatError: null,
      chatActionStatus: HomeChatActionStatus.executing,
    ));
    try {
      final response =
          await repository.executeChatAction(current.pendingChatAction!);
      final message = _chatText(response, fallback: 'Done — I made that change.');
      final latest = state;
      if (latest is HomeLoaded) {
        emit(latest.copyWith(
          chatMessages: [
            ...latest.chatMessages,
            HomeChatMessage(
              text: message,
              isUser: false,
              timestamp: DateTime.now(),
            ),
          ],
          chatLoading: false,
          pendingChatAction: null,
          chatActionStatus: HomeChatActionStatus.completed,
        ));
      }
    } on ApiException catch (error) {
      _emitChatError(
        error.message,
        emit,
        actionFailed: true,
      );
    } catch (error) {
      _emitChatError(
        _messageFor(error),
        emit,
        actionFailed: true,
      );
    }
  }

  void _cancelChatAction(
    CancelHomeChatAction event,
    Emitter<HomeState> emit,
  ) {
    final current = state;
    if (current is HomeLoaded) {
      emit(current.copyWith(
        pendingChatAction: null,
        chatLoading: false,
        chatActionStatus: HomeChatActionStatus.cancelled,
        chatMessages: [
          ...current.chatMessages,
            HomeChatMessage(
              text: 'Cancelled.',
              isUser: false,
              timestamp: DateTime.now(),
            ),
        ],
      ));
    }
  }

  Future<void> _toggleModule(
    ToggleHomeModule event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    final updated = current.dashboardModules
        .map((module) => module.id == event.moduleId
            ? module.copyWith(enabled: !module.enabled)
            : module)
        .toList();
    emit(current.copyWith(dashboardModules: updated));
    await repository.saveDashboardModules(updated);
  }

  Future<void> _moveModule(
    MoveHomeModule event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    final modules = [...current.dashboardModules];
    final index = modules.indexWhere((module) => module.id == event.moduleId);
    final next = index + event.direction;
    if (index < 0 || next < 0 || next >= modules.length) return;
    final item = modules.removeAt(index);
    modules.insert(next, item);
    final updated = [
      for (var index = 0; index < modules.length; index++)
        modules[index].copyWith(order: index),
    ];
    emit(current.copyWith(dashboardModules: updated));
    await repository.saveDashboardModules(updated);
  }

  Future<void> _saveModuleConfig(
    SaveHomeModuleConfig event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    emit(current.copyWith(dashboardModules: event.modules));
    await repository.saveDashboardModules(event.modules);
  }

  Future<void> _toggleQuickAction(
    ToggleHomeQuickAction event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    final updated = current.quickActions
        .map((action) => action.id == event.actionId
            ? action.copyWith(visible: !action.visible)
            : action)
        .toList();
    emit(current.copyWith(quickActions: updated));
    await repository.saveQuickActions(updated);
  }

  Future<void> _moveQuickAction(
    MoveHomeQuickAction event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    final actions = [...current.quickActions];
    final index = actions.indexWhere((action) => action.id == event.actionId);
    final next = index + event.direction;
    if (index < 0 || next < 0 || next >= actions.length) return;
    final action = actions.removeAt(index);
    actions.insert(next, action);
    emit(current.copyWith(quickActions: actions));
    await repository.saveQuickActions(actions);
  }

  Future<void> _resetQuickActions(
    ResetHomeQuickActions event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    await repository.resetQuickActions();
    emit(current.copyWith(quickActions: defaultHomeQuickActions));
  }

  Future<void> _saveQuickActions(
    SaveHomeQuickActions event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    final byId = {
      for (final action in current.quickActions) action.id: action,
    };
    final ordered = [
      for (final id in event.orderedIds)
        if (byId[id] != null) byId[id]!,
      for (final action in current.quickActions)
        if (!event.orderedIds.contains(action.id)) action,
    ];
    emit(current.copyWith(quickActions: ordered));
    await repository.saveQuickActions(ordered);
  }

  Future<void> _saveQuickActionConfig(
    SaveHomeQuickActionConfig event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    emit(current.copyWith(quickActions: event.actions));
    await repository.saveQuickActions(event.actions);
  }

  void _emitChatError(
    String message,
    Emitter<HomeState> emit, {
    bool actionFailed = false,
  }) {
    final current = state;
    if (current is HomeLoaded) {
      emit(current.copyWith(
        chatLoading: false,
        chatError: message,
        chatActionStatus: actionFailed
            ? HomeChatActionStatus.failed
            : current.chatActionStatus,
          chatMessages: [
            ...current.chatMessages,
            HomeChatMessage(
              text: 'I could not complete that request right now. Please try again.',
              isUser: false,
              isError: true,
              timestamp: DateTime.now(),
            ),
          ],
      ));
    }
  }

  String _chatText(
    Map<String, dynamic> response, {
    String fallback = 'I am here to help you plan what is next.',
  }) {
    for (final key in const ['message', 'response', 'reply', 'text']) {
      final value = response[key];
      if (value is String && value.trim().isNotEmpty) return value.trim();
    }
    return fallback;
  }

  HomeChatAction? _chatAction(Map<String, dynamic> response) {
    final raw = response['action'] ?? response['proposedAction'];
    if (raw is Map) {
      return HomeChatAction.fromJson(Map<String, dynamic>.from(raw));
    }
    return null;
  }

  String _messageFor(Object error) {
    if (error is ApiException) {
      return error.message;
    }
    if (error is FormatException) {
      return error.message;
    }
    return 'Unable to load your dashboard. Please try again.';
  }
}