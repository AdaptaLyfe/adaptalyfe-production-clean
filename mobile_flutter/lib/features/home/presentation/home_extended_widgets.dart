import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../core/layout/responsive.dart';
import '../../calendar/bloc/calendar_bloc.dart';
import '../../calendar/bloc/calendar_state.dart';
import '../../calendar/models/calendar_models.dart';
import '../../caregiver/bloc/caregiver_bloc.dart';
import '../../caregiver/bloc/caregiver_state.dart';
import '../../daily_tasks/bloc/daily_tasks_bloc.dart';
import '../../daily_tasks/bloc/daily_tasks_event.dart';
import '../../daily_tasks/bloc/daily_tasks_state.dart';
import '../../daily_tasks/models/daily_task_model.dart';
import '../../financial/bloc/financial_bloc.dart';
import '../../financial/bloc/financial_state.dart';
import '../../medical/bloc/medical_bloc.dart';
import '../../medical/bloc/medical_state.dart';
import '../../mood/bloc/mood_bloc.dart';
import '../../mood/bloc/mood_event.dart';
import '../../mood/models/mood_entry_model.dart';
import '../../mood/bloc/mood_state.dart';
import '../../rewards/bloc/rewards_bloc.dart';
import '../../rewards/bloc/rewards_state.dart';
import '../../settings/models/settings_models.dart';
import '../bloc/home_bloc.dart';
import '../bloc/home_event.dart';
import '../bloc/home_state.dart';
import '../models/home_models.dart';
import '../../../models/user_model.dart';

bool _homeOverlayOpen = false;

Future<T?> _runHomeOverlay<T>(Future<T?> Function() open) async {
  if (_homeOverlayOpen) return null;
  _homeOverlayOpen = true;
  try {
    return await open();
  } finally {
    _homeOverlayOpen = false;
  }
}

Future<void> showHomeChatSheet(BuildContext context) async {
  await context.push<void>('/ai-chat');
}

class HomeConfigurableQuickActions extends StatefulWidget {
  const HomeConfigurableQuickActions({super.key});

  @override
  State<HomeConfigurableQuickActions> createState() =>
      _HomeConfigurableQuickActionsState();
}

class _HomeConfigurableQuickActionsState
    extends State<HomeConfigurableQuickActions> {
  bool _isReorderMode = false;
  String? _draggingActionId;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<HomeBloc, HomeState>(
      builder: (context, state) {
        if (state is! HomeLoaded) return const SizedBox.shrink();
        final visible = state.quickActions.where((item) => item.visible).toList();
        return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LayoutBuilder(
                builder: (context, constraints) {
                  const heading = Text(
                    'Quick Actions',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1F2937),
                    ),
                  );
                  final compact = constraints.maxWidth < 380;
                  final controls = Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      OutlinedButton.icon(
                        onPressed: _toggleReorderMode,
                        icon: const Icon(
                          Icons.drag_indicator_rounded,
                          size: 18,
                        ),
                        label: const Text('Reorder'),
                        style: OutlinedButton.styleFrom(
                           foregroundColor: _isReorderMode
                               ? Colors.white
                               : const Color(0xFF374151),
                           backgroundColor: _isReorderMode
                               ? const Color(0xFF3B82F6)
                               : Colors.white,
                           side: BorderSide(
                             color: _isReorderMode
                                 ? const Color(0xFF3B82F6)
                                 : const Color(0xFFD1D5DB),
                             width: 2,
                           ),
                          shape: const StadiumBorder(),
                          padding: EdgeInsets.symmetric(
                            horizontal: compact ? 8 : 13,
                            vertical: compact ? 7 : 8,
                          ),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          visualDensity: VisualDensity.compact,
                          textStyle: TextStyle(
                            fontSize: compact ? 11 : 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      OutlinedButton.icon(
                        onPressed: () =>
                            _showCustomizeDialog(context, state.quickActions),
                         icon: const Icon(Icons.settings_rounded, size: 18),
                        label: const Text('Customize'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF374151),
                          side: const BorderSide(color: Color(0xFFD1D5DB)),
                          shape: const StadiumBorder(),
                          padding: EdgeInsets.symmetric(
                            horizontal: compact ? 8 : 13,
                            vertical: compact ? 7 : 8,
                          ),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          visualDensity: VisualDensity.compact,
                          textStyle: TextStyle(
                            fontSize: compact ? 11 : 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  );

                  return Row(
                    children: [
                      const Expanded(child: heading),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Align(
                          alignment: Alignment.centerRight,
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerRight,
                            child: controls,
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
              if (_isReorderMode) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDBEAFE),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF93C5FD)),
                  ),
                  child: const Row(
                    children: [
                      Icon(
                        Icons.drag_indicator_rounded,
                        color: Color(0xFF2563EB),
                        size: 20,
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Drag the blue grip or tap arrows to reorder',
                          style: TextStyle(
                            color: Color(0xFF1E40AF),
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 12),
              if (visible.isEmpty)
                _EmptyInline(
                  icon: Icons.dashboard_customize_outlined,
                  text: 'No quick actions selected.',
                   action: TextButton(
                    onPressed: () =>
                        _showCustomizeDialog(context, state.quickActions),
                    child: const Text('Add some'),
                  ),
                )
              else
                LayoutBuilder(
                  builder: (context, constraints) => GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: visible.length,
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    mainAxisExtent: _isReorderMode ? 208 : 160,
                  ),
                  itemBuilder: (context, index) {
                    final action = visible[index];
                    return DragTarget<String>(
                      onWillAccept: (candidate) =>
                          _isReorderMode && candidate != action.id,
                      onAccept: (draggedId) => _moveQuickActionTo(
                        context,
                        draggedId,
                        action.id,
                      ),
                      builder: (context, candidates, rejected) =>
                          LongPressDraggable<String>(
                        data: action.id,
                        maxSimultaneousDrags: _isReorderMode ? 1 : 0,
                        onDragStarted: () =>
                            setState(() => _draggingActionId = action.id),
                        onDragEnd: (_) =>
                            setState(() => _draggingActionId = null),
                        feedback: Material(
                          color: Colors.transparent,
                          child: SizedBox(
                            width: (constraints.maxWidth - 12) / 2,
                            child: _QuickActionTile(
                              action: action,
                              index: index,
                              totalCount: visible.length,
                              isReorderMode: true,
                              isDragging: true,
                              onTap: null,
                              onMove: (direction) => _moveQuickAction(
                                context,
                                action.id,
                                direction,
                              ),
                            ),
                          ),
                        ),
                        childWhenDragging: Opacity(
                          opacity: .35,
                          child: _QuickActionTile(
                            action: action,
                            index: index,
                            totalCount: visible.length,
                            isReorderMode: _isReorderMode,
                            isDragging: true,
                            onTap: null,
                            onMove: (direction) => _moveQuickAction(
                              context,
                              action.id,
                              direction,
                            ),
                          ),
                        ),
                        child: _QuickActionTile(
                          action: action,
                          index: index,
                          totalCount: visible.length,
                          isReorderMode: _isReorderMode,
                          isDragging: _draggingActionId == action.id,
                          onTap: () {
                            _openQuickAction(context, action);
                          },
                          onMove: (direction) => _moveQuickAction(
                            context,
                            action.id,
                            direction,
                          ),
                        ),
                      ),
                    );
                  },
                  ),
                ),
            ],
        );
      },
    );
  }

  void _openQuickAction(BuildContext context, HomeQuickAction action) {
    final route = action.id == 'ai-chat'
        ? '/ai-chat'
        : _safeRoute(action.route);
    context.push(route);
  }

  void _toggleReorderMode() {
    setState(() => _isReorderMode = !_isReorderMode);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            _isReorderMode
                ? 'Drag the blue grip or tap arrows to reorder.'
                : 'Your new order has been saved.',
          ),
          duration: const Duration(seconds: 2),
        ),
      );
  }

  Future<void> _showCustomizeDialog(
    BuildContext context,
    List<HomeQuickAction> actions,
  ) async {
    final result = await _runHomeOverlay<List<HomeQuickAction>>(
      () => showDialog<List<HomeQuickAction>>(
        context: context,
        builder: (_) => _CustomizeQuickActionsDialog(actions: actions),
      ),
    );
    if (result != null && context.mounted) {
      context.read<HomeBloc>().add(SaveHomeQuickActionConfig(result));
    }
  }

  void _moveQuickAction(
    BuildContext context,
    String actionId,
    int direction,
  ) {
    context.read<HomeBloc>().add(MoveHomeQuickAction(actionId, direction));
  }

  void _moveQuickActionTo(
    BuildContext context,
    String draggedId,
    String targetId,
  ) {
    final current = context.read<HomeBloc>().state;
    if (current is! HomeLoaded) return;
    final visible = current.quickActions
        .where((item) => item.visible)
        .toList();
    final fromIndex = visible.indexWhere((item) => item.id == draggedId);
    final toIndex = visible.indexWhere((item) => item.id == targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex == toIndex) return;
    final reordered = [...visible];
    final item = reordered.removeAt(fromIndex);
    reordered.insert(toIndex, item);
    final hidden = current.quickActions.where((item) => !item.visible);
    context.read<HomeBloc>().add(
          SaveHomeQuickActionConfig([
            ...reordered,
            ...hidden,
          ]),
        );
  }

}

class _CustomizeQuickActionsDialog extends StatefulWidget {
  const _CustomizeQuickActionsDialog({required this.actions});

  final List<HomeQuickAction> actions;

  @override
  State<_CustomizeQuickActionsDialog> createState() =>
      _CustomizeQuickActionsDialogState();
}

class _CustomizeQuickActionsDialogState
    extends State<_CustomizeQuickActionsDialog> {
  late List<HomeQuickAction> items = [...widget.actions];

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text(
        'Customize Quick Actions',
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
      ),
      content: SizedBox(
        width: AppResponsive.dialogWidth(context, maxWidth: 560),
        height: AppResponsive.dialogMaxHeight(context, fraction: .8),
        child: ListView.separated(
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final item = items[index];
            final selected = item.visible;
            return InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => setState(
                () => items[index] = item.copyWith(visible: !selected),
              ),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: selected ? const Color(0xFFEFF6FF) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: selected
                        ? const Color(0xFF3B82F6)
                        : const Color(0xFFE5E7EB),
                    width: 2,
                  ),
                  boxShadow: selected
                      ? const [
                          BoxShadow(
                            color: Color(0x14000000),
                            blurRadius: 4,
                            offset: Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  children: [
                    Checkbox(
                      value: selected,
                      onChanged: (value) => setState(
                        () => items[index] =
                            item.copyWith(visible: value ?? false),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: Color(item.colorValue),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x18000000),
                            blurRadius: 5,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        _iconFor(item.icon),
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.label,
                            style: const TextStyle(
                              color: Color(0xFF111827),
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item.description,
                            style: const TextStyle(
                              color: Color(0xFF6B7280),
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
      actions: [
        OutlinedButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Close'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(items),
          child: const Text('Save Changes'),
        ),
      ],
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({
    required this.action,
    required this.index,
    required this.totalCount,
    required this.isReorderMode,
    required this.isDragging,
    required this.onTap,
    required this.onMove,
  });

  final HomeQuickAction action;
  final int index;
  final int totalCount;
  final bool isReorderMode;
  final bool isDragging;
  final VoidCallback? onTap;
  final ValueChanged<int> onMove;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: isDragging ? 1.03 : 1,
      duration: const Duration(milliseconds: 120),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: isReorderMode ? null : onTap,
        child: Container(
          padding: EdgeInsets.fromLTRB(24, isReorderMode ? 44 : 24, 24, 24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: isReorderMode
                ? Border.all(color: const Color(0xFF93C5FD), width: 2)
                : null,
            boxShadow: const [
              BoxShadow(
                color: Color(0x160F172A),
                blurRadius: 9,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Stack(
            children: [
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Color(action.colorValue),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        _iconFor(action.icon),
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: Text(
                        action.label,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF111827),
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    SizedBox(
                      width: double.infinity,
                      child: Text(
                        action.description,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (isReorderMode)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        tooltip: 'Move left',
                        onPressed: index == 0 ? null : () => onMove(-1),
                        icon: const Icon(Icons.arrow_back_rounded, size: 18),
                        color: const Color(0xFF2563EB),
                        disabledColor: const Color(0xFFD1D5DB),
                        padding: EdgeInsets.zero,
                        constraints:
                            const BoxConstraints.tightFor(width: 32, height: 32),
                      ),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: Color(0xFF3B82F6),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.drag_indicator_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      IconButton(
                        tooltip: 'Move right',
                        onPressed: index == totalCount - 1
                            ? null
                            : () => onMove(1),
                        icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                        color: const Color(0xFF2563EB),
                        disabledColor: const Color(0xFFD1D5DB),
                        padding: EdgeInsets.zero,
                        constraints:
                            const BoxConstraints.tightFor(width: 32, height: 32),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class HomeTodayFlowRich extends StatelessWidget {
  const HomeTodayFlowRich({required this.user, super.key});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DailyTasksBloc, DailyTasksState>(
      builder: (context, tasks) => BlocBuilder<CalendarBloc, CalendarState>(
        builder: (context, calendar) {
          final now = DateTime.now();
          final timeline = <_TimelineItem>[
            ...tasks.tasks
                .where(
                  (item) =>
                      !item.isCompleted &&
                      item.scheduledTime?.trim().isNotEmpty == true,
                )
                .map(
                  (item) => _TimelineItem(
                    title: item.title,
                    detail: item.description,
                    time: _parseTaskTime(item.scheduledTime, now),
                    icon: Icons.check_circle_outline_rounded,
                    color: const Color(0xFF16A34A),
                    route: '/daily-tasks',
                  ),
                ),
            ...calendar.upcomingAppointments
                .where((item) => !item.isCompleted && DateUtils.isSameDay(item.appointmentDate, now))
                .map(
                  (item) => _TimelineItem(
                    title: item.title,
                    detail: item.location ?? item.provider,
                    time: item.appointmentDate,
                    icon: Icons.calendar_month_rounded,
                    color: const Color(0xFF2563EB),
                    route: '/calendar',
                  ),
                ),
            ...calendar.calendarEvents
                .where((item) => !item.isCompleted && _eventIsOnDay(item, now))
                .map(
                  (item) => _TimelineItem(
                    title: item.title,
                    detail: item.location ?? item.category,
                    time: item.allDay ? null : item.startDate,
                    icon: Icons.event_available_rounded,
                    color: const Color(0xFF7C3AED),
                    route: '/calendar',
                  ),
                ),
          ]..sort((a, b) => (a.time ?? now).compareTo(b.time ?? now));

          final pendingTasks =
              tasks.tasks.where((item) => !item.isCompleted).toList();
          final completedTasks =
              tasks.tasks.where((item) => item.isCompleted).length;
          final appointment = calendar.upcomingAppointments
              .where(
                (item) =>
                    !item.isCompleted &&
                    DateUtils.isSameDay(item.appointmentDate, now),
              )
              .isEmpty
              ? null
              : calendar.upcomingAppointments
                  .where(
                    (item) =>
                        !item.isCompleted &&
                        DateUtils.isSameDay(item.appointmentDate, now),
                  )
                  .first;
          final next = timeline.length > 1 ? timeline[1] : null;
          final primary = timeline.isEmpty ? null : timeline.first;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _TodayHeaderCard(
                userName: user.name?.trim().isNotEmpty == true
                    ? user.name!.trim()
                    : user.username,
                now: now,
                primary: primary,
              ),
              if (timeline.isNotEmpty) ...[
                const SizedBox(height: 14),
                _TodayMomentCards(items: timeline.take(3).toList()),
              ],
              if (primary != null && next != null) ...[
                const SizedBox(height: 14),
                _TodayTransitionCard(primary: primary, next: next),
              ],
              if (appointment != null) ...[
                const SizedBox(height: 14),
                _TodayAppointmentCard(
                  appointment: appointment,
                  preparationTasks: pendingTasks.take(4).toList(),
                ),
              ],
              const SizedBox(height: 14),
              _TodayProgressCard(
                total: tasks.tasks.length,
                completed: completedTasks,
                pending: pendingTasks.length,
              ),
              if (primary != null) ...[
                const SizedBox(height: 14),
                _TodayNextActionCard(item: primary),
              ],
              const SizedBox(height: 14),
              const _TodayEncouragementCard(),
              const SizedBox(height: 14),
              _TodayTimelineCard(items: timeline),
              const SizedBox(height: 14),
              const _TodayFoundationCard(),
            ],
          );
        },
      ),
    );
  }
}

bool _eventIsOnDay(CalendarEventModel event, DateTime day) {
  if (DateUtils.isSameDay(event.startDate, day)) return true;
  final end = event.endDate;
  if (end == null) return false;
  final dayStart = DateTime(day.year, day.month, day.day);
  final dayEnd = dayStart.add(const Duration(days: 1));
  return event.startDate.isBefore(dayEnd) && end.isAfter(dayStart);
}

class _TodayMomentCards extends StatelessWidget {
  const _TodayMomentCards({required this.items});

  final List<_TimelineItem> items;

  @override
  Widget build(BuildContext context) {
    const labels = ['NOW', 'NEXT', 'LATER'];
    const colors = [
      Color(0xFF0F766E),
      Color(0xFF2563EB),
      Color(0xFF7C3AED),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 380;
        final itemWidth = compact
            ? constraints.maxWidth
            : (constraints.maxWidth - ((items.length - 1) * 8)) /
                items.length;
        return Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (var index = 0; index < items.length; index++)
              SizedBox(
                width: itemWidth,
                child: _TodayInset(
              background: colors[index].withAlpha(12),
              borderColor: colors[index].withAlpha(70),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    labels[index],
                    style: TextStyle(
                      color: colors[index],
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 7),
                  Text(
                    items[index].title,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF1F2937),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (items[index].time != null) ...[
                    const SizedBox(height: 5),
                    Text(
                      _timeLabel(items[index].time!),
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ],
              ),
            ),
                ),
          ],
        );
      },
    );
  }
}

class _TodayHeaderCard extends StatelessWidget {
  const _TodayHeaderCard({
    required this.userName,
    required this.now,
    required this.primary,
  });

  final String userName;
  final DateTime now;
  final _TimelineItem? primary;

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      borderColor: const Color(0xFF99F6E4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.explore_outlined, color: Color(0xFF0F766E)),
              const SizedBox(width: 8),
              const Text(
                'TODAY',
                style: TextStyle(
                  color: Color(0xFF115E59),
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 2,
                ),
              ),
              const Spacer(),
              OutlinedButton.icon(
                onPressed: () => context.push('/daily-tasks'),
                icon: const Icon(Icons.checklist_rounded, size: 16),
                label: const Text('Open tasks'),
                style: OutlinedButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  shape: const StadiumBorder(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            "Let's look at today, $userName",
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 21,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${_dateLabel(now)} · One step at a time.',
            style: const TextStyle(color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 16),
          _TodayInset(
            background: const Color(0xFFF8FFFE),
            borderColor: const Color(0xFFD6FAF3),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.auto_awesome_rounded,
                      color: Color(0xFF0F766E),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Your day, brought together',
                      style: TextStyle(
                        color: Color(0xFF0F172A),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const _TodayPill(label: 'Context'),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'A calm view of what matters now, what comes next, and how you are progressing.',
                  style: TextStyle(color: Color(0xFF475569), height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _TodayInset(
            background: const Color(0xFFF0FDFA),
            borderColor: const Color(0xFFD1FAE5),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.auto_awesome, color: Color(0xFF0F766E)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'A HELPFUL NEXT STEP',
                        style: TextStyle(
                          color: Color(0xFF0F766E),
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.6,
                        ),
                      ),
                      const SizedBox(height: 7),
                      Text(
                        primary == null
                            ? 'There is room for what matters today. Add one small task when you are ready.'
                            : '${primary!.title} is coming up. Start with one small preparation step.',
                        style: const TextStyle(
                          color: Color(0xFF134E4A),
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        '✦  Guidance, not pressure.',
                        style: TextStyle(
                          color: Color(0xFF0F766E),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TodayTransitionCard extends StatelessWidget {
  const _TodayTransitionCard({required this.primary, required this.next});

  final _TimelineItem primary;
  final _TimelineItem next;

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      color: const Color(0xFFF8F7FF),
      borderColor: const Color(0xFFE8E1FF),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '→  NEXT TRANSITION',
            style: TextStyle(
              color: Color(0xFF7C3AED),
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.6,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _TodayPill(label: primary.title),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 9),
                child: Icon(Icons.arrow_forward_rounded, color: Color(0xFF7C3AED)),
              ),
              _TodayPill(label: next.title, filled: true),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            '${next.title} is coming up. Start with one small preparation step.',
            style: const TextStyle(color: Color(0xFF334155), height: 1.4),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => context.push('/daily-tasks'),
            child: const Text('Open tasks'),
          ),
        ],
      ),
    );
  }
}

class _TodayAppointmentCard extends StatelessWidget {
  const _TodayAppointmentCard({
    required this.appointment,
    required this.preparationTasks,
  });

  final AppointmentModel appointment;
  final List<DailyTaskModel> preparationTasks;

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      borderColor: const Color(0xFFE2E8F0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const CircleAvatar(
                backgroundColor: Color(0xFFEDE9FE),
                foregroundColor: Color(0xFF7C3AED),
                child: Icon(Icons.calendar_month_rounded),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  appointment.title,
                  style: const TextStyle(
                    color: Color(0xFF1F2937),
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              _TodayPill(label: _timeLabel(appointment.appointmentDate)),
            ],
          ),
          const SizedBox(height: 5),
          const Text(
            'Related tasks and preparation in one place.',
            style: TextStyle(color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Text(
                'Preparation',
                style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
              ),
              const Spacer(),
              Text(
                '${preparationTasks.length} remaining',
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 5),
          if (preparationTasks.isEmpty)
            const _EmptyInline(
              icon: Icons.check_circle_outline_rounded,
              text: 'No preparation tasks are waiting.',
            )
          else
            ...preparationTasks.map(
              (task) => CheckboxListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                value: task.isCompleted,
                title: Text(
                  task.title,
                  style: const TextStyle(fontSize: 13),
                ),
                subtitle: task.estimatedMinutes > 0
                    ? Text('${task.estimatedMinutes} min')
                    : null,
                onChanged: (value) => context.read<DailyTasksBloc>().add(
                  ToggleDailyTask(
                    taskId: task.id,
                    isCompleted: value ?? false,
                  ),
                ),
                controlAffinity: ListTileControlAffinity.leading,
                activeColor: const Color(0xFF7C3AED),
              ),
            ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => context.push('/daily-tasks'),
              icon: const Icon(Icons.flag_outlined),
              label: const Text('Continue preparation'),
            ),
          ),
        ],
      ),
    );
  }
}

class _TodayProgressCard extends StatelessWidget {
  const _TodayProgressCard({
    required this.total,
    required this.completed,
    required this.pending,
  });

  final int total;
  final int completed;
  final int pending;

  @override
  Widget build(BuildContext context) {
    final progress = total == 0 ? 0.0 : completed / total;
    return _SurfaceCard(
      color: const Color(0xFFFFFEF5),
      borderColor: const Color(0xFFFDE68A),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const CircleAvatar(
                backgroundColor: Color(0xFFFEF3C7),
                foregroundColor: Color(0xFFB45309),
                child: Icon(Icons.checklist_rounded),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  "Today's task progress",
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              _TodayPill(
                label: pending == 0 ? 'Complete' : 'In progress',
                filled: pending == 0,
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Current step: ${pending == 0 ? 'all tasks complete' : 'choose a manageable next step'}',
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                '$completed of $total steps',
                style: const TextStyle(color: Color(0xFF475569), fontSize: 12),
              ),
              const Spacer(),
              Text(
                '${(progress * 100).round()}%',
                style: const TextStyle(color: Color(0xFF475569), fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: const Color(0xFFFEF3C7),
              color: const Color(0xFFFBBF24),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            pending == 0
                ? 'You made space for what matters today.'
                : 'About ${pending * 15} min left · Choose one manageable next step.',
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _TodayNextActionCard extends StatelessWidget {
  const _TodayNextActionCard({required this.item});

  final _TimelineItem item;

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      color: const Color(0xFFF0FDFA),
      borderColor: const Color(0xFFCCFBF1),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome_rounded, color: Color(0xFF0F766E)),
              const SizedBox(width: 8),
              const Text(
                'Your primary next action',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              const SizedBox(width: 8),
              const _TodayPill(label: 'Suggested'),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${item.title} is the next small step. Keep it simple.',
            style: const TextStyle(color: Color(0xFF134E4A), height: 1.4),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => context.push(item.route),
              icon: const Icon(Icons.check_circle_outline_rounded),
              label: Text('Open ${item.title}'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF0F766E),
                foregroundColor: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TodayEncouragementCard extends StatelessWidget {
  const _TodayEncouragementCard();

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      color: const Color(0xFFF0FDF4),
      borderColor: const Color(0xFFBBF7D0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.favorite_outline_rounded, color: Color(0xFF16A34A)),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'A small start still counts.',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    SizedBox(width: 8),
                    _TodayPill(label: 'Encouragement'),
                  ],
                ),
                SizedBox(height: 7),
                Text(
                  'Adaptalyfe is here to support the next step, not rush the whole day.',
                  style: TextStyle(color: Color(0xFF166534), height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TodayTimelineCard extends StatelessWidget {
  const _TodayTimelineCard({required this.items});

  final List<_TimelineItem> items;

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'YOUR TIMELINE',
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.6,
                  ),
                ),
              ),
              TextButton(
                onPressed: () => context.push('/calendar'),
                child: const Text('View calendar'),
              ),
            ],
          ),
          if (items.isEmpty)
            const _EmptyInline(
              icon: Icons.event_available_outlined,
              text: 'Nothing is scheduled yet.',
            )
          else
            ...items.take(6).map((item) => _TimelineRow(item: item)),
        ],
      ),
    );
  }
}

class _TodayFoundationCard extends StatelessWidget {
  const _TodayFoundationCard();

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      color: const Color(0xFFF0FDFA),
      borderColor: const Color(0xFFD1FAE5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle_outline_rounded, color: Color(0xFF0F766E)),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'FUTURE-READY FOUNDATION',
                      style: TextStyle(
                        color: Color(0xFF0F766E),
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.5,
                      ),
                    ),
                    SizedBox(width: 8),
                    _TodayPill(label: 'Context'),
                  ],
                ),
                SizedBox(height: 8),
                Text(
                  'This presentation is powered by your existing tasks and schedule. Future Guide intelligence can add richer context without changing the experience.',
                  style: TextStyle(color: Color(0xFF134E4A), height: 1.4),
                ),
                SizedBox(height: 7),
                Text(
                  'Proactive guidance stays separate from AdaptAI chat.',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TodayInset extends StatelessWidget {
  const _TodayInset({
    required this.child,
    required this.background,
    required this.borderColor,
  });

  final Widget child;
  final Color background;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: borderColor),
      ),
      child: child,
    );
  }
}

class _TodayPill extends StatelessWidget {
  const _TodayPill({required this.label, this.filled = false});

  final String label;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 130),
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: filled ? const Color(0xFFEDE9FE) : Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: filled ? const Color(0xFFE9D5FF) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
      ),
    );
  }
}

class HomeLiveDailyGuide extends StatelessWidget {
  const HomeLiveDailyGuide({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<HomeBloc, HomeState>(
      builder: (context, state) {
        if (state is! HomeLoaded) return const SizedBox.shrink();
        if (state.guideStatus == HomeGuideStatus.loading) {
          return const _GuideLoading();
        }
        if (state.guideStatus == HomeGuideStatus.failure ||
            state.dailyGuide == null) {
          return _SurfaceCard(
            color: const Color(0xFFF0FDF4),
            borderColor: const Color(0xFFBBF7D0),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome_outlined, color: Color(0xFF15803D)),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Your Guide is not available right now. You can still use Adaptalyfe normally.',
                    style: TextStyle(color: Color(0xFF166534)),
                  ),
                ),
                IconButton(
                  tooltip: 'Try again',
                  onPressed: () => context.read<HomeBloc>().add(const LoadDailyGuide()),
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
            ),
          );
        }
        final guide = state.dailyGuide!;
        final period = _guidePeriod(DateTime.now().hour);
        final groupedHighlights = _guideGroups(guide.highlights);
        return _SurfaceCard(
          padding: EdgeInsets.zero,
          gradient: LinearGradient(
            colors: period.colors,
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderColor: const Color(0xFF059669),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: Row(
                  children: [
                    Icon(period.icon, color: Colors.white),
                    const SizedBox(width: 8),
                    Text(
                      '${period.label.toUpperCase()} GUIDE',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.7,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      period.badge,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
                child: Text(
                  guide.greeting,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      guide.summary,
                      style: const TextStyle(color: Color(0xFF374151), height: 1.35),
                    ),
                    if (groupedHighlights.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      ...groupedHighlights.map(
                        (entry) => Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text(
                                _guideTypeLabel(entry.key),
                                style: const TextStyle(
                                  color: Color(0xFF475569),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: .5,
                                ),
                              ),
                            ),
                            ...entry.value.take(4).map(
                                  (highlight) => ListTile(
                                    dense: true,
                                    contentPadding: EdgeInsets.zero,
                                    leading: Icon(
                                      _guideIcon(highlight.type),
                                      color: _priorityColor(highlight.priority),
                                    ),
                                    title: Text(
                                      _cleanGuideTitle(highlight.title),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    trailing: _GuideHighlightMeta(
                                      highlight: highlight,
                                    ),
                                  ),
                                ),
                            const SizedBox(height: 6),
                          ],
                        ),
                      ),
                    ] else
                      const Padding(
                        padding: EdgeInsets.only(top: 12),
                        child: Text(
                          'Nothing scheduled for this period.',
                          style: TextStyle(color: Color(0xFF6B7280)),
                        ),
                      ),
                    if (guide.nextAction != null) ...[
                      const Divider(height: 20),
                      Text(
                        'Next step',
                        style: TextStyle(
                          color: Colors.green.shade800,
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        _cleanGuideTitle(guide.nextAction!.title),
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      if (guide.nextAction!.reason != null)
                        Text(
                          guide.nextAction!.reason!,
                          style: const TextStyle(
                            color: Color(0xFF6B7280),
                            fontSize: 12,
                          ),
                        ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _GuideHighlightMeta extends StatelessWidget {
  const _GuideHighlightMeta({required this.highlight});

  final DailyGuideHighlight highlight;

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[
      if (highlight.time != null)
        Text(
          highlight.time!,
          style: const TextStyle(color: Color(0xFF6B7280), fontSize: 12),
        ),
      if (highlight.priority != 'normal')
        Container(
          margin: const EdgeInsets.only(left: 6),
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 3),
          decoration: BoxDecoration(
            color: _priorityColor(highlight.priority).withAlpha(20),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            highlight.priority,
            style: TextStyle(
              color: _priorityColor(highlight.priority),
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
    ];
    return children.isEmpty
        ? const SizedBox.shrink()
        : Row(mainAxisSize: MainAxisSize.min, children: children);
  }
}

class _GuidePeriod {
  const _GuidePeriod({
    required this.label,
    required this.badge,
    required this.icon,
    required this.colors,
  });

  final String label;
  final String badge;
  final IconData icon;
  final List<Color> colors;
}

_GuidePeriod _guidePeriod(int hour) {
  if (hour >= 5 && hour < 12) {
    return const _GuidePeriod(
      label: 'Morning',
      badge: 'Start gently',
      icon: Icons.wb_sunny_outlined,
      colors: [Color(0xFF2D7DF6), Color(0xFF16C7E8), Color(0xFF46DCC5)],
    );
  }
  if (hour >= 12 && hour < 17) {
    return const _GuidePeriod(
      label: 'Afternoon',
      badge: 'Keep going',
      icon: Icons.wb_sunny_rounded,
      colors: [Color(0xFF2563EB), Color(0xFF06B6D4), Color(0xFF14B8A6)],
    );
  }
  if (hour >= 17 && hour < 21) {
    return const _GuidePeriod(
      label: 'Evening',
      badge: 'Wind down',
      icon: Icons.wb_twilight_rounded,
      colors: [Color(0xFF7C3AED), Color(0xFF2563EB), Color(0xFF0EA5E9)],
    );
  }
  return const _GuidePeriod(
    label: 'Night',
    badge: 'Rest and reset',
    icon: Icons.nightlight_outlined,
    colors: [Color(0xFF312E81), Color(0xFF4338CA), Color(0xFF2563EB)],
  );
}

List<MapEntry<String, List<DailyGuideHighlight>>> _guideGroups(
  List<DailyGuideHighlight> highlights,
) {
  final groups = <String, List<DailyGuideHighlight>>{
    'Appointments': [],
    'Calendar': [],
    'Tasks': [],
  };
  for (final highlight in highlights) {
    final key = switch (highlight.type) {
      'appointment' => 'Appointments',
      'calendar' => 'Calendar',
      _ => 'Tasks',
    };
    groups[key]!.add(highlight);
  }
  return groups.entries.where((entry) => entry.value.isNotEmpty).toList();
}

String _guideTypeLabel(String type) => type;

String _cleanGuideTitle(String title) {
  return title
      .replaceFirst(RegExp(r'^\s*(test|sample|demo)\s*[:\-]\s*', caseSensitive: false), '')
      .trim();
}

class HomeDashboardModules extends StatelessWidget {
  const HomeDashboardModules({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<HomeBloc, HomeState>(
      builder: (context, state) {
        if (state is! HomeLoaded) return const SizedBox.shrink();
        final modules = state.dashboardModules
            .where((module) => module.enabled)
            .toList()
          ..sort((a, b) => a.order.compareTo(b.order));
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Your Dashboard',
                    style: TextStyle(
                      color: Color(0xFF1F2937),
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _editModules(context, state.dashboardModules),
                  icon: const Icon(Icons.dashboard_customize_outlined, size: 18),
                  label: const Text('Customize'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (modules.isEmpty)
              _SurfaceCard(
                child: _EmptyInline(
                  icon: Icons.dashboard_outlined,
                  text: 'Your dashboard is empty.',
                  action: TextButton(
                    onPressed: () => _editModules(context, state.dashboardModules),
                    child: const Text('Choose modules'),
                  ),
                ),
              )
            else
              ...modules.map((module) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _module(context, module),
                  )),
          ],
        );
      },
    );
  }

  Widget _module(BuildContext context, DashboardModuleModel module) {
    final moduleId = module.id.toLowerCase();
    switch (moduleId) {
      case 'daily-summary':
        return const _HomeSummaryModule();
      case 'daily-tasks':
        return const _HomeTasksModule();
      case 'mood':
      case 'moodmodule':
      case 'mood-module':
      case 'moodlog':
      case 'mood-log':
        return const _HomeMoodModule();
      case 'financial':
        return const _HomeFinancialModule();
      case 'appointments':
        return const _HomeAppointmentsModule();
      case 'pharmacy':
        return const _HomePharmacyModule();
      case 'achievements':
        return const _HomeAchievementsModule();
      case 'caregiver':
        return const _HomeCaregiverModule();
      case 'safety-transportation':
        return const _HomeSafetyModule();
      case 'health-wellness':
        return const _HomeHealthModule();
      case 'accessibility':
        return const _HomeAccessibilityModule();
      case 'life-skills':
        return const _HomeLifeSkillsModule();
      case 'progress-motivation':
        return const _HomeProgressModule();
      default:
        return _HomeFeatureModule(module: module);
    }
  }

  Future<void> _editModules(
    BuildContext context,
    List<DashboardModuleModel> modules,
  ) async {
    await _runHomeOverlay<void>(
      () => showDialog<void>(
        context: context,
        builder: (_) => _DashboardModuleEditor(modules: modules),
      ),
    );
  }
}

class _DashboardModuleEditor extends StatefulWidget {
  const _DashboardModuleEditor({required this.modules});

  final List<DashboardModuleModel> modules;

  @override
  State<_DashboardModuleEditor> createState() => _DashboardModuleEditorState();
}

class _DashboardModuleEditorState extends State<_DashboardModuleEditor> {
  late List<DashboardModuleModel> items = [...widget.modules];

  List<DashboardModuleModel> get _activeModules => items
      .where((module) => module.enabled)
      .toList()
    ..sort((a, b) => a.order.compareTo(b.order));

  List<DashboardModuleModel> get _premiumModules =>
      items.where((module) => module.name.contains('Premium')).toList()
        ..sort((a, b) => a.order.compareTo(b.order));

  List<DashboardModuleModel> get _regularHiddenModules => items
      .where((module) => !module.enabled && !module.name.contains('Premium'))
      .toList()
    ..sort((a, b) => a.order.compareTo(b.order));

  List<DashboardModuleModel> _normalizedItems(
    List<DashboardModuleModel> source,
  ) {
    return [
      for (var index = 0; index < source.length; index++)
        source[index].copyWith(order: index),
    ];
  }

  void _save(List<DashboardModuleModel> next) {
    final normalized = _normalizedItems(next);
    setState(() => items = normalized);
    context.read<HomeBloc>().add(SaveHomeModuleConfig(normalized));
  }

  void _toggleModule(String moduleId) {
    _save([
      for (final module in items)
        module.id == moduleId
            ? module.copyWith(enabled: !module.enabled)
            : module,
    ]);
  }

  void _moveModule(String moduleId, int direction) {
    final active = _activeModules;
    final currentIndex = active.indexWhere((module) => module.id == moduleId);
    final targetIndex = currentIndex + direction;
    if (currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= active.length) {
      return;
    }
    final firstId = active[currentIndex].id;
    final secondId = active[targetIndex].id;
    final firstIndex = items.indexWhere((module) => module.id == firstId);
    final secondIndex = items.indexWhere((module) => module.id == secondId);
    if (firstIndex < 0 || secondIndex < 0) return;
    final next = [...items];
    final first = next[firstIndex];
    next[firstIndex] = next[secondIndex];
    next[secondIndex] = first;
    _save(next);
  }

  void _reset() {
    setState(() => items = _normalizedItems(defaultDashboardModules));
    context.read<HomeBloc>().add(const ResetHomeModules());
  }

  void _addEnhancedFeatures() {
    const enhanced = [
      DashboardModuleModel(
        id: 'health-wellness',
        name: 'Health & Wellness (Premium)',
        component: 'HealthWellnessModule',
        enabled: false,
        order: 0,
      ),
      DashboardModuleModel(
        id: 'accessibility',
        name: 'Accessibility Settings (Premium)',
        component: 'AccessibilitySettingsModule',
        enabled: false,
        order: 0,
      ),
      DashboardModuleModel(
        id: 'life-skills',
        name: 'Life Skills Training (Premium)',
        component: 'LifeSkillsModule',
        enabled: false,
        order: 0,
      ),
      DashboardModuleModel(
        id: 'progress-motivation',
        name: 'Progress & Motivation (Premium)',
        component: 'ProgressMotivationModule',
        enabled: false,
        order: 0,
      ),
    ];
    final ids = items.map((module) => module.id).toSet();
    _save([
      ...items,
      ...enhanced.where((module) => !ids.contains(module.id)),
    ]);
  }

  Widget _moduleRow(
    BuildContext context,
    DashboardModuleModel module, {
    required String subtitle,
    required bool showArrows,
    required int activeIndex,
    required int activeCount,
    required bool premium,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: premium
            ? (module.enabled
                ? const Color(0xFFEDE9FE)
                : const Color(0xFFF5F3FF))
            : (module.enabled ? Colors.white : const Color(0xFFF9FAFB)),
        gradient: premium
            ? const LinearGradient(
                colors: [Color(0xFFF3E8FF), Color(0xFFEFF6FF)],
              )
            : null,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: premium
              ? const Color(0xFFD8B4FE)
              : const Color(0xFFE5E7EB),
          width: premium ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.drag_indicator_rounded,
            size: 20,
            color: premium
                ? const Color(0xFFA78BFA)
                : (module.enabled
                    ? const Color(0xFF9CA3AF)
                    : const Color(0xFFD1D5DB)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  module.name,
                  style: TextStyle(
                    color: premium
                        ? const Color(0xFF581C87)
                        : (module.enabled
                            ? const Color(0xFF111827)
                            : const Color(0xFF4B5563)),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: premium
                        ? const Color(0xFF7E22CE)
                        : const Color(0xFF6B7280),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (showArrows)
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  tooltip: 'Move up',
                  onPressed: activeIndex == 0
                      ? null
                      : () => _moveModule(module.id, -1),
                  icon: const Icon(Icons.keyboard_arrow_up_rounded),
                  visualDensity: VisualDensity.compact,
                ),
                IconButton(
                  tooltip: 'Move down',
                  onPressed: activeIndex == activeCount - 1
                      ? null
                      : () => _moveModule(module.id, 1),
                  icon: const Icon(Icons.keyboard_arrow_down_rounded),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          Switch.adaptive(
            value: module.enabled,
            onChanged: (_) => _toggleModule(module.id),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final active = _activeModules;
    final premium = _premiumModules;
    final hidden = _regularHiddenModules;
    final hasPremium = premium.isNotEmpty;
    return AlertDialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      title: Row(
        children: [
          const Icon(Icons.settings_outlined, color: Color(0xFF2563EB)),
          const SizedBox(width: 8),
          const Expanded(
            child: Text(
              'Customize Your Dashboard',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
          ),
          OutlinedButton.icon(
            onPressed: _reset,
            icon: const Icon(Icons.restart_alt_rounded, size: 16),
            label: const Text('Reset'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              visualDensity: VisualDensity.compact,
            ),
          ),
          IconButton(
            tooltip: 'Close',
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.close_rounded),
          ),
        ],
      ),
      content: SizedBox(
        width: AppResponsive.dialogWidth(context, maxWidth: 600),
        height: AppResponsive.dialogMaxHeight(context, fraction: .82),
        child: ListView(
          children: [
            const Text(
              'Customize which skill modules appear on your dashboard and change their order. Use the arrow buttons to move modules up or down, or toggle them on/off.',
              style: TextStyle(color: Color(0xFF4B5563), fontSize: 13),
            ),
                const SizedBox(height: 20),
            Row(
              children: [
                const Icon(Icons.visibility_outlined, size: 18),
                const SizedBox(width: 8),
                const Text(
                  'Active Modules',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(width: 8),
                _CountBadge(count:  active.length),
              ],
            ),
            const SizedBox(height: 10),
            ...active.asMap().entries.map(
                  (entry) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _moduleRow(
                      context,
                      entry.value,
                      subtitle: 'Position: ${entry.key + 1}',
                      showArrows: true,
                      activeIndex: entry.key,
                      activeCount: active.length,
                      premium: entry.value.name.contains('Premium'),
                    ),
                  ),
                ),
            if (!hasPremium) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFFDE68A),
                    width: 2,
                  ),
                ),
                child: Column(
                  children: [
                    const Text(
                      '🌟 Premium Enhanced Features',
                      style: TextStyle(
                        color: Color(0xFF78350F),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Unlock advanced tools for independence and personal growth',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF92400E), fontSize: 13),
                    ),
                    const SizedBox(height: 10),
                    FilledButton(
                      onPressed: _addEnhancedFeatures,
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFFD97706),
                      ),
                      child: const Text('Show Premium Features'),
                    ),
                  ],
                ),
              ),
            ],
            if (premium.isNotEmpty) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      '🌟 Premium Enhanced Features',
                      style: TextStyle(
                        color: Color(0xFF581C87),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  _CountBadge(
                    count: premium.length,
                    outline: true,
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ...premium.map(
                (module) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _moduleRow(
                    context,
                    module,
                    subtitle: module.enabled
                        ? 'Premium feature - active on dashboard'
                        : 'Premium feature - toggle to activate',
                    showArrows: false,
                    activeIndex: 0,
                    activeCount: 1,
                    premium: true,
                  ),
                ),
              ),
            ],
            if (hidden.isNotEmpty) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  const Icon(Icons.visibility_off_outlined, size: 18),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Hidden Basic Modules',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                  _CountBadge(count: hidden.length, outline: true),
                ],
              ),
              const SizedBox(height: 10),
              ...hidden.map(
                (module) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _moduleRow(
                    context,
                    module,
                    subtitle: 'Currently hidden',
                    showArrows: false,
                    activeIndex: 0,
                    activeCount: 1,
                    premium: false,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Tips for Customization',
                    style: TextStyle(
                      color: Color(0xFF1E3A8A),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    '• Put your most important skills at the top\n'
                    '• Hide modules you do not use regularly\n'
                    '• You can always turn modules back on later\n'
                    '• Changes are saved automatically',
                    style: TextStyle(color: Color(0xFF1E40AF), fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  const _CountBadge({required this.count, this.outline = false});

  final int count;
  final bool outline;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: outline ? Colors.white : const Color(0xFFE5E7EB),
        borderRadius: BorderRadius.circular(20),
        border: outline
            ? Border.all(color: const Color(0xFFD1D5DB))
            : null,
      ),
      child: Text(
        '$count',
        style: const TextStyle(
          color: Color(0xFF4B5563),
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _HomeSummaryModule extends StatelessWidget {
  const _HomeSummaryModule();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DailyTasksBloc, DailyTasksState>(
      builder: (context, taskState) => BlocBuilder<MoodBloc, MoodState>(
        builder: (context, moodState) {
          final tasks = taskState.tasks;
          final completed = tasks.where((task) => task.isCompleted).length;
          final pending = tasks.where((task) => !task.isCompleted).take(3).toList();
          return _SurfaceCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _ModuleHeader(title: "Today's Summary", icon: Icons.today_rounded),
                Text(
                  _dateLabel(DateTime.now()),
                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _MetricTile(label: 'Daily progress', value: tasks.isEmpty ? '0%' : '${(completed / tasks.length * 100).round()}%', color: const Color(0xFF2563EB))),
                    const SizedBox(width: 8),
                    Expanded(child: _MetricTile(label: 'Pending tasks', value: '${tasks.where((task) => !task.isCompleted).length}', color: const Color(0xFF16A34A))),
                    const SizedBox(width: 8),
                    Expanded(child: _MetricTile(label: 'Mood', value: moodState.todayMood == null ? 'Needed' : 'Logged', color: const Color(0xFF9333EA))),
                  ],
                ),
                if (pending.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text('Up next', style: TextStyle(fontWeight: FontWeight.w800)),
                  ...pending.map((task) => ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.schedule_rounded, color: Color(0xFF2563EB)),
                        title: Text(task.title),
                        subtitle: Text(task.category),
                        trailing: TextButton(
                          onPressed: () => context.push('/daily-tasks'),
                          child: const Text('Open'),
                        ),
                      )),
                ],
                if (moodState.isMoodRequired)
                  _InlineNotice(
                    icon: Icons.favorite_outline_rounded,
                    text: 'Your daily mood check-in is required.',
                    onTap: () => context.push('/mood-tracking'),
                  ),
                if (tasks.isEmpty && moodState.todayMood == null)
                  const _EmptyInline(
                    icon: Icons.check_circle_outline_rounded,
                    text: 'All caught up! No urgent tasks or deadlines today.',
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _HomeTasksModule extends StatelessWidget {
  const _HomeTasksModule();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DailyTasksBloc, DailyTasksState>(
      builder: (context, state) {
        final tasks = state.tasks;
        final todo = tasks.where((task) => !task.isCompleted).take(3).toList();
        final done = tasks.where((task) => task.isCompleted).take(2).toList();
        return _SurfaceCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ModuleHeader(
                title: 'Task Management',
                icon: Icons.check_box_outlined,
                action: TextButton(
                  onPressed: () => context.push('/daily-tasks'),
                  child: const Text('View all'),
                ),
              ),
              if (state.isLoading)
                const LinearProgressIndicator(minHeight: 3)
              else if (todo.isEmpty && done.isEmpty)
                const _EmptyInline(
                  icon: Icons.task_alt_rounded,
                  text: 'No tasks in this category yet.',
                )
              else ...[
                if (todo.isNotEmpty) ...[
                  const Text('To do', style: TextStyle(fontWeight: FontWeight.w800)),
                  ...todo.map((task) => _TaskRow(task: task)),
                ],
                if (done.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  const Text('Completed', style: TextStyle(fontWeight: FontWeight.w800)),
                  ...done.map((task) => _TaskRow(task: task)),
                ],
              ],
            ],
          ),
        );
      },
    );
  }
}

class _HomeMoodModule extends StatefulWidget {
  const _HomeMoodModule();

  @override
  State<_HomeMoodModule> createState() => _HomeMoodModuleState();
}

class _HomeMoodModuleState extends State<_HomeMoodModule> {
  static const _moods = [
    (1, '😢', 'Sad'),
    (2, '😐', 'Okay'),
    (3, '😊', 'Good'),
    (4, '😃', 'Great'),
    (5, '🤩', 'Amazing'),
  ];

  int? _pendingMood;

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<MoodBloc, MoodState>(
      listenWhen: (previous, current) =>
          previous.actionMessage != current.actionMessage,
      listener: (context, state) {
        if (state.actionMessage?.startsWith('Mood recorded') == true &&
            _pendingMood != null) {
          final mood = _pendingMood!;
          _pendingMood = null;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              _showMoodConfirmation(context, mood);
            }
          });
        }
      },
      builder: (context, state) {
        final isRequired = state.todayMood == null;
        final currentMood = state.todayMood?.mood;
        final borderColor =
            isRequired ? const Color(0xFFF87171) : const Color(0xFF8B5CF6);
        final backgroundColor =
            isRequired ? const Color(0xFFFFF3F3) : Colors.white;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(24),
            border: Border(
              top: BorderSide(color: borderColor, width: 7),
              left: BorderSide(
                color: isRequired
                    ? const Color(0xFFFECACA)
                    : const Color(0xFFE5E7EB),
                width: 2,
              ),
              right: BorderSide(
                color: isRequired
                    ? const Color(0xFFFECACA)
                    : const Color(0xFFE5E7EB),
                width: 2,
              ),
              bottom: BorderSide(
                color: isRequired
                    ? const Color(0xFFFECACA)
                    : const Color(0xFFE5E7EB),
                width: 2,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: isRequired
                    ? const Color(0x33FCA5A5)
                    : const Color(0x0D111827),
                blurRadius: 8,
                spreadRadius: isRequired ? 2 : 0,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: isRequired
                          ? const Color(0xFFEF4444)
                          : const Color(0xFF8B5CF6),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.favorite_border_rounded,
                      color: Colors.white,
                      size: 25,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          spacing: 8,
                          runSpacing: 4,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            const Text(
                              'Mood Log',
                              style: TextStyle(
                                color: Color(0xFF111827),
                                fontSize: 19,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            if (isRequired)
                              const _HomeMoodBadge(
                                label: 'Required',
                                color: Color(0xFFDC2626),
                                background: Color(0xFFFEE2E2),
                              ),
                          ],
                        ),
                        if (isRequired)
                          const Padding(
                            padding: EdgeInsets.only(top: 4),
                            child: Text(
                              'Daily mood check-in is required to continue',
                              style: TextStyle(
                                color: Color(0xFFDC2626),
                                fontSize: 12,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () => context.push('/mood-tracking'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isRequired
                          ? const Color(0xFFEF4444)
                          : const Color(0xFF8B5CF6),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 11,
                      ),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      textStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    child: Text(
                      isRequired ? 'Required Check-in' : 'Check In Now',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const Text(
                'How are you feeling today?',
                style: TextStyle(
                  color: Color(0xFF1F2937),
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: _moods
                    .map(
                      (mood) => Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2),
                          child: _HomeMoodChoice(
                            emoji: mood.$2,
                            label: mood.$3,
                            selected: currentMood == mood.$1,
                            disabled: state.isLoading ||
                                state.isSubmitting ||
                                currentMood != null,
                            onPressed: () {
                              _pendingMood = mood.$1;
                              context.read<MoodBloc>().add(
                                    AddMood(
                                      MoodEntryInput(mood: mood.$1),
                                    ),
                                  );
                            },
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 18),
              const Text(
                'Quick Resources',
                style: TextStyle(
                  color: Color(0xFF1F2937),
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 10),
              _HomeMoodResourceButton(
                icon: Icons.air_rounded,
                label: 'Breathing Exercise',
                onPressed: () => context.push('/resources'),
              ),
              const SizedBox(height: 8),
              _HomeMoodResourceButton(
                icon: Icons.lightbulb_outline_rounded,
                label: 'Coping Strategies',
                onPressed: () => context.push('/resources'),
              ),
              const SizedBox(height: 8),
              _HomeMoodResourceButton(
                icon: Icons.phone_outlined,
                label: 'Trusted Contacts',
                onPressed: () => context.push('/resources'),
                danger: true,
              ),
              if (state.errorMessage != null) ...[
                const SizedBox(height: 8),
                Text(
                  state.errorMessage!,
                  style: const TextStyle(
                    color: Color(0xFFB91C1C),
                    fontSize: 12,
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Future<void> _showMoodConfirmation(BuildContext context, int mood) async {
    final feedback = _homeMoodFeedback(mood);
    await _runHomeOverlay<void>(
      () => showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
        contentPadding: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: feedback.colors),
              ),
              child: Row(
                children: [
                  Text(feedback.emoji, style: const TextStyle(fontSize: 38)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          feedback.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          "You're feeling ${feedback.label.toLowerCase()} today",
                          style: const TextStyle(
                            color: Color(0xDFFFFFFF),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
              child: Text(
                feedback.message,
                style: const TextStyle(
                  color: Color(0xFF374151),
                  fontSize: 15,
                  height: 1.4,
                ),
              ),
            ),
            Container(
              margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                border: Border.all(color: const Color(0xFFFDE68A)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.auto_awesome_rounded,
                    color: Color(0xFFF59E0B),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Daily Tip',
                          style: TextStyle(
                            color: Color(0xFF92400E),
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          feedback.tip,
                          style: const TextStyle(
                            color: Color(0xFFB45309),
                            fontSize: 13,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: feedback.colors.last,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Got it, thanks!',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(bottom: 16),
              child: Text(
                'Your mood has been recorded for today.',
                style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11),
              ),
            ),
          ],
        ),
        ),
      ),
    );
  }
}

class _HomeMoodChoice extends StatelessWidget {
  const _HomeMoodChoice({
    required this.emoji,
    required this.label,
    required this.selected,
    required this.disabled,
    required this.onPressed,
  });

  final String emoji;
  final String label;
  final bool selected;
  final bool disabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final faded = disabled && !selected;
    return Opacity(
      opacity: faded ? 0.5 : 1,
      child: OutlinedButton(
        onPressed: disabled ? null : onPressed,
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 64),
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
          backgroundColor:
              selected ? const Color(0xFFF5F3FF) : Colors.white,
          foregroundColor: const Color(0xFF374151),
          disabledForegroundColor: const Color(0xFF374151),
          side: BorderSide(
            color: selected
                ? const Color(0xFF8B5CF6)
                : const Color(0xFFE5E7EB),
            width: selected ? 2 : 1,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
              SizedBox(
                width: 32,
                height: 32,
                child: Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.center,
                  children: [
                    Text(emoji, style: const TextStyle(fontSize: 23)),
                    if (selected)
                      const Positioned(
                        top: -2,
                        right: -4,
                        child: Icon(
                          Icons.check_circle_rounded,
                          color: Color(0xFF8B5CF6),
                          size: 14,
                        ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 3),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 10),
              ),
          ],
        ),
      ),
    );
  }
}

class _HomeMoodResourceButton extends StatelessWidget {
  const _HomeMoodResourceButton({
    required this.icon,
    required this.label,
    required this.onPressed,
    this.danger = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final color =
        danger ? const Color(0xFFDC2626) : const Color(0xFF8B5CF6);
    final background =
        danger ? const Color(0xFFFFF3F3) : const Color(0xFFFCF6FF);
    final border = danger ? const Color(0xFFF2CACA) : const Color(0xFFE9D5FF);

    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, color: color, size: 18),
        label: Text(
          label,
          style: const TextStyle(
            color: Color(0xFF111827),
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
        style: OutlinedButton.styleFrom(
          alignment: Alignment.centerLeft,
          backgroundColor: background,
          side: BorderSide(color: border),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
        ),
      ),
    );
  }
}

class _HomeMoodBadge extends StatelessWidget {
  const _HomeMoodBadge({
    required this.label,
    required this.color,
    required this.background,
  });

  final String label;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _HomeMoodFeedback {
  const _HomeMoodFeedback({
    required this.label,
    required this.emoji,
    required this.title,
    required this.message,
    required this.tip,
    required this.colors,
  });

  final String label;
  final String emoji;
  final String title;
  final String message;
  final String tip;
  final List<Color> colors;
}

_HomeMoodFeedback _homeMoodFeedback(int mood) {
  switch (mood) {
    case 1:
      return const _HomeMoodFeedback(
        label: 'Sad',
        emoji: '😢',
        title: 'We hear you',
        message:
            "It's okay to have tough days. You're not alone, and checking in shows real strength.",
        tip:
            'Try a breathing exercise or reach out to a trusted contact. Small steps matter.',
        colors: [Color(0xFF60A5FA), Color(0xFF2563EB)],
      );
    case 2:
      return const _HomeMoodFeedback(
        label: 'Okay',
        emoji: '😐',
        title: 'Hanging in there',
        message:
            'Neutral days are part of the journey. You showed up and that counts!',
        tip: 'A short walk or a favorite song can give your mood a gentle boost.',
        colors: [Color(0xFF2DD4BF), Color(0xFF0D9488)],
      );
    case 3:
      return const _HomeMoodFeedback(
        label: 'Good',
        emoji: '😊',
        title: 'Looking good!',
        message: "You're feeling positive today — keep that energy going!",
        tip:
            'Write down one thing you’re grateful for to hold onto this feeling.',
        colors: [Color(0xFF4ADE80), Color(0xFF059669)],
      );
    case 4:
      return const _HomeMoodFeedback(
        label: 'Great',
        emoji: '😃',
        title: 'What a great day!',
        message:
            "You're doing amazing! Your positivity is something to celebrate.",
        tip:
            'Share your good mood with someone — happiness is contagious!',
        colors: [Color(0xFFC084FC), Color(0xFF9333EA)],
      );
    default:
      return const _HomeMoodFeedback(
        label: 'Amazing',
        emoji: '🤩',
        title: "You're on fire!",
        message:
            'Incredible energy today! You should be so proud of yourself.',
        tip: "Channel this energy into a goal or challenge — you've got this!",
        colors: [Color(0xFFFBBF24), Color(0xFFF97316)],
      );
  }
}

class _HomeFinancialModule extends StatelessWidget {
  const _HomeFinancialModule();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FinancialBloc, FinancialState>(
      builder: (context, state) {
        final nextBill = state.bills.where((bill) => !bill.isPaid).isEmpty
            ? null
            : state.bills.where((bill) => !bill.isPaid).first;
        final used = state.totalIncome <= 0 ? 0.0 : (state.totalExpenses / state.totalIncome).clamp(0.0, 1.0);
        return _SurfaceCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ModuleHeader(
                title: 'Financial Management',
                icon: Icons.account_balance_wallet_outlined,
                action: TextButton(
                  onPressed: () => context.push('/financial'),
                  child: const Text('View all'),
                ),
              ),
              if (state.isLoading)
                const LinearProgressIndicator(minHeight: 3)
              else if (!state.hasData)
                const _EmptyInline(
                  icon: Icons.account_balance_wallet_outlined,
                  text: 'Add income, expenses, or bills to see your budget here.',
                )
              else ...[
                Row(
                  children: [
                    Expanded(child: _MetricTile(label: 'Income', value: _money(state.totalIncome), color: const Color(0xFF16A34A))),
                    const SizedBox(width: 8),
                    Expanded(child: _MetricTile(label: 'Expenses', value: _money(state.totalExpenses), color: const Color(0xFFDC2626))),
                    const SizedBox(width: 8),
                    Expanded(child: _MetricTile(label: 'Remaining', value: _money(state.remaining), color: const Color(0xFF2563EB))),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: used,
                    minHeight: 8,
                    backgroundColor: const Color(0xFFE5E7EB),
                    color: used > .9 ? const Color(0xFFDC2626) : const Color(0xFF2563EB),
                  ),
                ),
                if (nextBill != null) ...[
                  const SizedBox(height: 10),
                  _InlineNotice(
                    icon: Icons.receipt_long_outlined,
                    text: 'Upcoming bill: ${nextBill.name} · ${_money(nextBill.amount)}',
                    onTap: () => context.push('/financial'),
                  ),
                ],
              ],
            ],
          ),
        );
      },
    );
  }
}

class _HomeAppointmentsModule extends StatelessWidget {
  const _HomeAppointmentsModule();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CalendarBloc, CalendarState>(
      builder: (context, state) {
        final appointments = state.upcomingAppointments.take(3).toList();
        return _SurfaceCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ModuleHeader(
                title: 'Appointments',
                icon: Icons.calendar_month_outlined,
                action: TextButton(
                  onPressed: () => context.push('/calendar'),
                  child: const Text('View calendar'),
                ),
              ),
              if (state.isLoading)
                const LinearProgressIndicator(minHeight: 3)
              else if (appointments.isEmpty)
                const _EmptyInline(
                  icon: Icons.event_available_outlined,
                  text: 'No appointments scheduled yet.',
                )
              else
                ...appointments.map((item) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                      leading: const Icon(Icons.event_outlined, color: Color(0xFF2563EB)),
                      title: Text(item.title),
                      subtitle: Text(
                        '${_dateLabel(item.appointmentDate)} · ${_timeLabel(item.appointmentDate)}${item.provider == null ? '' : ' · ${item.provider}'}',
                      ),
                      trailing: item.isCompleted
                          ? const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A))
                          : null,
                    )),
            ],
          ),
        );
      },
    );
  }
}

class _HomePharmacyModule extends StatelessWidget {
  const _HomePharmacyModule();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<MedicalBloc, MedicalState>(
      builder: (context, state) => _SurfaceCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ModuleHeader(
              title: 'Medication List',
              icon: Icons.medication_outlined,
              action: TextButton(
                onPressed: () => context.push('/pharmacy'),
                child: const Text('Open pharmacy'),
              ),
            ),
            if (state.isLoading)
              const LinearProgressIndicator(minHeight: 3)
            else if (state.errorMessage != null)
              Text(
                state.errorMessage!,
                style: const TextStyle(color: Color(0xFFB91C1C)),
              )
            else if (state.medications.isEmpty)
              const _EmptyInline(
                icon: Icons.medication_outlined,
                text: 'No medications added yet.',
              )
            else
              ...state.medications.take(3).map(
                    (medication) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                      leading: const Icon(
                        Icons.medication_liquid_outlined,
                        color: Color(0xFFDB2777),
                      ),
                      title: Text(medication.medicationName),
                      subtitle: Text(
                        medication.dosage ?? 'Dosage not recorded',
                      ),
                    ),
                  ),
          ],
        ),
      ),
    );
  }
}

class _HomeAchievementsModule extends StatelessWidget {
  const _HomeAchievementsModule();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<RewardsBloc, RewardsState>(
      builder: (context, state) => _SurfaceCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ModuleHeader(
              title: 'Achievements',
              icon: Icons.emoji_events_outlined,
              action: TextButton(
                onPressed: () => context.push('/rewards'),
                child: const Text('View all'),
              ),
            ),
            if (state.isLoading)
              const LinearProgressIndicator(minHeight: 3)
            else if (state.errorMessage != null)
              Text(
                state.errorMessage!,
                style: const TextStyle(color: Color(0xFFB91C1C)),
              )
            else ...[
              Row(
                children: [
                  const Icon(Icons.stars_rounded, color: Color(0xFFF59E0B)),
                  const SizedBox(width: 8),
                  Text(
                    '${state.pointsBalance?.availablePoints ?? 0} points available',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (state.achievements.isEmpty)
                const Text(
                  'Complete tasks to build your first achievement streak.',
                  style: TextStyle(color: Color(0xFF64748B)),
                )
              else
                ...state.achievements.take(3).map(
                      (achievement) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                        leading: const Icon(
                          Icons.military_tech_outlined,
                          color: Color(0xFFF59E0B),
                        ),
                        title: Text(achievement.title),
                        subtitle: Text(achievement.description),
                      ),
                    ),
            ],
          ],
        ),
      ),
    );
  }
}

class _HomeCaregiverModule extends StatelessWidget {
  const _HomeCaregiverModule();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CaregiverBloc, CaregiverState>(
      builder: (context, state) => _SurfaceCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ModuleHeader(
              title: 'Support Network',
              icon: Icons.people_alt_outlined,
              action: TextButton(
                onPressed: () => context.push('/caregiver'),
                child: const Text('Manage'),
              ),
            ),
            if (state.isLoading)
              const LinearProgressIndicator(minHeight: 3)
            else if (state.errorMessage != null)
              Text(
                state.errorMessage!,
                style: const TextStyle(color: Color(0xFFB91C1C)),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: _HomeStatTile(
                      label: 'Active caregivers',
                      value:
                          '${state.relationships.where((item) => item.isActive).length}',
                      color: const Color(0xFF4F46E5),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _HomeStatTile(
                      label: 'Pending invitations',
                      value: '${state.invitations.length}',
                      color: const Color(0xFF0D9488),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _HomeStatTile extends StatelessWidget {
  const _HomeStatTile({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha(14),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(70)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _HomeModuleBadge extends StatelessWidget {
  const _HomeModuleBadge({
    required this.label,
    required this.color,
  });

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _HomeSafetyModule extends StatelessWidget {
  const _HomeSafetyModule();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<MedicalBloc, MedicalState>(
      builder: (context, state) => _SurfaceCard(
        color: const Color(0xFFFFFBEB),
        borderColor: const Color(0xFFFDE68A),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _ModuleHeader(
              title: 'Safety & Transportation',
              icon: Icons.shield_outlined,
              action: TextButton(
                onPressed: () => context.push('/medical'),
                child: const Text('Open'),
              ),
            ),
            const _HomeModuleBadge(
              label: 'Premium module',
              color: Color(0xFFB45309),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.verified_user_outlined, color: Color(0xFF16A34A)),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Safety plan ready',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                Text(
                  '${state.emergencyContacts.length} contacts',
                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: () => context.push('/medical'),
                  icon: const Icon(Icons.contact_phone_outlined, size: 17),
                  label: const Text('Emergency contacts'),
                ),
                OutlinedButton.icon(
                  onPressed: () => context.push('/resources'),
                  icon: const Icon(Icons.directions_car_outlined, size: 17),
                  label: const Text('Transportation'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeHealthModule extends StatelessWidget {
  const _HomeHealthModule();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DailyTasksBloc, DailyTasksState>(
      builder: (context, taskState) => BlocBuilder<MoodBloc, MoodState>(
        builder: (context, moodState) {
          final total = taskState.tasks.length;
          final completed =
              taskState.tasks.where((task) => task.isCompleted).length;
          final progress = total == 0 ? 0.0 : completed / total;
          return _SurfaceCard(
            color: const Color(0xFFF0FDFA),
            borderColor: const Color(0xFF99F6E4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ModuleHeader(
                  title: 'Health & Wellness',
                  icon: Icons.health_and_safety_outlined,
                  action: TextButton(
                    onPressed: () => context.push('/medical'),
                    child: const Text('Open'),
                  ),
                ),
                const _HomeModuleBadge(
                  label: 'Premium module',
                  color: Color(0xFF0F766E),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _MetricTile(
                        label: 'Routine progress',
                        value: '${(progress * 100).round()}%',
                        color: const Color(0xFF0F766E),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _MetricTile(
                        label: 'Mood check-in',
                        value: moodState.todayMood == null ? 'Needed' : 'Logged',
                        color: const Color(0xFF9333EA),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  moodState.isMoodRequired
                      ? 'A mood check-in is waiting for you.'
                      : 'Your wellness signals are up to date.',
                  style: const TextStyle(color: Color(0xFF475569)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _HomeAccessibilityModule extends StatelessWidget {
  const _HomeAccessibilityModule();

  @override
  Widget build(BuildContext context) {
    return _SurfaceCard(
      color: const Color(0xFFF5F3FF),
      borderColor: const Color(0xFFDDD6FE),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _ModuleHeader(
            title: 'Accessibility Settings',
            icon: Icons.accessibility_new_rounded,
            action: TextButton(
              onPressed: () => context.push('/settings'),
              child: const Text('Open settings'),
            ),
          ),
          const _HomeModuleBadge(
            label: 'Premium module',
            color: Color(0xFF7C3AED),
          ),
          const SizedBox(height: 10),
          const Text(
            'Adjust voice, text size, contrast, and communication preferences for a more comfortable experience.',
            style: TextStyle(color: Color(0xFF475569), height: 1.35),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            children: [
              _HomePreferenceChip(
                icon: Icons.record_voice_over_outlined,
                label: 'Voice support',
              ),
              _HomePreferenceChip(
                icon: Icons.format_size_rounded,
                label: 'Text size',
              ),
              _HomePreferenceChip(
                icon: Icons.contrast_rounded,
                label: 'Contrast',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HomePreferenceChip extends StatelessWidget {
  const _HomePreferenceChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 16, color: const Color(0xFF6D28D9)),
      label: Text(label),
      visualDensity: VisualDensity.compact,
    );
  }
}

class _HomeLifeSkillsModule extends StatelessWidget {
  const _HomeLifeSkillsModule();

  @override
  Widget build(BuildContext context) {
    const lessons = [
      ('Daily routines', Icons.schedule_rounded),
      ('Communication', Icons.forum_outlined),
      ('Independent living', Icons.home_outlined),
    ];
    return _SurfaceCard(
      color: const Color(0xFFF0FDF4),
      borderColor: const Color(0xFFBBF7D0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _ModuleHeader(
            title: 'Life Skills Training',
            icon: Icons.lightbulb_outline_rounded,
            action: TextButton(
              onPressed: () => context.push('/resources'),
              child: const Text('Open lessons'),
            ),
          ),
          const _HomeModuleBadge(
            label: 'Premium module',
            color: Color(0xFF15803D),
          ),
          const SizedBox(height: 10),
          const Text(
            'Choose a small lesson to build confidence in everyday routines.',
            style: TextStyle(color: Color(0xFF475569)),
          ),
          const SizedBox(height: 8),
          ...lessons.map(
            (lesson) => ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: Icon(lesson.$2, color: const Color(0xFF16A34A)),
              title: Text(lesson.$1),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.push('/resources'),
            ),
          ),
        ],
      ),
    );
  }
}

class _HomeProgressModule extends StatelessWidget {
  const _HomeProgressModule();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DailyTasksBloc, DailyTasksState>(
      builder: (context, taskState) => BlocBuilder<RewardsBloc, RewardsState>(
        builder: (context, rewardState) {
          final total = taskState.tasks.length;
          final completed =
              taskState.tasks.where((task) => task.isCompleted).length;
          final progress = total == 0 ? 0.0 : completed / total;
          return _SurfaceCard(
            color: const Color(0xFFEFF6FF),
            borderColor: const Color(0xFFBFDBFE),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ModuleHeader(
                  title: 'Progress & Motivation',
                  icon: Icons.trending_up_rounded,
                  action: TextButton(
                    onPressed: () => context.push('/rewards'),
                    child: const Text('View progress'),
                  ),
                ),
                const _HomeModuleBadge(
                  label: 'Premium module',
                  color: Color(0xFF2563EB),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _MetricTile(
                        label: 'Today',
                        value: '${(progress * 100).round()}%',
                        color: const Color(0xFF2563EB),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _MetricTile(
                        label: 'Points',
                        value:
                            '${rewardState.pointsBalance?.availablePoints ?? 0}',
                        color: const Color(0xFFF59E0B),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 8,
                    backgroundColor: const Color(0xFFDBEAFE),
                    color: const Color(0xFF2563EB),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _HomeFeatureModule extends StatelessWidget {
  const _HomeFeatureModule({required this.module});

  final DashboardModuleModel module;

  @override
  Widget build(BuildContext context) {
    final metadata = _moduleMetadata(module.id);
    return _SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _ModuleHeader(
            title: module.name,
            icon: metadata.$1,
            action: TextButton(
              onPressed: () => context.push(metadata.$2),
              child: const Text('Open'),
            ),
          ),
          Text(
            metadata.$3,
            style: const TextStyle(color: Color(0xFF475569), height: 1.35),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.info_outline_rounded, size: 16, color: Colors.grey.shade600),
              const SizedBox(width: 6),
              const Expanded(
                child: Text(
                  'Add information in this section to see it summarized here.',
                  style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class HomeChatSheet extends StatefulWidget {
  const HomeChatSheet({this.page = false, super.key});

  final bool page;

  @override
  State<HomeChatSheet> createState() => _HomeChatSheetState();
}

class _HomeChatSheetState extends State<HomeChatSheet> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  bool _fullScreen = false;

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          16,
          4,
          16,
          MediaQuery.viewInsetsOf(context).bottom + 12,
        ),
        child: SizedBox(
          height: widget.page
              ? double.infinity
              : _fullScreen
                  ? MediaQuery.sizeOf(context).height * .94
                  : MediaQuery.sizeOf(context).height * .78,
          child: BlocBuilder<HomeBloc, HomeState>(
            builder: (context, state) {
              final loaded = state is HomeLoaded;
              final homeState = loaded ? state as HomeLoaded : null;
              final messages =
                  homeState?.chatMessages ?? const <HomeChatMessage>[];
              final prompts = [
                'What do I need to do today?',
                'What is next?',
                'Help me plan my day',
                'Show my appointments',
              ];
              if (messages.isNotEmpty) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (_scrollController.hasClients) {
                    _scrollController.animateTo(
                      _scrollController.position.maxScrollExtent,
                      duration: const Duration(milliseconds: 180),
                      curve: Curves.easeOut,
                    );
                  }
                });
              }
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const CircleAvatar(
                        backgroundColor: Color(0xFFD1FAE5),
                        foregroundColor: Color(0xFF047857),
                        child: Icon(Icons.auto_awesome_rounded),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('AdaptAI', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                            Text('A calm place to figure out what is next', style: TextStyle(color: Color(0xFF6B7280), fontSize: 12)),
                          ],
                        ),
                      ),
                      IconButton(
                        tooltip: _fullScreen ? 'Compact view' : 'Expand',
                        onPressed: () => setState(() => _fullScreen = !_fullScreen),
                        icon: Icon(
                          _fullScreen
                              ? Icons.fullscreen_exit_rounded
                              : Icons.fullscreen_rounded,
                        ),
                      ),
                      IconButton(
                        tooltip: 'Close',
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (messages.isEmpty)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: prompts
                          .map(
                            (prompt) => ActionChip(
                              label: Text(prompt),
                              onPressed: () => _sendPrompt(context, prompt),
                            ),
                          )
                          .toList(),
                    ),
                  Expanded(
                    child: ListView.builder(
                      controller: _scrollController,
                       itemCount: messages.isEmpty
                           ? 1
                           : 1 + (messages.length > 12 ? 12 : messages.length),
                      itemBuilder: (context, index) {
                         if (index == 0) {
                          return const _ChatWelcome();
                        }
                        final firstVisibleIndex =
                            messages.length > 12 ? messages.length - 12 : 0;
                        return _ChatBubble(
                           message: messages[firstVisibleIndex + index - 1],
                        );
                      },
                    ),
                  ),
                   if (homeState?.chatError != null)
                     Padding(
                       padding: const EdgeInsets.only(top: 6),
                       child: Text(
                         homeState!.chatError!,
                         style: const TextStyle(
                           color: Color(0xFFB91C1C),
                           fontSize: 12,
                         ),
                       ),
                     ),
                  if (messages.isNotEmpty && homeState?.chatLoading != true)
                    Padding(
                      padding: const EdgeInsets.only(top: 6, bottom: 4),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: [
                          'What should I do next?',
                          'Summarize my day',
                          'Help me get organized',
                        ]
                            .map(
                              (prompt) => ActionChip(
                                label: Text(prompt),
                                onPressed: () => _sendPrompt(context, prompt),
                              ),
                            )
                            .toList(),
                      ),
                    ),
                  if (homeState?.pendingChatAction != null)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                             '${_chatActionHeading(homeState!.chatActionStatus)}\n${homeState!.pendingChatAction!.summary}',
                            style: const TextStyle(
                              color: Color(0xFF065F46),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: FilledButton.icon(
                                onPressed: homeState.chatLoading
                                    ? null
                                    : () => context
                                        .read<HomeBloc>()
                                        .add(const ConfirmHomeChatAction()),
                                icon: const Icon(Icons.check_rounded),
                                 label: Text(
                                   homeState.chatActionStatus ==
                                           HomeChatActionStatus.failed
                                       ? 'Retry change'
                                       : 'Confirm change',
                                 ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton(
                              onPressed: homeState.chatLoading
                                  ? null
                                  : () => context
                                      .read<HomeBloc>()
                                      .add(const CancelHomeChatAction()),
                              child: const Text('Cancel'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  if (homeState?.chatLoading == true)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(width: 8),
                           Text(
                             homeState?.pendingChatAction == null
                                 ? 'Thinking…'
                                 : 'Applying your confirmed change…',
                             style: TextStyle(color: Color(0xFF64748B)),
                           ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _send(context),
                          decoration: const InputDecoration(
                            hintText: 'Ask AdaptAI anything…',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        onPressed: loaded && !(homeState?.chatLoading ?? false)
                            ? () => _send(context)
                            : null,
                        icon: homeState?.chatLoading == true
                            ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.arrow_upward_rounded),
                      ),
                    ],
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  void _send(BuildContext context) {
    final message = _controller.text.trim();
    if (message.isEmpty) return;
    context.read<HomeBloc>().add(SendHomeChatMessage(message));
    _controller.clear();
  }

  void _sendPrompt(BuildContext context, String prompt) {
    context.read<HomeBloc>().add(SendHomeChatMessage(prompt));
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.message});

  final HomeChatMessage message;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 330),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: message.isUser
              ? const Color(0xFF2563EB)
              : message.isError
                  ? const Color(0xFFFEF2F2)
                  : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment:
              message.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              message.text,
              style: TextStyle(
                color: message.isUser
                    ? Colors.white
                    : message.isError
                        ? const Color(0xFF991B1B)
                        : const Color(0xFF1F2937),
                height: 1.35,
              ),
            ),
            if (message.timestamp != null) ...[
              const SizedBox(height: 4),
              Text(
                _chatTimeLabel(message.timestamp!),
                style: TextStyle(
                  color: message.isUser
                      ? Colors.white70
                      : const Color(0xFF94A3B8),
                  fontSize: 10,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

String _chatTimeLabel(DateTime value) {
  final hour = value.hour % 12 == 0 ? 12 : value.hour % 12;
  final minute = value.minute.toString().padLeft(2, '0');
  return '$hour:$minute ${value.hour >= 12 ? 'PM' : 'AM'}';
}

String _chatActionHeading(HomeChatActionStatus status) {
  switch (status) {
    case HomeChatActionStatus.executing:
      return 'Applying confirmed action';
    case HomeChatActionStatus.failed:
      return 'Action failed — try again';
    case HomeChatActionStatus.cancelled:
      return 'Action cancelled';
    case HomeChatActionStatus.completed:
      return 'Action completed';
    case HomeChatActionStatus.pending:
    case HomeChatActionStatus.idle:
      return 'Action proposed';
  }
}

class _ChatWelcome extends StatelessWidget {
  const _ChatWelcome();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 18, bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDFA),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF99F6E4)),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome_rounded, color: Color(0xFF0F766E)),
              SizedBox(width: 8),
              Text(
                'How can I help today?',
                style: TextStyle(
                  color: Color(0xFF134E4A),
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          SizedBox(height: 8),
          Text(
            'Ask about your tasks, appointments, routines, or the next small step. I will ask before making any change.',
            style: TextStyle(color: Color(0xFF475569), height: 1.4),
          ),
        ],
      ),
    );
  }
}

class _SurfaceCard extends StatelessWidget {
  const _SurfaceCard({
    required this.child,
    this.color = Colors.white,
    this.gradient,
    this.borderColor = const Color(0xFFE5E7EB),
    this.padding = const EdgeInsets.all(16),
  });

  final Widget child;
  final Color color;
  final Gradient? gradient;
  final Color borderColor;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: gradient == null ? color : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: const [
          BoxShadow(color: Color(0x0D111827), blurRadius: 8, offset: Offset(0, 3)),
        ],
      ),
      child: child,
    );
  }
}

class _ModuleHeader extends StatelessWidget {
  const _ModuleHeader({required this.title, required this.icon, this.action});

  final String title;
  final IconData icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Icon(icon, color: const Color(0xFF2563EB)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          ),
          if (action != null) action!,
        ],
      );
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withAlpha(16),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11)),
            const SizedBox(height: 3),
            Text(value, style: TextStyle(color: color, fontSize: 16, fontWeight: FontWeight.w800)),
          ],
        ),
      );
}

class _FlowStat extends StatelessWidget {
  const _FlowStat({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 8),
          decoration: BoxDecoration(
            color: color.withAlpha(14),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: color.withAlpha(45)),
          ),
          child: Column(
            children: [
              Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w800)),
              Text(label, style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
            ],
          ),
        ),
      );
}

class _TaskRow extends StatelessWidget {
  const _TaskRow({required this.task});

  final dynamic task;

  @override
  Widget build(BuildContext context) => ListTile(
        dense: true,
        contentPadding: EdgeInsets.zero,
        leading: Icon(
          task.isCompleted ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
          color: task.isCompleted ? const Color(0xFF16A34A) : const Color(0xFF94A3B8),
        ),
        title: Text(
          task.title,
          style: TextStyle(
            decoration: task.isCompleted ? TextDecoration.lineThrough : null,
            color: task.isCompleted ? const Color(0xFF94A3B8) : const Color(0xFF1F2937),
          ),
        ),
        subtitle: Text('${task.category}${task.estimatedMinutes > 0 ? ' · ${task.estimatedMinutes} min' : ''}'),
        onTap: () => context.push('/daily-tasks'),
      );
}

class _TimelineItem {
  const _TimelineItem({
    required this.title,
    required this.detail,
    required this.time,
    required this.icon,
    required this.color,
    required this.route,
  });

  final String title;
  final String? detail;
  final DateTime? time;
  final IconData icon;
  final Color color;
  final String route;
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({required this.item});

  final _TimelineItem item;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: () => context.push(item.route),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 7),
          child: Row(
            children: [
              CircleAvatar(
                radius: 17,
                backgroundColor: item.color.withAlpha(24),
                foregroundColor: item.color,
                child: Icon(item.icon, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.title, style: const TextStyle(fontWeight: FontWeight.w700)),
                    if (item.detail != null && item.detail!.isNotEmpty)
                      Text(item.detail!, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 12)),
                  ],
                ),
              ),
              Text(item.time == null ? 'Anytime' : _timeLabel(item.time!), style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
            ],
          ),
        ),
      );
}

class _InlineNotice extends StatelessWidget {
  const _InlineNotice({required this.icon, required this.text, this.onTap});

  final IconData icon;
  final String text;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              Icon(icon, size: 18, color: const Color(0xFF2563EB)),
              const SizedBox(width: 8),
              Expanded(child: Text(text, style: const TextStyle(color: Color(0xFF475569), fontSize: 12))),
              if (onTap != null) const Icon(Icons.chevron_right_rounded, size: 18),
            ],
          ),
        ),
      );
}

class _EmptyInline extends StatelessWidget {
  const _EmptyInline({required this.icon, required this.text, this.action});

  final IconData icon;
  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Icon(icon, color: const Color(0xFF94A3B8)),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13))),
          if (action != null) action!,
        ],
      );
}

class _GuideLoading extends StatelessWidget {
  const _GuideLoading();

  @override
  Widget build(BuildContext context) => const _SurfaceCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 180, child: LinearProgressIndicator()),
            SizedBox(height: 14),
            LinearProgressIndicator(),
            SizedBox(height: 8),
            LinearProgressIndicator(),
          ],
        ),
      );
}

IconData _iconFor(String value) {
  switch (value) {
    case 'shopping_cart':
      return Icons.shopping_cart_outlined;
    case 'medical_services':
      return Icons.medical_services_outlined;
    case 'check_box':
      return Icons.check_box_outlined;
    case 'mood':
      return Icons.sentiment_satisfied_alt_outlined;
    case 'calendar':
      return Icons.calendar_month_outlined;
    case 'sparkles':
      return Icons.auto_awesome_rounded;
    case 'message_square':
      return Icons.chat_bubble_outline_rounded;
    case 'people':
      return Icons.people_outline_rounded;
    case 'medication':
      return Icons.medication_outlined;
    case 'menu_book':
      return Icons.menu_book_outlined;
    case 'emoji_events':
      return Icons.emoji_events_outlined;
    case 'star':
      return Icons.star_outline_rounded;
    case 'school':
      return Icons.school_outlined;
    case 'description':
      return Icons.description_outlined;
    default:
      return Icons.apps_rounded;
  }
}

String _safeRoute(String route) {
  switch (route) {
    case '/caregiver':
      return '/caregiver';
    case '/pharmacy':
      return '/pharmacy';
    case '/personal-documents':
      return '/personal-documents';
    default:
      return route;
  }
}

(IconData, String, String) _moduleMetadata(String id) {
  switch (id) {
    case 'pharmacy':
      return (Icons.medication_outlined, '/medical', 'Keep a personal medication list and review refill information.');
    case 'achievements':
      return (Icons.emoji_events_outlined, '/rewards', 'Track points, achievements, and challenges as you build independence.');
    case 'caregiver':
      return (Icons.people_alt_outlined, '/caregiver-dashboard', 'Stay connected with the caregivers and support people you choose.');
    case 'accessibility':
      return (Icons.accessibility_new_rounded, '/settings', 'Adjust voice, appearance, safety, and accessibility preferences.');
    case 'safety':
    case 'safety-transportation':
      return (Icons.shield_outlined, '/resources', 'Keep safety resources and transportation planning easy to reach.');
    case 'health':
    case 'health-wellness':
      return (Icons.health_and_safety_outlined, '/medical', 'Organize health information and build healthy routines.');
    case 'life-skills':
      return (Icons.lightbulb_outline_rounded, '/resources', 'Explore practical resources for everyday independence.');
    case 'progress':
    case 'progress-motivation':
      return (Icons.trending_up_rounded, '/rewards', 'Review your progress and celebrate completed goals.');
    default:
      return (Icons.apps_rounded, '/resources', 'Explore this Adaptalyfe module and add information when you are ready.');
  }
}

String _moodEmoji(int mood) {
  switch (mood) {
    case 1:
      return '😢';
    case 2:
      return '😐';
    case 3:
      return '😊';
    case 4:
      return '😃';
    case 5:
      return '🤩';
    default:
      return '🙂';
  }
}

IconData _guideIcon(String type) {
  switch (type) {
    case 'appointment':
      return Icons.calendar_month_rounded;
    case 'calendar':
      return Icons.event_rounded;
    default:
      return Icons.check_circle_outline_rounded;
  }
}

Color _priorityColor(String priority) {
  switch (priority) {
    case 'high':
      return const Color(0xFFDC2626);
    case 'low':
      return const Color(0xFF64748B);
    default:
      return const Color(0xFF2563EB);
  }
}

DateTime? _parseTaskTime(String? value, DateTime day) {
  if (value == null || value.isEmpty) return null;
  final parts = value.split(':');
  if (parts.length < 2) return null;
  final hour = int.tryParse(parts[0]);
  final minute = int.tryParse(parts[1]);
  if (hour == null || minute == null) return null;
  return DateTime(day.year, day.month, day.day, hour, minute);
}

String _dateLabel(DateTime date) => '${_weekday(date.weekday)}, ${_month(date.month)} ${date.day}';

String _timeLabel(DateTime date) {
  final hour = date.hour == 0 ? 12 : date.hour > 12 ? date.hour - 12 : date.hour;
  final minute = date.minute.toString().padLeft(2, '0');
  final suffix = date.hour >= 12 ? 'PM' : 'AM';
  return '$hour:$minute $suffix';
}

String _money(double value) => '\$${value.toStringAsFixed(2)}';

String _weekday(int day) {
  const names = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  final index = day < 1 ? 0 : day > 7 ? 6 : day - 1;
  return names[index];
}

String _month(int month) {
  const names = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  final index = month < 1 ? 0 : month > 12 ? 11 : month - 1;
  return names[index];
}
