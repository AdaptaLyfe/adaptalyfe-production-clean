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

sealed class HomeCustomizationEvent extends HomeEvent {
  const HomeCustomizationEvent();
}

final class ToggleHomeModule extends HomeCustomizationEvent {
  const ToggleHomeModule(this.moduleId);

  final String moduleId;

  @override
  List<Object?> get props => [moduleId];
}

final class MoveHomeModule extends HomeCustomizationEvent {
  const MoveHomeModule(this.moduleId, this.direction);

  final String moduleId;
  final int direction;

  @override
  List<Object?> get props => [moduleId, direction];
}

final class SaveHomeModuleConfig extends HomeCustomizationEvent {
  const SaveHomeModuleConfig(this.modules);

  final List<DashboardModuleModel> modules;

  @override
  List<Object?> get props => [modules];
}

final class ResetHomeModules extends HomeCustomizationEvent {
  const ResetHomeModules();
}

final class ToggleHomeQuickAction extends HomeCustomizationEvent {
  const ToggleHomeQuickAction(this.actionId);

  final String actionId;

  @override
  List<Object?> get props => [actionId];
}

final class MoveHomeQuickAction extends HomeCustomizationEvent {
  const MoveHomeQuickAction(this.actionId, this.direction);

  final String actionId;
  final int direction;

  @override
  List<Object?> get props => [actionId, direction];
}

final class ResetHomeQuickActions extends HomeCustomizationEvent {
  const ResetHomeQuickActions();
}

final class SaveHomeQuickActions extends HomeCustomizationEvent {
  const SaveHomeQuickActions(this.orderedIds);

  final List<String> orderedIds;

  @override
  List<Object?> get props => [orderedIds];
}

final class SaveHomeQuickActionConfig extends HomeCustomizationEvent {
  const SaveHomeQuickActionConfig(this.actions);

  final List<HomeQuickAction> actions;

  @override
  List<Object?> get props => [actions];
}