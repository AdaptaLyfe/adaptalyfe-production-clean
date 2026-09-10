import 'package:equatable/equatable.dart';

import '../../../models/user_model.dart';
import '../../settings/models/settings_models.dart';
import '../models/home_models.dart';

sealed class HomeState extends Equatable {
  const HomeState();

  @override
  List<Object?> get props => [];
}

final class HomeInitial extends HomeState {
  const HomeInitial();
}

final class HomeLoading extends HomeState {
  const HomeLoading();
}

enum HomeGuideStatus { initial, loading, loaded, failure }

final class HomeLoaded extends HomeState {
  const HomeLoaded(
    this.user, {
    this.guideStatus = HomeGuideStatus.initial,
    this.dailyGuide,
    this.guideError,
    this.chatMessages = const [],
    this.chatLoading = false,
    this.chatError,
    this.pendingChatAction,
    this.dashboardModules = defaultDashboardModules,
    this.quickActions = defaultHomeQuickActions,
  });

  final UserModel user;
  final HomeGuideStatus guideStatus;
  final DailyGuideModel? dailyGuide;
  final String? guideError;
  final List<HomeChatMessage> chatMessages;
  final bool chatLoading;
  final String? chatError;
  final HomeChatAction? pendingChatAction;
  final List<DashboardModuleModel> dashboardModules;
  final List<HomeQuickAction> quickActions;

  HomeLoaded copyWith({
    HomeGuideStatus? guideStatus,
    Object? dailyGuide = _notSet,
    Object? guideError = _notSet,
    List<HomeChatMessage>? chatMessages,
    bool? chatLoading,
    Object? chatError = _notSet,
    Object? pendingChatAction = _notSet,
    List<DashboardModuleModel>? dashboardModules,
    List<HomeQuickAction>? quickActions,
  }) {
    return HomeLoaded(
      user,
      guideStatus: guideStatus ?? this.guideStatus,
      dailyGuide: identical(dailyGuide, _notSet)
          ? this.dailyGuide
          : dailyGuide as DailyGuideModel?,
      guideError: identical(guideError, _notSet)
          ? this.guideError
          : guideError as String?,
      chatMessages: chatMessages ?? this.chatMessages,
      chatLoading: chatLoading ?? this.chatLoading,
      chatError: identical(chatError, _notSet)
          ? this.chatError
          : chatError as String?,
      pendingChatAction: identical(pendingChatAction, _notSet)
          ? this.pendingChatAction
          : pendingChatAction as HomeChatAction?,
      dashboardModules: dashboardModules ?? this.dashboardModules,
      quickActions: quickActions ?? this.quickActions,
    );
  }

  @override
  List<Object?> get props => [
        user,
        guideStatus,
        dailyGuide,
        guideError,
        chatMessages,
        chatLoading,
        chatError,
        pendingChatAction,
        dashboardModules,
        quickActions,
      ];
}

final class HomeError extends HomeState {
  const HomeError(
    this.message, {
    this.sessionInvalid = false,
  });

  final String message;
  final bool sessionInvalid;

  @override
  List<Object?> get props => [message, sessionInvalid];
}

const _notSet = Object();