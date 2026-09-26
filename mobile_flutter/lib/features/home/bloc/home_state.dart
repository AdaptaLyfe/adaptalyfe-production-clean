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

enum HomeChatActionStatus { idle, pending, executing, completed, failed, cancelled }

enum HomeCustomizationStatus { idle, saving, success, failure }

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
    this.chatActionStatus = HomeChatActionStatus.idle,
    this.dashboardModules = defaultDashboardModules,
    this.quickActions = defaultHomeQuickActions,
    this.customizationStatus = HomeCustomizationStatus.idle,
    this.customizationMessage,
    this.customizationError,
  });

  final UserModel user;
  final HomeGuideStatus guideStatus;
  final DailyGuideModel? dailyGuide;
  final String? guideError;
  final List<HomeChatMessage> chatMessages;
  final bool chatLoading;
  final String? chatError;
  final HomeChatAction? pendingChatAction;
  final HomeChatActionStatus chatActionStatus;
  final List<DashboardModuleModel> dashboardModules;
  final List<HomeQuickAction> quickActions;
  final HomeCustomizationStatus customizationStatus;
  final String? customizationMessage;
  final String? customizationError;

  HomeLoaded copyWith({
    HomeGuideStatus? guideStatus,
    Object? dailyGuide = _notSet,
    Object? guideError = _notSet,
    List<HomeChatMessage>? chatMessages,
    bool? chatLoading,
    Object? chatError = _notSet,
    Object? pendingChatAction = _notSet,
    HomeChatActionStatus? chatActionStatus,
    List<DashboardModuleModel>? dashboardModules,
    List<HomeQuickAction>? quickActions,
    HomeCustomizationStatus? customizationStatus,
    Object? customizationMessage = _notSet,
    Object? customizationError = _notSet,
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
      chatActionStatus: chatActionStatus ?? this.chatActionStatus,
      dashboardModules: dashboardModules ?? this.dashboardModules,
      quickActions: quickActions ?? this.quickActions,
      customizationStatus:
          customizationStatus ?? this.customizationStatus,
      customizationMessage: identical(customizationMessage, _notSet)
          ? this.customizationMessage
          : customizationMessage as String?,
      customizationError: identical(customizationError, _notSet)
          ? this.customizationError
          : customizationError as String?,
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
        chatActionStatus,
        dashboardModules,
        quickActions,
        customizationStatus,
        customizationMessage,
        customizationError,
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