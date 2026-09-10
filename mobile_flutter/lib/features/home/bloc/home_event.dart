import 'package:equatable/equatable.dart';

import '../../settings/models/settings_models.dart';
import '../models/home_models.dart';

sealed class HomeEvent extends Equatable {
  const HomeEvent();

  @override
  List<Object?> get props => [];
}

final class HomeStarted extends HomeEvent {
  const HomeStarted();
}

final class RefreshHome extends HomeEvent {
  const RefreshHome();
}

final class LoadDailyGuide extends HomeEvent {
  const LoadDailyGuide();
}

final class SendHomeChatMessage extends HomeEvent {
  const SendHomeChatMessage(this.message, {this.careRecipientId});

  final String message;
  final int? careRecipientId;

  @override
  List<Object?> get props => [message, careRecipientId];
}

final class ConfirmHomeChatAction extends HomeEvent {
  const ConfirmHomeChatAction();
}

final class CancelHomeChatAction extends HomeEvent {
  const CancelHomeChatAction();
}

final class ToggleHomeModule extends HomeEvent {
  const ToggleHomeModule(this.moduleId);

  final String moduleId;

  @override
  List<Object?> get props => [moduleId];
}

final class MoveHomeModule extends HomeEvent {
  const MoveHomeModule(this.moduleId, this.direction);

  final String moduleId;
  final int direction;

  @override
  List<Object?> get props => [moduleId, direction];
}

final class SaveHomeModuleConfig extends HomeEvent {
  const SaveHomeModuleConfig(this.modules);

  final List<DashboardModuleModel> modules;

  @override
  List<Object?> get props => [modules];
}

final class ToggleHomeQuickAction extends HomeEvent {
  const ToggleHomeQuickAction(this.actionId);

  final String actionId;

  @override
  List<Object?> get props => [actionId];
}

final class MoveHomeQuickAction extends HomeEvent {
  const MoveHomeQuickAction(this.actionId, this.direction);

  final String actionId;
  final int direction;

  @override
  List<Object?> get props => [actionId, direction];
}

final class ResetHomeQuickActions extends HomeEvent {
  const ResetHomeQuickActions();
}

final class SaveHomeQuickActions extends HomeEvent {
  const SaveHomeQuickActions(this.orderedIds);

  final List<String> orderedIds;

  @override
  List<Object?> get props => [orderedIds];
}

final class SaveHomeQuickActionConfig extends HomeEvent {
  const SaveHomeQuickActionConfig(this.actions);

  final List<HomeQuickAction> actions;

  @override
  List<Object?> get props => [actions];
}