import 'package:bloc/bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/home_repository.dart';
import 'home_event.dart';
import 'home_state.dart';
import '../models/home_models.dart';
import '../../settings/models/settings_models.dart';

EventTransformer<T> _sequential<T>() {
  return (events, mapper) => events.asyncExpand(mapper);
}

class HomeBloc extends Bloc<HomeEvent, HomeState> {
  HomeBloc(this.repository) : super(const HomeInitial()) {
    on<HomeStarted>(_loadHome);
    on<RefreshHome>(_loadHome);
    on<LoadDailyGuide>(_loadDailyGuide);
    on<SendHomeChatMessage>(_sendChatMessage);
    on<ConfirmHomeChatAction>(_confirmChatAction);
    on<CancelHomeChatAction>(_cancelChatAction);
    on<HomeCustomizationEvent>(
      _handleCustomizationEvent,
      transformer: _sequential(),
    );
  }

  final HomeRepository repository;
  Future<void> _customizationSaveQueue = Future<void>.value();
  int _customizationOperation = 0;

  Future<void> _handleCustomizationEvent(
    HomeCustomizationEvent event,
    Emitter<HomeState> emit,
  ) {
    if (event is ToggleHomeModule) return _toggleModule(event, emit);
    if (event is MoveHomeModule) return _moveModule(event, emit);
    if (event is SaveHomeModuleConfig) {
      return _saveModuleConfig(event, emit);
    }
    if (event is ResetHomeModules) return _resetModules(event, emit);
    if (event is ToggleHomeQuickAction) {
      return _toggleQuickAction(event, emit);
    }
    if (event is MoveHomeQuickAction) return _moveQuickAction(event, emit);
    if (event is ResetHomeQuickActions) {
      return _resetQuickActions(event, emit);
    }
    if (event is SaveHomeQuickActions) {
      return _saveQuickActions(event, emit);
    }
    return _saveQuickActionConfig(event as SaveHomeQuickActionConfig, emit);
  }

  Future<void> _loadHome(
    HomeEvent event,
    Emitter<HomeState> emit,
  ) async {
    await _customizationSaveQueue;
    emit(const HomeLoading());

    try {
      final user = await repository.getCurrentUser();
      final modules = await repository.loadDashboardModules(user.id);
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
    await _saveDashboardModules(
      emit,
      updated,
      save: (userId) => repository.saveDashboardModules(userId, updated),
      successMessage: 'Dashboard updated.',
    );
  }

  Future<void> _moveModule(
    MoveHomeModule event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    final modules = [...current.dashboardModules];
    final enabledIndexes = [
      for (var index = 0; index < modules.length; index++)
        if (modules[index].enabled) index,
    ];
    final index = enabledIndexes.indexWhere(
      (moduleIndex) => modules[moduleIndex].id == event.moduleId,
    );
    final next = index + event.direction;
    if (index < 0 || next < 0 || next >= enabledIndexes.length) return;
    final firstIndex = enabledIndexes[index];
    final secondIndex = enabledIndexes[next];
    final first = modules[firstIndex];
    modules[firstIndex] = modules[secondIndex].copyWith(order: first.order);
    modules[secondIndex] = first.copyWith(order: modules[secondIndex].order);
    final updated = _normalizeModules(modules);
    await _saveDashboardModules(
      emit,
      updated,
      save: (userId) => repository.saveDashboardModules(userId, updated),
      successMessage: 'Dashboard order saved.',
    );
  }

  Future<void> _saveModuleConfig(
    SaveHomeModuleConfig event,
    Emitter<HomeState> emit,
  ) async {
    final updated = _normalizeModules(event.modules);
    var saved = false;
    try {
      saved = await _saveDashboardModules(
        emit,
        updated,
        save: (userId) => repository.saveDashboardModules(userId, updated),
        successMessage: 'Dashboard customization saved.',
      );
    } finally {
      final completion = event.completion;
      if (completion != null && !completion.isCompleted) {
        completion.complete(saved);
      }
    }
  }

  Future<void> _resetModules(
    ResetHomeModules event,
    Emitter<HomeState> emit,
  ) async {
    final defaults = _normalizeModules(defaultDashboardModules);
    var saved = false;
    try {
      saved = await _saveDashboardModules(
        emit,
        defaults,
        save: repository.resetDashboardModules,
        successMessage: 'Dashboard reset to default.',
      );
    } finally {
      final completion = event.completion;
      if (completion != null && !completion.isCompleted) {
        completion.complete(saved);
      }
    }
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
    await _saveCustomization(
      emit,
      current.copyWith(
        quickActions: updated,
        customizationStatus: HomeCustomizationStatus.saving,
        customizationMessage: null,
        customizationError: null,
      ),
      () => repository.saveQuickActions(updated),
      'Quick Actions updated.',
    );
  }

  Future<void> _moveQuickAction(
    MoveHomeQuickAction event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    final actions = [...current.quickActions];
    final visibleIndexes = [
      for (var index = 0; index < actions.length; index++)
        if (actions[index].visible) index,
    ];
    final index = visibleIndexes.indexWhere(
      (actionIndex) => actions[actionIndex].id == event.actionId,
    );
    final next = index + event.direction;
    if (index < 0 || next < 0 || next >= visibleIndexes.length) return;
    final firstIndex = visibleIndexes[index];
    final secondIndex = visibleIndexes[next];
    final item = actions[firstIndex];
    actions[firstIndex] = actions[secondIndex];
    actions[secondIndex] = item;
    await _saveCustomization(
      emit,
      current.copyWith(
        quickActions: actions,
        customizationStatus: HomeCustomizationStatus.saving,
        customizationMessage: null,
        customizationError: null,
      ),
      () => repository.saveQuickActions(actions),
      'Quick Actions order saved.',
    );
  }

  Future<void> _resetQuickActions(
    ResetHomeQuickActions event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    await _saveCustomization(
      emit,
      current.copyWith(
        quickActions: defaultHomeQuickActions,
        customizationStatus: HomeCustomizationStatus.saving,
        customizationMessage: null,
        customizationError: null,
      ),
      repository.resetQuickActions,
      'Quick Actions reset to default.',
    );
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
    await _saveCustomization(
      emit,
      current.copyWith(
        quickActions: ordered,
        customizationStatus: HomeCustomizationStatus.saving,
        customizationMessage: null,
        customizationError: null,
      ),
      () => repository.saveQuickActions(ordered),
      'Quick Actions order saved.',
    );
  }

  Future<void> _saveQuickActionConfig(
    SaveHomeQuickActionConfig event,
    Emitter<HomeState> emit,
  ) async {
    final current = state;
    if (current is! HomeLoaded) return;
    await _saveCustomization(
      emit,
      current.copyWith(
        quickActions: event.actions,
        customizationStatus: HomeCustomizationStatus.saving,
        customizationMessage: null,
        customizationError: null,
      ),
      () => repository.saveQuickActions(event.actions),
      'Quick Actions updated.',
    );
  }

  Future<bool> _saveDashboardModules(
    Emitter<HomeState> emit,
    List<DashboardModuleModel> modules, {
    required Future<void> Function(int userId) save,
    required String successMessage,
  }) async {
    final current = state;
    if (current is! HomeLoaded) return false;
    final normalized = _normalizeModules(modules);
    return _saveCustomization(
      emit,
      current.copyWith(
        customizationStatus: HomeCustomizationStatus.saving,
        customizationMessage: null,
        customizationError: null,
      ),
      () => save(current.user.id),
      successMessage,
      onSaved: (latest) => latest.copyWith(dashboardModules: normalized),
    );
  }

  Future<bool> _saveCustomization(
    Emitter<HomeState> emit,
    HomeLoaded optimistic,
    Future<void> Function() save,
    String successMessage, {
    HomeLoaded Function(HomeLoaded latest)? onSaved,
  }) async {
    emit(optimistic);
    final operationId = ++_customizationOperation;
    final saveOperation = _customizationSaveQueue.then((_) => save());
    _customizationSaveQueue = saveOperation.catchError((_) {});
    try {
      await saveOperation;
      if (operationId != _customizationOperation) return false;
      final latest = state;
      if (latest is HomeLoaded) {
        emit(
          (onSaved?.call(latest) ?? latest).copyWith(
            customizationStatus: HomeCustomizationStatus.success,
            customizationMessage: successMessage,
            customizationError: null,
          ),
        );
      }
      return true;
    } catch (error) {
      if (operationId != _customizationOperation) return false;
      final latest = state;
      if (latest is HomeLoaded) {
        emit(
          latest.copyWith(
            customizationStatus: HomeCustomizationStatus.failure,
            customizationMessage: null,
            customizationError: _messageFor(error),
          ),
        );
      }
      return false;
    }
  }

  List<DashboardModuleModel> _normalizeModules(
    List<DashboardModuleModel> modules,
  ) {
    final seen = <String>{};
    final normalized = <DashboardModuleModel>[];
    for (final module in modules) {
      if (seen.add(module.id)) normalized.add(module);
    }
    return [
      for (var index = 0; index < normalized.length; index++)
        normalized[index].copyWith(order: index),
    ];
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