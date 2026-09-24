import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/date/calendar_date.dart';
import '../../../core/layout/responsive.dart';
import '../../../core/utils/display_labels.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../daily_tasks/utils/daily_task_schedule.dart';
import '../bloc/calendar_bloc.dart';
import '../bloc/calendar_event.dart';
import '../bloc/calendar_state.dart';
import '../models/calendar_models.dart';

class CalendarScreen extends StatelessWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<CalendarBloc, CalendarState>(
      listener: (context, state) {
        if (state.sessionInvalid) {
          context.read<AuthBloc>().add(const CheckAuthentication());
          return;
        }
        final message = state.actionMessage ?? state.errorMessage;
        if (message == null || message.isEmpty) return;
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor:
                  state.errorMessage != null ? const Color(0xFFB91C1C) : null,
            ),
          );
      },
      builder: (context, state) {
        if (state.status == CalendarStatus.initial ||
            (state.isLoading && !state.hasData)) {
          return const Scaffold(
            appBar: _CalendarAppBar(),
            body: _CalendarLoading(),
          );
        }

        if (state.status == CalendarStatus.failure && !state.hasData) {
          return Scaffold(
            appBar: const _CalendarAppBar(),
            body: _CalendarError(
              message: state.errorMessage ?? 'Unable to load calendar data.',
              onRetry: () =>
                  context.read<CalendarBloc>().add(const RefreshCalendar()),
            ),
          );
        }

        return Scaffold(
          body: SafeArea(
            child: Column(
              children: [
                if (state.isLoading || state.busyAction != null)
                  const LinearProgressIndicator(minHeight: 2),
                Expanded(child: _CalendarView(state: state)),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _CalendarAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _CalendarAppBar();

  @override
  Widget build(BuildContext context) => AppBar(title: const Text('Calendar'));

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _CalendarView extends StatelessWidget {
  const _CalendarView({required this.state});

  final CalendarState state;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        final bloc = context.read<CalendarBloc>();
        bloc.add(const RefreshCalendar());
        await bloc.stream.firstWhere(
          (next) =>
              next.status == CalendarStatus.loaded ||
              next.status == CalendarStatus.failure,
        );
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 28),
        children: [
          _CalendarPageHeader(state: state),
          const SizedBox(height: 18),
          _CalendarNavigation(state: state),
          const SizedBox(height: 12),
          if (state.view == CalendarView.month)
            _MonthCalendar(state: state)
          else if (state.view == CalendarView.week)
            _WeekCalendar(state: state)
          else
            _DayCalendar(state: state),
          const SizedBox(height: 18),
          const _CalendarLegend(),
          if (!state.hasData) ...[
            const SizedBox(height: 16),
            _EmptyCard(
              icon: Icons.event_available_outlined,
              title: 'No events scheduled',
              subtitle: 'Use the add button to schedule an appointment or event.',
            ),
          ],
        ],
      ),
    );
  }
}

class _CalendarPageHeader extends StatelessWidget {
  const _CalendarPageHeader({required this.state});

  final CalendarState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<CalendarBloc>();
    return LayoutBuilder(
      builder: (context, constraints) {
        final title = const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.calendar_month_rounded, color: Color(0xFF2563EB)),
            SizedBox(width: 8),
            Text(
              'Calendar',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: Color(0xFF111827),
              ),
            ),
          ],
        );
        final actions = Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            OutlinedButton(
              onPressed: () => bloc.add(CalendarDateChanged(DateTime.now())),
              child: const Text('Today'),
            ),
            const SizedBox(width: 8),
            FilledButton.icon(
              onPressed: () => _showCalendarEventDialog(
                context,
                null,
                state.selectedDate,
              ),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add Event'),
            ),
          ],
        );

        if (constraints.maxWidth < 420) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              title,
              const SizedBox(height: 10),
              Align(alignment: Alignment.centerRight, child: actions),
            ],
          );
        }

        return Row(
          children: [
            Expanded(child: title),
            actions,
          ],
        );
      },
    );
  }
}

class _CalendarNavigation extends StatelessWidget {
  const _CalendarNavigation({required this.state});

  final CalendarState state;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<CalendarBloc>();
    return Column(
      children: [
        Row(
          children: [
            IconButton(
              tooltip: 'Previous',
              onPressed: () => bloc.add(
                const CalendarNavigate(CalendarNavigationDirection.previous),
              ),
              icon: const Icon(Icons.chevron_left_rounded),
            ),
            Expanded(
              child: Text(
                _headerLabel(state),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            IconButton(
              tooltip: 'Next',
              onPressed: () => bloc.add(
                const CalendarNavigate(CalendarNavigationDirection.next),
              ),
              icon: const Icon(Icons.chevron_right_rounded),
            ),
          ],
        ),
        Row(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFFD1D5DB)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: CalendarView.values
                        .map(
                          (view) => Expanded(
                            child: InkWell(
                              onTap: () => bloc.add(CalendarViewChanged(view)),
                              child: Container(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 11),
                                decoration: BoxDecoration(
                                  color: state.view == view
                                      ? const Color(0xFF2563EB)
                                      : Colors.white,
                                  border: view == CalendarView.month
                                      ? null
                                      : const Border(
                                          left: BorderSide(
                                            color: Color(0xFFD1D5DB),
                                          ),
                                        ),
                                ),
                                child: Text(
                                  _viewLabel(view),
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: state.view == view
                                        ? Colors.white
                                        : const Color(0xFF374151),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _MonthCalendar extends StatelessWidget {
  const _MonthCalendar({required this.state});

  final CalendarState state;

  @override
  Widget build(BuildContext context) {
    final first = DateTime(state.selectedDate.year, state.selectedDate.month, 1);
    final gridStart = first.subtract(Duration(days: first.weekday % 7));
    final today = DateTime.now();

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          const _WeekdayHeader(),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 42,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              childAspectRatio: 0.5,
            ),
            itemBuilder: (context, index) {
              final date = gridStart.add(Duration(days: index));
              final items = _itemsForDate(state, date);
              final isToday = DateUtils.isSameDay(date, today);
              final inMonth = date.month == state.selectedDate.month;
              return LayoutBuilder(
                builder: (context, constraints) {
                  final maxVisibleItems = constraints.maxWidth < 52 ? 2 : 3;
                  return InkWell(
                    onTap: () {
                      final bloc = context.read<CalendarBloc>();
                      bloc.add(CalendarDateChanged(date));
                      bloc.add(const CalendarViewChanged(CalendarView.day));
                    },
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: isToday
                            ? const Color(0xFFEFF6FF)
                            : inMonth
                                ? Colors.white
                                : const Color(0xFFF8FAFC),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Align(
                            alignment: Alignment.topRight,
                            child: CircleAvatar(
                              radius: isToday ? 10 : 9,
                              backgroundColor: isToday
                                  ? const Color(0xFF2563EB)
                                  : Colors.transparent,
                              child: Text(
                                '${date.day}',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: isToday
                                      ? Colors.white
                                      : inMonth
                                          ? const Color(0xFF374151)
                                          : const Color(0xFF9CA3AF),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 2),
                          ...items
                              .take(maxVisibleItems)
                              .map((item) => _MiniCalendarItem(item: item)),
                          if (items.length > maxVisibleItems)
                            Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                '+${items.length - maxVisibleItems} more',
                                style: const TextStyle(
                                  fontSize: 9,
                                  color: Color(0xFF6B7280),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }
}

class _WeekdayHeader extends StatelessWidget {
  const _WeekdayHeader();

  @override
  Widget build(BuildContext context) {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Row(
      children: labels
          .map(
            (label) => Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 9),
                color: const Color(0xFFF3F4F6),
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF4B5563),
                  ),
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _MiniCalendarItem extends StatelessWidget {
  const _MiniCalendarItem({required this.item});

  final _CalendarItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 2),
      padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 2),
      decoration: BoxDecoration(
        color: item.backgroundColor,
        borderRadius: BorderRadius.circular(3),
        border: Border(
          left: BorderSide(color: item.accentColor, width: 2),
        ),
      ),
      child: Text(
        item.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 9,
          color: item.textColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _WeekCalendar extends StatelessWidget {
  const _WeekCalendar({required this.state});

  final CalendarState state;

  @override
  Widget build(BuildContext context) {
    final selected = state.selectedDate;
    final start = selected.subtract(Duration(days: selected.weekday % 7));
    return Card(
      child: Column(
        children: List.generate(7, (index) {
          final date = start.add(Duration(days: index));
          final items = _itemsForDate(state, date);
          final allDayItems = items.where((item) => item.allDay).toList();
          final timedItems = items.where((item) => !item.allDay).toList();
          final isToday = DateUtils.isSameDay(date, DateTime.now());
          return Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isToday ? const Color(0xFFEFF6FF) : Colors.white,
              border: const Border(
                bottom: BorderSide(color: Color(0xFFE5E7EB)),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      _formatWeekday(date),
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: isToday
                            ? const Color(0xFF1D4ED8)
                            : const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatMonthDay(date),
                      style: const TextStyle(color: Color(0xFF6B7280)),
                    ),
                    const Spacer(),
                    Text(
                      '${items.length} ${items.length == 1 ? 'event' : 'events'}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
                if (items.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 10),
                    child: Text(
                      'No events scheduled',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  )
                else
                  Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (allDayItems.isNotEmpty) ...[
                          const Text(
                            'All Day',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF374151),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: allDayItems
                                .map(
                                  (item) => _CalendarItemCard(
                                    item: item,
                                    compact: true,
                                    onEdit: item.eventId == null
                                        ? null
                                        : () => _showCalendarEventDialog(
                                              context,
                                              item.eventId,
                                            ),
                                    onDelete: item.eventId == null
                                        ? null
                                        : () => _confirmDeleteEvent(
                                              context,
                                              item.eventId!,
                                            ),
                                  ),
                                )
                                .toList(),
                          ),
                        ],
                        if (timedItems.isNotEmpty) ...[
                          if (allDayItems.isNotEmpty)
                            const SizedBox(height: 8),
                          const Text(
                            'Timed',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF374151),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: timedItems
                                .map(
                                  (item) => _CalendarItemCard(
                                    item: item,
                                    compact: true,
                                    onEdit: item.eventId == null
                                        ? null
                                        : () => _showCalendarEventDialog(
                                              context,
                                              item.eventId,
                                            ),
                                    onDelete: item.eventId == null
                                        ? null
                                        : () => _confirmDeleteEvent(
                                              context,
                                              item.eventId!,
                                            ),
                                  ),
                                )
                                .toList(),
                          ),
                        ],
                      ],
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

class _DayCalendar extends StatelessWidget {
  const _DayCalendar({required this.state});

  final CalendarState state;

  @override
  Widget build(BuildContext context) {
    final items = _itemsForDate(state, state.selectedDate);
    final allDayItems = items.where((item) => item.allDay).toList();
    final timedItems = items.where((item) => !item.allDay).toList();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: items.isEmpty
            ? const _EmptyCard(
                icon: Icons.free_breakfast_outlined,
                title: 'No events scheduled',
                subtitle: 'Free day to relax!',
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _formatLongDate(state.selectedDate),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (allDayItems.isNotEmpty) ...[
                    const Text(
                      'All Day',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF374151),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...allDayItems.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _CalendarItemCard(
                          item: item,
                          onEdit: item.eventId == null
                              ? null
                              : () => _showCalendarEventDialog(
                                    context,
                                    item.eventId,
                                  ),
                          onDelete: item.eventId == null
                              ? null
                              : () => _confirmDeleteEvent(
                                    context,
                                    item.eventId!,
                                  ),
                        ),
                      ),
                    ),
                  ],
                  if (timedItems.isNotEmpty) ...[
                    if (allDayItems.isNotEmpty) const SizedBox(height: 4),
                    const Text(
                      'Timed',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF374151),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...timedItems.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _CalendarItemCard(
                          item: item,
                          onEdit: item.eventId == null
                              ? null
                              : () => _showCalendarEventDialog(
                                    context,
                                    item.eventId,
                                  ),
                          onDelete: item.eventId == null
                              ? null
                              : () => _confirmDeleteEvent(
                                    context,
                                    item.eventId!,
                                  ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
      ),
    );
  }
}

class _CalendarItemCard extends StatelessWidget {
  const _CalendarItemCard({
    required this.item,
    this.compact = false,
    this.onEdit,
    this.onDelete,
  });

  final _CalendarItem item;
  final bool compact;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
     return Container(
       constraints: compact
           ? BoxConstraints(
               maxWidth: MediaQuery.sizeOf(context).width - 48,
             )
           : const BoxConstraints(),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: item.backgroundColor,
        borderRadius: BorderRadius.circular(10),
        border: Border(
          left: BorderSide(color: item.accentColor, width: 4),
        ),
      ),
      child: Row(
        children: [
          Icon(item.icon, color: item.accentColor),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                if (item.timeLabel != null)
                  Text(
                    item.timeLabel!,
                    style: TextStyle(
                      fontSize: 12,
                      color: item.textColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                if (item.location != null)
                  Text(
                    item.location!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF4B5563),
                    ),
                  ),
                Text(
                  item.typeLabel,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          if (item.isCompleted)
            const Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 20),
          if (onEdit != null || onDelete != null)
            PopupMenuButton<String>(
              padding: EdgeInsets.zero,
              onSelected: (value) {
                if (value == 'edit') onEdit?.call();
                if (value == 'delete') onDelete?.call();
              },
              itemBuilder: (context) => [
                if (onEdit != null)
                  const PopupMenuItem(value: 'edit', child: Text('Edit event')),
                if (onDelete != null)
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text('Delete event'),
                  ),
              ],
              icon: const Icon(Icons.more_vert, size: 20),
            ),
        ],
      ),
    );
  }
}

class _AppointmentsView extends StatefulWidget {
  const _AppointmentsView({required this.state});

  final CalendarState state;

  @override
  State<_AppointmentsView> createState() => _AppointmentsViewState();
}

class _AppointmentsViewState extends State<_AppointmentsView> {
  _AppointmentFilter filter = _AppointmentFilter.all;

  @override
  Widget build(BuildContext context) {
    final appointments = widget.state.appointments
        .where(_matchesFilter)
        .toList()
      ..sort(
        (a, b) => a.appointmentDate.compareTo(b.appointmentDate),
      );

    return RefreshIndicator(
      onRefresh: () async {
        final bloc = context.read<CalendarBloc>();
        bloc.add(const RefreshCalendar());
        await bloc.stream.firstWhere(
          (next) =>
              next.status == CalendarStatus.loaded ||
              next.status == CalendarStatus.failure,
        );
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          if (widget.state.upcomingAppointments.isNotEmpty)
            Card(
              color: const Color(0xFFFFFBEB),
              child: ListTile(
                leading: const Icon(Icons.schedule, color: Color(0xFFD97706)),
                title: Text(
                  '${widget.state.upcomingAppointments.length} upcoming appointment'
                  '${widget.state.upcomingAppointments.length == 1 ? '' : 's'}',
                ),
                subtitle: const Text('Appointments within the next 24 hours'),
              ),
            ),
          Card(
            color: const Color(0xFFF8FAFC),
            child: const Padding(
              padding: EdgeInsets.all(12),
              child: Text(
                'Appointments can be marked complete here. The current backend '
                'does not provide appointment edit or delete routes.',
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF475569),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: SegmentedButton<_AppointmentFilter>(
              segments: const [
                ButtonSegment(value: _AppointmentFilter.all, label: Text('All')),
                ButtonSegment(
                  value: _AppointmentFilter.upcoming,
                  label: Text('Soon'),
                ),
                ButtonSegment(
                  value: _AppointmentFilter.missed,
                  label: Text('Missed'),
                ),
                ButtonSegment(
                  value: _AppointmentFilter.completed,
                  label: Text('Completed'),
                ),
              ],
              selected: {filter},
              onSelectionChanged: (selection) =>
                  setState(() => filter = selection.first),
              showSelectedIcon: false,
            ),
          ),
          const SizedBox(height: 14),
          if (appointments.isEmpty)
            const _EmptyCard(
              icon: Icons.event_busy_outlined,
              title: 'No appointments found',
              subtitle: 'Use the add button to schedule your first appointment.',
            )
          else
            ...appointments.map(
              (appointment) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _AppointmentCard(appointment: appointment),
              ),
            ),
        ],
      ),
    );
  }

  bool _matchesFilter(AppointmentModel appointment) {
    switch (filter) {
      case _AppointmentFilter.all:
        return true;
      case _AppointmentFilter.completed:
        return appointment.isCompleted;
      case _AppointmentFilter.missed:
        return !appointment.isCompleted &&
            appointment.appointmentDate.isBefore(DateTime.now());
      case _AppointmentFilter.upcoming:
        final difference =
            appointment.appointmentDate.difference(DateTime.now()).inHours;
        return !appointment.isCompleted && difference >= 0 && difference <= 24;
    }
  }
}

class _AppointmentCard extends StatelessWidget {
  const _AppointmentCard({required this.appointment});

  final AppointmentModel appointment;

  @override
  Widget build(BuildContext context) {
    final status = _appointmentStatus(appointment);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const CircleAvatar(
              backgroundColor: Color(0xFFF3E8FF),
              foregroundColor: Color(0xFF7E22CE),
              child: Icon(Icons.medical_services_outlined),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          appointment.title,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      _StatusChip(status: status),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${_relativeDay(appointment.appointmentDate)} • '
                    '${_formatMonthDay(appointment.appointmentDate)}',
                    style: const TextStyle(color: Color(0xFF4B5563)),
                  ),
                  Text(
                    _formatTime(context, appointment.appointmentDate),
                    style: const TextStyle(color: Color(0xFF4B5563)),
                  ),
                  if (_hasText(appointment.provider))
                    Text(
                      _capitalize(appointment.provider!),
                      style: const TextStyle(color: Color(0xFF4B5563)),
                    ),
                  if (_hasText(appointment.location))
                    Text(
                      appointment.location!,
                      style: const TextStyle(color: Color(0xFF4B5563)),
                    ),
                  if (_hasText(appointment.description))
                    Padding(
                      padding: const EdgeInsets.only(top: 5),
                      child: Text(
                        appointment.description!,
                        style: const TextStyle(color: Color(0xFF4B5563)),
                      ),
                    ),
                ],
              ),
            ),
            if (!appointment.isCompleted && status != 'missed')
              IconButton(
                tooltip: 'Mark complete',
                onPressed: context.read<CalendarBloc>().state.busyAction != null
                    ? null
                    : () => context.read<CalendarBloc>().add(
                          CompleteAppointment(
                            id: appointment.id,
                            isCompleted: true,
                          ),
                        ),
                icon: const Icon(
                  Icons.check_circle_outline,
                  color: Color(0xFF16A34A),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final data = switch (status) {
      'completed' => (
          'Completed',
          const Color(0xFFDCFCE7),
          const Color(0xFF166534)
        ),
      'missed' => ('Missed', const Color(0xFFFEE2E2), const Color(0xFF991B1B)),
      'upcoming' => ('Soon', const Color(0xFFFEF3C7), const Color(0xFF92400E)),
      _ => ('Scheduled', const Color(0xFFDBEAFE), const Color(0xFF1E40AF)),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: data.$2,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        data.$1,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: data.$3,
        ),
      ),
    );
  }
}

class _CalendarLegend extends StatelessWidget {
  const _CalendarLegend();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Wrap(
          spacing: 16,
          runSpacing: 10,
          children: const [
            _LegendItem(
              color: Color(0xFF2563EB),
              label: 'Daily Tasks',
            ),
            _LegendItem(
              color: Color(0xFFDC2626),
              label: 'Bills',
            ),
            _LegendItem(
              color: Color(0xFF9333EA),
              label: 'Appointments',
            ),
            _LegendItem(
              color: Color(0xFFDB2777),
              label: 'Mood Check-ins',
            ),
          ],
        ),
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  const _LegendItem({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.circle, size: 12, color: color),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 12),
          ),
        ),
      ],
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 28),
        child: Column(
          children: [
            Icon(icon, size: 46, color: const Color(0xFFD1D5DB)),
            const SizedBox(height: 10),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: Color(0xFF4B5563),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CalendarLoading extends StatelessWidget {
  const _CalendarLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const LinearProgressIndicator(),
        const SizedBox(height: 18),
        ...List.generate(
          5,
          (index) => const Padding(
            padding: EdgeInsets.only(bottom: 12),
            child: Card(
              child: SizedBox(height: 68),
            ),
          ),
        ),
      ],
    );
  }
}

class _CalendarError extends StatelessWidget {
  const _CalendarError({required this.message, required this.onRetry});

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
              Icons.cloud_off_outlined,
              size: 48,
              color: Color(0xFF9CA3AF),
            ),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 14),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

enum _AppointmentFilter {
  all,
  upcoming,
  missed,
  completed,
}

enum _CalendarItemType { task, bill, appointment, event, mood }

class _CalendarItem {
  const _CalendarItem({
    required this.title,
    required this.start,
    required this.type,
    required this.isCompleted,
    required this.category,
    required this.location,
    this.eventId,
    this.allDay = false,
    this.isRecurring = false,
    this.recurrenceRule,
    this.time,
  });

  final String title;
  final DateTime start;
  final _CalendarItemType type;
  final bool isCompleted;
  final String category;
  final String? location;
  final int? eventId;
  final bool allDay;
  final bool isRecurring;
  final String? recurrenceRule;
  final String? time;

  bool get isAppointment => type == _CalendarItemType.appointment;

  String? get timeLabel {
    if (time != null && time!.isNotEmpty) return time;
    if (allDay) {
      if (!isRecurring) return 'Whole Day';
      final rule = recurrenceRule?.trim();
      if (rule == null || rule.isEmpty) return 'Repeats';
      final label =
          '${rule[0].toUpperCase()}${rule.substring(1).toLowerCase()}';
      return 'Repeats $label';
    }
    if (type == _CalendarItemType.task && start.hour == 0) {
      return null;
    }
    return _formatTimeStatic(start);
  }

  IconData get icon {
    switch (type) {
      case _CalendarItemType.task:
        return isCompleted ? Icons.check_circle : Icons.circle_outlined;
      case _CalendarItemType.bill:
        return Icons.attach_money_rounded;
      case _CalendarItemType.appointment:
        return Icons.medical_services_outlined;
      case _CalendarItemType.event:
        return Icons.event_outlined;
      case _CalendarItemType.mood:
        return Icons.favorite_outline_rounded;
    }
  }

  Color get accentColor {
    switch (type) {
      case _CalendarItemType.task:
        return const Color(0xFF2563EB);
      case _CalendarItemType.bill:
        return const Color(0xFFDC2626);
      case _CalendarItemType.appointment:
        return const Color(0xFF9333EA);
      case _CalendarItemType.event:
        return const Color(0xFF4F46E5);
      case _CalendarItemType.mood:
        return const Color(0xFFDB2777);
    }
  }

  Color get backgroundColor {
    switch (type) {
      case _CalendarItemType.task:
        return const Color(0xFFEFF6FF);
      case _CalendarItemType.bill:
        return const Color(0xFFFEF2F2);
      case _CalendarItemType.appointment:
        return const Color(0xFFF3E8FF);
      case _CalendarItemType.event:
        return const Color(0xFFEEF2FF);
      case _CalendarItemType.mood:
        return const Color(0xFFFCE7F3);
    }
  }

  Color get textColor {
    switch (type) {
      case _CalendarItemType.task:
        return const Color(0xFF1E40AF);
      case _CalendarItemType.bill:
        return const Color(0xFF991B1B);
      case _CalendarItemType.appointment:
        return const Color(0xFF6B21A8);
      case _CalendarItemType.event:
        return const Color(0xFF3730A3);
      case _CalendarItemType.mood:
        return const Color(0xFF9D174D);
    }
  }

  String get typeLabel {
    switch (type) {
      case _CalendarItemType.task:
        return 'Daily Task';
      case _CalendarItemType.bill:
        return 'Bill Due';
      case _CalendarItemType.appointment:
        return 'Appointment';
      case _CalendarItemType.event:
        return 'Event';
      case _CalendarItemType.mood:
        return 'Mood Check-in';
    }
  }
}

List<_CalendarItem> _itemsForDate(CalendarState state, DateTime date) {
  final items = <_CalendarItem>[];
  for (final appointment in state.appointments) {
    if (DateUtils.isSameDay(appointment.appointmentDate, date)) {
      items.add(
        _CalendarItem(
          title: appointment.title,
          start: appointment.appointmentDate,
          type: _CalendarItemType.appointment,
          isCompleted: appointment.isCompleted,
          category: appointment.provider ?? 'Appointment',
          location: appointment.location,
        ),
      );
    }
  }
  for (final event in state.calendarEvents) {
    if (_calendarEventOccursOnDate(event, date)) {
      items.add(
        _CalendarItem(
          title: event.title,
          start: event.startDate,
          type: _CalendarItemType.event,
          isCompleted: event.isCompleted,
          category: event.category,
          location: event.location,
          eventId: event.id,
          allDay: event.allDay,
          isRecurring: event.isRecurring,
          recurrenceRule: event.recurrenceRule,
        ),
      );
    }
  }
  for (final task in state.tasks) {
    final isDaily = task.frequency.isEmpty || task.frequency == 'daily';
    if (isDailyTaskScheduledForDate(task, date)) {
      items.add(
        _CalendarItem(
          title: task.title,
          start: date,
          type: _CalendarItemType.task,
          isCompleted: task.isCompletedForDate(date),
          category: prettyDisplayLabel(
            task.category.isEmpty ? 'daily' : task.category,
          ),
          location: null,
        ),
      );
    }
    final dueDate = task.dueDate;
    if (!isDaily && dueDate != null && DateUtils.isSameDay(dueDate, date)) {
      items.add(
        _CalendarItem(
          title: task.title,
          start: dueDate,
          type: _CalendarItemType.task,
          isCompleted: task.isCompletedForDate(date),
          category: task.frequency.isEmpty ? 'scheduled' : task.frequency,
          location: null,
        ),
      );
    }
  }
  for (final bill in state.bills) {
    if (bill.dueDate == date.day) {
      items.add(
        _CalendarItem(
          title: '${bill.name} - \$${bill.amount.toStringAsFixed(2)}',
          start: date,
          type: _CalendarItemType.bill,
          isCompleted: bill.isPaid,
          category: 'financial',
          location: null,
        ),
      );
    }
  }
  for (final mood in state.moodEntries) {
    final entryDate = mood.entryDate;
    if (entryDate != null && DateUtils.isSameDay(entryDate, date)) {
      const moodEmojis = ['😢', '😐', '😊', '😃', '🤩'];
      final moodIndex = mood.mood < 1
          ? 0
          : mood.mood > moodEmojis.length
              ? moodEmojis.length - 1
              : mood.mood - 1;
      items.add(
        _CalendarItem(
          title: 'Mood: ${moodEmojis[moodIndex]}',
          start: mood.entryDate!,
          type: _CalendarItemType.mood,
          isCompleted: true,
          category: 'wellness',
          location: null,
        ),
      );
    }
  }
  items.sort((a, b) => a.start.compareTo(b.start));
  return items;
}

bool _calendarEventOccursOnDate(
  CalendarEventModel event,
  DateTime date,
) {
  final day = calendarDateOnly(date);
  final start = calendarDateOnly(event.startDate);
  final recurrenceMatch = _calendarEventRecursOnDate(event, start, day);
  if (recurrenceMatch != null) return recurrenceMatch;

  if (!event.allDay) return DateUtils.isSameDay(event.startDate, date);

  final storedEnd = event.endDate == null
      ? start
      : calendarDateOnly(event.endDate!);
  final end = storedEnd.isBefore(start) ? start : storedEnd;
  return !day.isBefore(start) && !day.isAfter(end);
}

bool? _calendarEventRecursOnDate(
  CalendarEventModel event,
  DateTime start,
  DateTime day,
) {
  if (!event.isRecurring) return null;
  final rule = event.recurrenceRule?.trim().toLowerCase();
  if (rule == null || rule.isEmpty) return null;
  if (day.isBefore(start)) return false;

  final startUtc = DateTime.utc(start.year, start.month, start.day);
  final dayUtc = DateTime.utc(day.year, day.month, day.day);
  final daysSinceStart = dayUtc.difference(startUtc).inDays;
  switch (rule) {
    case 'daily':
      return true;
    case 'weekly':
      return daysSinceStart % 7 == 0;
    case 'monthly':
      return day.day == start.day;
    case 'yearly':
      return day.month == start.month && day.day == start.day;
    default:
      return null;
  }
}

String _headerLabel(CalendarState state) {
  final date = state.selectedDate;
  if (state.view == CalendarView.month) {
    return '${_monthName(date.month)} ${date.year}';
  }
  if (state.view == CalendarView.day) return _formatLongDate(date);
  final start = date.subtract(Duration(days: date.weekday % 7));
  final end = start.add(const Duration(days: 6));
  return '${_formatMonthDay(start)} - ${_formatMonthDay(end)}, ${end.year}';
}

String _viewLabel(CalendarView view) {
  switch (view) {
    case CalendarView.month:
      return 'Month';
    case CalendarView.week:
      return 'Week';
    case CalendarView.day:
      return 'Day';
  }
}

String _appointmentStatus(AppointmentModel appointment) {
  if (appointment.isCompleted) return 'completed';
  if (appointment.appointmentDate.isBefore(DateTime.now())) return 'missed';
  if (appointment.appointmentDate.difference(DateTime.now()).inHours <= 24) {
    return 'upcoming';
  }
  return 'scheduled';
}

String _relativeDay(DateTime date) {
  final today = DateTime.now();
  final day = DateTime(date.year, date.month, date.day);
  final current = DateTime(today.year, today.month, today.day);
  final difference = day.difference(current).inDays;
  if (difference == 0) return 'Today';
  if (difference == 1) return 'Tomorrow';
  if (difference == -1) return 'Yesterday';
  if (difference > 1) return 'In $difference days';
  return '${difference.abs()} days ago';
}

String _formatLongDate(DateTime date) =>
    '${_formatWeekday(date)}, ${_monthName(date.month)} ${date.day}, ${date.year}';

String _formatWeekday(DateTime date) {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[date.weekday % 7];
}

String _formatMonthDay(DateTime date) =>
    '${_monthName(date.month).substring(0, 3)} ${date.day}';

String _monthName(int month) {
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
  return names[month - 1];
}

String _formatTime(BuildContext context, DateTime date) =>
    MaterialLocalizations.of(context).formatTimeOfDay(TimeOfDay.fromDateTime(date));

String _formatTimeStatic(DateTime date) {
  final hour = date.hour == 0 ? 12 : date.hour > 12 ? date.hour - 12 : date.hour;
  final minute = date.minute.toString().padLeft(2, '0');
  final suffix = date.hour >= 12 ? 'PM' : 'AM';
  return '$hour:$minute $suffix';
}

String _capitalize(String value) =>
    value.isEmpty ? value : '${value[0].toUpperCase()}${value.substring(1)}';

bool _hasText(String? value) => value != null && value.trim().isNotEmpty;

Future<void> _showAppointmentDialog(BuildContext context) async {
  final input = await showDialog<AppointmentInput>(
    context: context,
    builder: (_) => const _AppointmentFormDialog(),
  );
  if (input != null && context.mounted) {
    context.read<CalendarBloc>().add(AddAppointment(input));
  }
}

Future<void> _showCalendarEventDialog(
  BuildContext context, [
  int? eventId,
  DateTime? initialDate,
]) async {
  final state = context.read<CalendarBloc>().state;
  CalendarEventModel? existing;
  if (eventId != null) {
    for (final event in state.calendarEvents) {
      if (event.id == eventId) {
        existing = event;
        break;
      }
    }
  }
  if (eventId != null && existing == null) return;
  final input = await showDialog<CalendarEventInput>(
    context: context,
    builder: (_) => _CalendarEventFormDialog(
      existing: existing,
      initialDate: initialDate,
    ),
  );
  if (!context.mounted || input == null) return;
  if (eventId == null) {
    context.read<CalendarBloc>().add(AddCalendarEvent(input));
  } else {
    context.read<CalendarBloc>().add(EditCalendarEvent(id: eventId, input: input));
  }
}

Future<void> _confirmDeleteEvent(BuildContext context, int eventId) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Delete event?'),
      content: const Text('This calendar event will be permanently removed.'),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(true),
          style: FilledButton.styleFrom(backgroundColor: const Color(0xFFB91C1C)),
          child: const Text('Delete'),
        ),
      ],
    ),
  );
  if (confirmed == true && context.mounted) {
    context.read<CalendarBloc>().add(DeleteCalendarEvent(eventId));
  }
}

class _AppointmentFormDialog extends StatefulWidget {
  const _AppointmentFormDialog();

  @override
  State<_AppointmentFormDialog> createState() => _AppointmentFormDialogState();
}

class _AppointmentFormDialogState extends State<_AppointmentFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _locationController;
  late final TextEditingController _descriptionController;
  String? _provider;
  DateTime _date = DateTime.now().add(const Duration(hours: 1));

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _locationController = TextEditingController();
    _descriptionController = TextEditingController();
    _date = DateTime(
      _date.year,
      _date.month,
      _date.day,
      _date.hour + 1,
      (_date.minute ~/ 5) * 5,
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _locationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Schedule New Appointment'),
      content: SizedBox(
        width: AppResponsive.dialogWidth(context),
        height: AppResponsive.dialogMaxHeight(context, fraction: .78),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: _titleController,
                  decoration: const InputDecoration(
                    labelText: 'Appointment Title',
                    hintText: 'Doctor visit, dentist checkup...',
                  ),
                  validator: (value) => !_hasText(value) ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _provider,
                  decoration: const InputDecoration(labelText: 'Provider Type'),
                  items: const [
                    DropdownMenuItem(value: 'doctor', child: Text('Doctor')),
                    DropdownMenuItem(value: 'dentist', child: Text('Dentist')),
                    DropdownMenuItem(value: 'therapist', child: Text('Therapist')),
                    DropdownMenuItem(value: 'specialist', child: Text('Specialist')),
                    DropdownMenuItem(value: 'counselor', child: Text('Counselor')),
                    DropdownMenuItem(value: 'other', child: Text('Other')),
                  ],
                  onChanged: (value) => setState(() => _provider = value),
                ),
                const SizedBox(height: 12),
                _DateTimeField(
                  label: 'Date & Time',
                  value: _formatLongDate(_date) +
                      ' • ' +
                      _formatTime(context, _date),
                  onTap: _pickDateTime,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _locationController,
                  decoration: const InputDecoration(
                    labelText: 'Location',
                    hintText: 'Clinic name, address...',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _descriptionController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Notes (Optional)',
                    hintText: 'Any additional notes...',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _save,
          style: FilledButton.styleFrom(backgroundColor: const Color(0xFF9333EA)),
          child: const Text('Schedule Appointment'),
        ),
      ],
    );
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (!mounted || date == null) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_date),
    );
    if (!mounted || time == null) return;
    setState(
      () => _date = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      ),
    );
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.of(context).pop(
      AppointmentInput(
        title: _titleController.text,
        appointmentDate: _date,
        provider: _provider,
        location: _locationController.text,
        description: _descriptionController.text,
      ),
    );
  }
}

class _CalendarEventFormDialog extends StatefulWidget {
  const _CalendarEventFormDialog({
    this.existing,
    this.initialDate,
  });

  final CalendarEventModel? existing;
  final DateTime? initialDate;

  @override
  State<_CalendarEventFormDialog> createState() =>
      _CalendarEventFormDialogState();
}

class _CalendarEventFormDialogState extends State<_CalendarEventFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _locationController;
  late DateTime _startDate;
  DateTime? _endDate;
  String _category = 'personal';
  bool _allDay = false;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _titleController = TextEditingController(text: existing?.title);
    _descriptionController = TextEditingController(text: existing?.description);
    _locationController = TextEditingController(text: existing?.location);
    _startDate = existing?.startDate ??
        widget.initialDate?.toLocal() ??
        DateTime.now();
    _endDate = existing?.endDate;
    _category = existing?.category ?? 'personal';
    _allDay = existing?.allDay ?? false;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existing != null;
    return AlertDialog(
      title: Text(isEditing ? 'Edit Event' : 'Add New Event'),
      content: SizedBox(
        width: AppResponsive.dialogWidth(context),
        height: AppResponsive.dialogMaxHeight(context, fraction: .78),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: _titleController,
                  decoration: const InputDecoration(labelText: 'Event title'),
                  validator: (value) => !_hasText(value) ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _descriptionController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Description (optional)',
                  ),
                ),
                const SizedBox(height: 12),
                _DateTimeField(
                  label: 'Start date and time',
                  value: _allDay
                      ? _formatLongDate(_startDate)
                      : '${_formatLongDate(_startDate)} • '
                          '${_formatTime(context, _startDate)}',
                  onTap: _pickDateTime,
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('All day event'),
                  value: _allDay,
                  onChanged: (value) => setState(() => _allDay = value),
                ),
                if (_allDay)
                  _DateTimeField(
                    label: 'End date (optional)',
                    value: _endDate == null
                        ? 'Same day'
                        : _formatLongDate(_endDate!),
                    onTap: _pickEndDate,
                  ),
                DropdownButtonFormField<String>(
                  value: _category,
                  decoration: const InputDecoration(labelText: 'Category'),
                  items: const [
                    DropdownMenuItem(value: 'personal', child: Text('Personal')),
                    DropdownMenuItem(value: 'work', child: Text('Work')),
                    DropdownMenuItem(value: 'health', child: Text('Health')),
                    DropdownMenuItem(value: 'social', child: Text('Social')),
                    DropdownMenuItem(
                      value: 'education',
                      child: Text('Education'),
                    ),
                  ],
                  onChanged: (value) {
                    if (value != null) setState(() => _category = value);
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _locationController,
                  decoration: const InputDecoration(
                    labelText: 'Location (optional)',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _save,
          child: Text(isEditing ? 'Save Changes' : 'Create Event'),
        ),
      ],
    );
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (!mounted || date == null) return;
    if (_allDay) {
      final nextStart = DateTime(date.year, date.month, date.day);
      setState(() {
        _startDate = nextStart;
        if (_endDate != null && _endDate!.isBefore(nextStart)) {
          _endDate = nextStart;
        }
      });
      return;
    }
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_startDate),
    );
    if (!mounted || time == null) return;
    setState(
      () => _startDate = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      ),
    );
  }

  Future<void> _pickEndDate() async {
    final firstDate = calendarDateOnly(_startDate);
    final currentEnd = _endDate;
    final initialDate = currentEnd != null && !currentEnd.isBefore(firstDate)
        ? calendarDateOnly(currentEnd)
        : firstDate;
    final date = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: DateTime(2100),
    );
    if (!mounted || date == null) return;
    setState(() => _endDate = calendarDateOnly(date));
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.of(context).pop(
      CalendarEventInput(
        title: _titleController.text,
        description: _descriptionController.text,
        startDate: _allDay
            ? DateTime(_startDate.year, _startDate.month, _startDate.day)
            : _startDate,
        endDate: _endDate == null
            ? null
            : _allDay
                ? calendarDateOnly(_endDate!)
                : _endDate,
        allDay: _allDay,
        category: _category,
        location: _locationController.text,
      ),
    );
  }
}

class _DateTimeField extends StatelessWidget {
  const _DateTimeField({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.calendar_today_outlined),
        ),
        child: Text(value),
      ),
    );
  }
}