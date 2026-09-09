import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../../core/notifications/native_notification_service.dart';
import '../bloc/notifications_bloc.dart';
import '../bloc/notifications_event.dart';
import '../bloc/notifications_state.dart';
import '../models/notification_model.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<NotificationsBloc, NotificationsState>(
      listener: (context, state) {
        if (state.sessionInvalid) {
          context.read<AuthBloc>().add(const CheckAuthentication());
          return;
        }

        final message = state.actionMessage ?? state.errorMessage;
        if (message != null && message.isNotEmpty) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                content: Text(message),
                backgroundColor:
                    state.errorMessage != null ? const Color(0xFFB91C1C) : null,
              ),
            );
        }
      },
      builder: (context, state) {
        return Scaffold(
          appBar: AppBar(
            title: Row(
              children: [
                const Text('Notifications'),
                if (state.unreadCount > 0) ...[
                  const SizedBox(width: 10),
                  _UnreadBadge(count: state.unreadCount),
                ],
              ],
            ),
            actions: [
              IconButton(
                tooltip: 'Enable device notifications',
                onPressed: () async {
                  final permission = await NativeNotificationService.instance
                      .requestPermission();
                  if (!context.mounted) return;
                  final message = permission ==
                          NativeNotificationPermission.granted
                      ? 'Device notifications are enabled.'
                      : 'Device notification permission was not granted.';
                  ScaffoldMessenger.of(context)
                    ..hideCurrentSnackBar()
                    ..showSnackBar(SnackBar(content: Text(message)));
                },
                icon: const Icon(Icons.notifications_active_outlined),
              ),
              IconButton(
                tooltip: 'Refresh notifications',
                onPressed: () => context
                    .read<NotificationsBloc>()
                    .add(const RefreshNotifications()),
                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
          ),
          body: _NotificationsBody(state: state),
        );
      },
    );
  }
}

class _NotificationsBody extends StatelessWidget {
  const _NotificationsBody({required this.state});

  final NotificationsState state;

  @override
  Widget build(BuildContext context) {
    if (state.isLoading && !state.hasNotifications) {
      return const _NotificationsLoading();
    }

    if (state.status == NotificationsStatus.failure &&
        !state.hasNotifications) {
      return _NotificationsError(
        message: state.errorMessage ?? 'Unable to load your notifications.',
        onRetry: () {
          context.read<NotificationsBloc>().add(const RefreshNotifications());
        },
      );
    }

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFFEFF6FF),
            Color(0xFFF5F3FF),
            Color(0xFFF0FDFA),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: RefreshIndicator(
        onRefresh: () => _refresh(context),
        child: state.notifications.isEmpty
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                children: const [
                  SizedBox(height: 120),
                  _EmptyNotifications(),
                ],
              )
            : ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
                children: [
                  if (state.isLoading) const LinearProgressIndicator(),
                  if (state.isLoading) const SizedBox(height: 12),
                  const Text(
                    'Your notifications',
                    style: TextStyle(
                      color: Color(0xFF111827),
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    state.unreadCount == 0
                        ? 'You are all caught up.'
                        : '${state.unreadCount} unread notification'
                            '${state.unreadCount == 1 ? '' : 's'}',
                    style: const TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ...state.notifications.map(
                    (notification) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _NotificationCard(
                        notification: notification,
                        markingNotificationId: state.markingNotificationId,
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Future<void> _refresh(BuildContext context) async {
    final bloc = context.read<NotificationsBloc>();
    bloc.add(const RefreshNotifications());
    await bloc.stream.firstWhere(
      (nextState) =>
          (nextState.status == NotificationsStatus.loaded ||
              nextState.status == NotificationsStatus.failure) &&
          nextState.markingNotificationId == null,
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.notification,
    required this.markingNotificationId,
  });

  final NotificationModel notification;
  final int? markingNotificationId;

  @override
  Widget build(BuildContext context) {
    final isMarking = markingNotificationId == notification.id;
    final priorityColor = _priorityColor(notification.priority);

    return Card(
      elevation: notification.isRead ? 0 : 2,
      color: notification.isRead ? const Color(0xFFF9FAFB) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: notification.isRead
              ? const Color(0xFFE5E7EB)
              : const Color(0xFFBFDBFE),
          width: notification.isRead ? 1 : 1.5,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: priorityColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(11),
              ),
              child: Icon(
                _notificationIcon(notification.type),
                color: priorityColor,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: TextStyle(
                            color: notification.isRead
                                ? const Color(0xFF4B5563)
                                : const Color(0xFF111827),
                            fontSize: 15,
                            fontWeight: notification.isRead
                                ? FontWeight.w500
                                : FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (!notification.isRead)
                        isMarking
                            ? const SizedBox(
                                width: 28,
                                height: 28,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              )
                            : IconButton(
                                tooltip: 'Mark as read',
                                onPressed: () => context
                                    .read<NotificationsBloc>()
                                    .add(
                                      MarkNotificationRead(notification.id),
                                    ),
                                icon: const Icon(
                                  Icons.check_rounded,
                                  size: 19,
                                ),
                                color: const Color(0xFF2563EB),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(
                                  minWidth: 32,
                                  minHeight: 32,
                                ),
                              ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Text(
                    notification.message,
                    style: TextStyle(
                      color: notification.isRead
                          ? const Color(0xFF6B7280)
                          : const Color(0xFF374151),
                      fontSize: 14,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 9),
                  Wrap(
                    spacing: 7,
                    runSpacing: 5,
                    children: [
                      _NotificationTag(
                        label: _prettyType(notification.type),
                        backgroundColor: const Color(0xFFF3F4F6),
                        foregroundColor: const Color(0xFF4B5563),
                      ),
                      if (notification.priority != 'normal')
                        _NotificationTag(
                          label: notification.priority,
                          backgroundColor: priorityColor.withOpacity(0.12),
                          foregroundColor: priorityColor,
                        ),
                      if (notification.createdAt != null)
                        _NotificationTag(
                          label: _formatDateTime(notification.createdAt!),
                          backgroundColor: Colors.transparent,
                          foregroundColor: const Color(0xFF6B7280),
                          icon: Icons.schedule_rounded,
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _priorityColor(String priority) {
    switch (priority) {
      case 'urgent':
        return const Color(0xFFDC2626);
      case 'high':
        return const Color(0xFFEA580C);
      case 'medium':
        return const Color(0xFFD97706);
      case 'low':
        return const Color(0xFF2563EB);
      default:
        return const Color(0xFF2563EB);
    }
  }

  IconData _notificationIcon(String type) {
    switch (type) {
      case 'task_reminder':
        return Icons.schedule_rounded;
      case 'appointment':
        return Icons.calendar_month_rounded;
      case 'medication':
        return Icons.medication_outlined;
      case 'achievement':
      case 'streak':
        return Icons.star_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  String _prettyType(String type) {
    return type
        .split('_')
        .map(
          (word) => word.isEmpty
              ? word
              : '${word[0].toUpperCase()}${word.substring(1)}',
        )
        .join(' ');
  }

  String _formatDateTime(DateTime value) {
    final local = value.toLocal();
    final hour = local.hour == 0
        ? 12
        : local.hour > 12
            ? local.hour - 12
            : local.hour;
    final period = local.hour >= 12 ? 'PM' : 'AM';
    final minute = local.minute.toString().padLeft(2, '0');
    return '$hour:$minute $period';
  }
}

class _NotificationTag extends StatelessWidget {
  const _NotificationTag({
    required this.label,
    required this.backgroundColor,
    required this.foregroundColor,
    this.icon,
  });

  final String label;
  final Color backgroundColor;
  final Color foregroundColor;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: foregroundColor),
            const SizedBox(width: 3),
          ],
          Text(
            label,
            style: TextStyle(
              color: foregroundColor,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _UnreadBadge extends StatelessWidget {
  const _UnreadBadge({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFDC2626),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        '$count',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _EmptyNotifications extends StatelessWidget {
  const _EmptyNotifications();

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          children: [
            Icon(
              Icons.notifications_none_rounded,
              size: 56,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 12),
            const Text(
              'No notifications yet',
              style: TextStyle(
                color: Color(0xFF374151),
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 5),
            const Text(
              'We’ll notify you about important tasks and achievements.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF6B7280),
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationsLoading extends StatelessWidget {
  const _NotificationsLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ...List.generate(
          4,
          (index) => Container(
            height: 112,
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
          ),
        ),
      ],
    );
  }
}

class _NotificationsError extends StatelessWidget {
  const _NotificationsError({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              color: Color(0xFFB91C1C),
              size: 44,
            ),
            const SizedBox(height: 12),
            const Text(
              'We could not load your notifications.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF991B1B),
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}