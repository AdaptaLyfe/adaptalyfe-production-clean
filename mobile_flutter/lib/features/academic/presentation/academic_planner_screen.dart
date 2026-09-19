import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../core/layout/responsive.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/bloc/auth_state.dart';
import '../bloc/academic_bloc.dart';
import '../bloc/academic_event.dart';
import '../bloc/academic_state.dart';
import '../models/academic_models.dart';

class AcademicPlannerScreen extends StatelessWidget {
  const AcademicPlannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AcademicBloc, AcademicState>(
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
              backgroundColor: state.errorMessage == null
                  ? null
                  : const Color(0xFFB91C1C),
            ),
          );
      },
      builder: (context, state) {
        if (!_hasAcademicAccess(context)) {
          return const _AcademicPremiumPrompt();
        }
        if (state.status == AcademicStatus.initial ||
            (state.isLoading && !state.hasData)) {
          return const Scaffold(
            appBar: _AcademicAppBar(),
            body: _AcademicLoading(),
          );
        }
        if (state.status == AcademicStatus.failure && !state.hasData) {
          return Scaffold(
            appBar: const _AcademicAppBar(),
            body: _AcademicError(
              message: state.errorMessage ??
                  'Unable to load your academic planner.',
              onRetry: () =>
                  context.read<AcademicBloc>().add(const RefreshAcademic()),
            ),
          );
        }

        return DefaultTabController(
          length: 5,
          child: Scaffold(
            appBar: AppBar(
              title: const Text('Academic Planner'),
              actions: [
                IconButton(
                  tooltip: 'Refresh academic planner',
                  onPressed: state.action == AcademicAction.none
                      ? () => context
                          .read<AcademicBloc>()
                          .add(const RefreshAcademic())
                      : null,
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
            ),
            body: Column(
              children: [
                if (state.isLoading) const LinearProgressIndicator(minHeight: 2),
                const _AcademicHeader(),
                const TabBar(
                  tabs: [
                    Tab(
                      icon: Icon(Icons.today_outlined),
                      text: 'Schedule',
                    ),
                    Tab(
                      icon: Icon(Icons.assignment_outlined),
                      text: 'Assignments',
                    ),
                    Tab(
                      icon: Icon(Icons.timer_outlined),
                      text: 'Study',
                    ),
                    Tab(
                      icon: Icon(Icons.map_outlined),
                      text: 'Campus',
                    ),
                    Tab(
                      icon: Icon(Icons.groups_outlined),
                      text: 'Study Groups',
                    ),
                  ],
                ),
                Expanded(
                  child: TabBarView(
                    children: [
                      _ScheduleTab(state: state),
                      _AssignmentsTab(state: state),
                      _StudyTab(state: state),
                      _CampusTab(state: state),
                      _StudyGroupsTab(state: state),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

bool _hasAcademicAccess(BuildContext context) {
  final authState = context.read<AuthBloc>().state;
  if (authState is! Authenticated) return false;
  final user = authState.user;
  final isAdmin = user.accountType == 'admin' || user.username == 'admin';
  if (isAdmin) return true;
  final tier = user.subscriptionTier?.toLowerCase();
  final status = user.subscriptionStatus?.toLowerCase();
  return status == 'active' &&
          (tier == 'premium' || tier == 'family') ||
      status == 'trialing';
}

class _AcademicPremiumPrompt extends StatelessWidget {
  const _AcademicPremiumPrompt();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Academic Planner')),
      body: Center(
        child: SingleChildScrollView(
          padding: AppResponsive.pagePadding(context),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.workspace_premium_outlined,
                    size: 52,
                    color: Color(0xFFF97316),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Academic Planner',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Manage classes, assignments, study sessions, and campus navigation with a premium plan.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF6B7280)),
                  ),
                  const SizedBox(height: 18),
                  FilledButton(
                    onPressed: () => context.go('/subscription'),
                    child: const Text('View Premium Plans'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AcademicAppBar extends StatelessWidget
    implements PreferredSizeWidget {
  const _AcademicAppBar();

  @override
  Widget build(BuildContext context) =>
      AppBar(title: const Text('Academic Planner'));

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _AcademicHeader extends StatelessWidget {
  const _AcademicHeader();

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AcademicBloc>().state;
    final now = DateTime.now();
    final todayClasses = state.classes
        .where((item) => item.isActive && item.dayOfWeek == now.weekday % 7)
        .length;
    final dueThisWeek = state.assignments
        .where((item) => item.dueDate.isAfter(now) && !item.isCompleted)
        .toList()
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));
    final completed =
        state.assignments.where((item) => item.isCompleted).length;
    final studyHours = state.studySessions.fold<int>(
          0,
          (total, item) => total + item.duration,
        ) /
        60;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Academic Planner',
            style: TextStyle(
              color: Color(0xFF111827),
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Manage your classes, assignments, study sessions, and campus navigation',
            style: TextStyle(color: Color(0xFF4B5563), fontSize: 13),
          ),
          const SizedBox(height: 14),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _SummaryCard(
                  icon: Icons.menu_book_rounded,
                  label: "Today's Classes",
                  value: '$todayClasses',
                  color: const Color(0xFF2563EB),
                ),
                const SizedBox(width: 8),
                _SummaryCard(
                  icon: Icons.schedule_rounded,
                  label: 'Due This Week',
                  value: '${dueThisWeek.take(5).length}',
                  color: const Color(0xFFF97316),
                ),
                const SizedBox(width: 8),
                _SummaryCard(
                  icon: Icons.check_circle_outline_rounded,
                  label: 'Assignment Progress',
                  value: '$completed/${state.assignments.length}',
                  color: const Color(0xFF16A34A),
                ),
                const SizedBox(width: 8),
                _SummaryCard(
                  icon: Icons.hourglass_bottom_rounded,
                  label: 'Study Hours',
                  value: _formatNumber(studyHours),
                  color: const Color(0xFF9333EA),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 124,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(
            label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _ScheduleTab extends StatelessWidget {
  const _ScheduleTab({required this.state});

  final AcademicState state;

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now().weekday % 7;
    final todayClasses = state.classes
        .where((item) => item.isActive && item.dayOfWeek == today)
        .toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));
    final upcoming = state.assignments
        .where((item) => item.dueDate.isAfter(DateTime.now()) && !item.isCompleted)
        .toList()
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));

    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
       padding: AppResponsive.pagePadding(context).add(
         const EdgeInsets.only(top: 16, bottom: 32),
       ),
        children: [
          _SectionHeader(
            icon: Icons.calendar_today_outlined,
            title: "Today's Schedule",
            actionLabel: 'Add Class',
            onAction: () => _showClassDialog(context),
          ),
          const SizedBox(height: 10),
          if (todayClasses.isEmpty)
            const _EmptyCard(
              icon: Icons.calendar_month_outlined,
              title: 'No classes scheduled for today',
              subtitle: 'Add a class to start building your schedule.',
            )
          else
            ...todayClasses.map((item) => _ClassCard(item: item)),
          const SizedBox(height: 22),
          _SectionHeader(
            icon: Icons.assignment_outlined,
            title: 'Academic Tasks',
            actionLabel: 'Add Assignment',
            onAction: () => _showAssignmentDialog(context),
          ),
          const SizedBox(height: 10),
          if (upcoming.isEmpty)
            const _EmptyCard(
              icon: Icons.check_circle_outline_rounded,
              title: 'No upcoming academic tasks',
              subtitle: 'Add an assignment to track its deadline.',
            )
          else
            ...upcoming
                .take(5)
                .map((item) => _AssignmentCard(item: item)),
        ],
      ),
    );
  }
}

class _ClassesTab extends StatelessWidget {
  const _ClassesTab({required this.state});

  final AcademicState state;

  @override
  Widget build(BuildContext context) {
    final classes = [...state.classes]
      ..sort((a, b) {
        final semester = a.semester.compareTo(b.semester);
        if (semester != 0) return semester;
        return a.dayOfWeek == b.dayOfWeek
            ? a.startTime.compareTo(b.startTime)
            : a.dayOfWeek.compareTo(b.dayOfWeek);
      });

    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
       padding: AppResponsive.pagePadding(context).add(
         const EdgeInsets.only(top: 16, bottom: 32),
       ),
        children: [
          _SectionHeader(
            icon: Icons.school_outlined,
            title: 'Your Classes',
            actionLabel: 'Add Class',
            onAction: () => _showClassDialog(context),
          ),
          const SizedBox(height: 8),
          const _ApiCapabilityNotice(
            text:
                'Classes can be viewed and added here. The current backend does not expose edit or delete endpoints.',
          ),
          const SizedBox(height: 12),
          if (classes.isEmpty)
            const _EmptyCard(
              icon: Icons.school_outlined,
              title: 'No classes yet',
              subtitle: 'Add your first class to build your academic schedule.',
            )
          else
            ...classes.map((item) => _ClassCard(item: item)),
        ],
      ),
    );
  }
}

class _AssignmentsTab extends StatelessWidget {
  const _AssignmentsTab({required this.state});

  final AcademicState state;

  @override
  Widget build(BuildContext context) {
    final filtered = state.assignments
        .where((item) => _matchesFilter(item, state.assignmentFilter))
        .toList()
      ..sort((a, b) => a.dueDate.compareTo(b.dueDate));

    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
       padding: AppResponsive.pagePadding(context).add(
         const EdgeInsets.only(top: 16, bottom: 32),
       ),
        children: [
          _SectionHeader(
            icon: Icons.assignment_outlined,
            title: 'Assignments',
            actionLabel: 'Add Assignment',
            onAction: () => _showAssignmentDialog(context),
          ),
          const SizedBox(height: 8),
          const _ApiCapabilityNotice(
            text:
                'Assignment status and deadlines are shown from the existing API. The current backend does not expose edit, delete, or status-update endpoints.',
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: AcademicAssignmentFilter.values.map((filter) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(_filterLabel(filter)),
                    selected: state.assignmentFilter == filter,
                    onSelected: (_) => context
                        .read<AcademicBloc>()
                        .add(SetAssignmentFilter(filter)),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),
          if (filtered.isEmpty)
            _EmptyCard(
              icon: Icons.assignment_turned_in_outlined,
              title: state.assignments.isEmpty
                  ? 'No assignments yet'
                  : 'No assignments match this filter',
              subtitle: state.assignments.isEmpty
                  ? 'Add an assignment to start tracking your deadlines.'
                  : 'Try another status or deadline filter.',
            )
          else
            ...filtered.map((item) => _AssignmentCard(item: item)),
        ],
      ),
    );
  }
}

class _StudyTab extends StatelessWidget {
  const _StudyTab({required this.state});

  final AcademicState state;

  @override
  Widget build(BuildContext context) {
    final sessions = [...state.studySessions]
      ..sort((a, b) => (b.startedAt ?? DateTime(0))
          .compareTo(a.startedAt ?? DateTime(0)));

    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: AppResponsive.pagePadding(context).add(
          const EdgeInsets.only(top: 16, bottom: 32),
        ),
        children: [
          _SectionHeader(
            icon: Icons.timer_outlined,
            title: 'Study Tracker',
            actionLabel: 'Start Session',
            onAction: () => _showStudySessionDialog(context),
          ),
          const SizedBox(height: 8),
          const Text(
            'Track your study sessions and techniques.',
            style: TextStyle(color: Color(0xFF6B7280)),
          ),
          const SizedBox(height: 12),
          if (sessions.isEmpty)
            const _EmptyCard(
              icon: Icons.timer_outlined,
              title: 'No study sessions yet',
              subtitle: 'Start a session to track your focus time.',
            )
          else
            ...sessions.take(5).map(
                  (session) => _StudySessionCard(session: session),
                ),
        ],
      ),
    );
  }
}

class _StudySessionCard extends StatelessWidget {
  const _StudySessionCard({required this.session});

  final StudySessionModel session;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const CircleAvatar(
              backgroundColor: Color(0xFFF3E8FF),
              foregroundColor: Color(0xFF9333EA),
              child: Icon(Icons.timer_outlined),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    session.subject,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 5),
                  Wrap(
                    spacing: 7,
                    runSpacing: 5,
                    children: [
                      _Badge(
                        label: '${session.duration} minutes',
                        color: const Color(0xFF7C3AED),
                      ),
                      _Badge(
                        label: session.isCompleted ? 'Completed' : 'In Progress',
                        color: session.isCompleted
                            ? const Color(0xFF16A34A)
                            : const Color(0xFF2563EB),
                      ),
                    ],
                  ),
                  if (_hasText(session.technique) ||
                      _hasText(session.location) ||
                      session.startedAt != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        [
                          if (_hasText(session.technique))
                            _titleCase(session.technique!),
                          if (_hasText(session.location)) session.location!,
                          if (session.startedAt != null)
                            _fullDate(session.startedAt!.toLocal()),
                        ].join(' • '),
                        style: const TextStyle(
                          color: Color(0xFF6B7280),
                          fontSize: 12,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (!session.isCompleted)
              TextButton(
                onPressed: () => context.read<AcademicBloc>().add(
                      CompleteStudySession(sessionId: session.id),
                    ),
                child: const Text('Complete'),
              ),
          ],
        ),
      ),
    );
  }
}

class _CampusTab extends StatelessWidget {
  const _CampusTab({required this.state});

  final AcademicState state;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: AppResponsive.pagePadding(context).add(
          const EdgeInsets.only(top: 16, bottom: 32),
        ),
        children: [
          _SectionHeader(
            icon: Icons.location_on_outlined,
            title: 'Campus Locations',
            actionLabel: 'Add Location',
            onAction: () => _showCampusLocationDialog(context),
          ),
          const SizedBox(height: 8),
          if (state.campusLocations.isEmpty)
            const _EmptyCard(
              icon: Icons.location_on_outlined,
              title: 'No campus locations saved',
              subtitle: 'Save important places for quick reference.',
            )
          else
            ...state.campusLocations.map(
              (location) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFDBEAFE),
                    foregroundColor: Color(0xFF2563EB),
                    child: Icon(Icons.location_on_outlined),
                  ),
                  title: Text(
                    location.name,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    [
                      if (_hasText(location.building)) location.building!,
                      if (_hasText(location.floor)) 'Floor ${location.floor}',
                      if (_hasText(location.description))
                        location.description!,
                    ].join(' • '),
                  ),
                  trailing: _Badge(
                    label: _titleCase(location.category),
                    color: const Color(0xFF2563EB),
                  ),
                ),
              ),
            ),
          const SizedBox(height: 20),
          _SectionHeader(
            icon: Icons.directions_bus_outlined,
            title: 'Campus Transportation',
            actionLabel: 'Add Route',
            onAction: () => _showCampusTransportDialog(context),
          ),
          const SizedBox(height: 8),
          if (state.campusTransport.isEmpty)
            const _EmptyCard(
              icon: Icons.directions_bus_outlined,
              title: 'No campus routes saved',
              subtitle: 'Add a route to keep transportation details handy.',
            )
          else
            ...state.campusTransport.map(
              (route) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFE0F2FE),
                    foregroundColor: Color(0xFF0369A1),
                    child: Icon(Icons.directions_bus_outlined),
                  ),
                  title: Text(
                    route.routeName,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    [
                      '${route.fromStop}${_hasText(route.toStop) ? ' → ${route.toStop}' : ''}',
                      if (_hasText(route.departureTime))
                        'Departs ${route.departureTime}',
                    ].join(' • '),
                  ),
                  trailing: route.estimatedDuration == null
                      ? null
                      : Text('${route.estimatedDuration} min'),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _StudyGroupsTab extends StatelessWidget {
  const _StudyGroupsTab({required this.state});

  final AcademicState state;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => _refresh(context),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: AppResponsive.pagePadding(context).add(
          const EdgeInsets.only(top: 16, bottom: 32),
        ),
        children: [
          _SectionHeader(
            icon: Icons.groups_outlined,
            title: 'Study Groups',
            actionLabel: 'Create Group',
            onAction: () => _showStudyGroupDialog(context),
          ),
          const SizedBox(height: 8),
          const Text(
            'Plan collaborative study time with classmates.',
            style: TextStyle(color: Color(0xFF6B7280)),
          ),
          const SizedBox(height: 12),
          if (state.studyGroups.isEmpty)
            const _EmptyCard(
              icon: Icons.groups_outlined,
              title: 'No study groups yet',
              subtitle: 'Create a group to keep shared study plans in one place.',
            )
          else
            ...state.studyGroups.map(
              (group) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFEDE9FE),
                    foregroundColor: Color(0xFF7C3AED),
                    child: Icon(Icons.groups_outlined),
                  ),
                  title: Text(
                    group.groupName,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    [
                      if (group.topics.isNotEmpty) group.topics.first,
                      if (group.location != null) group.location!,
                      if (group.meetingTime != null)
                        _fullDate(group.meetingTime!.toLocal()),
                      if (group.isRecurring && group.recurringPattern != null)
                        group.recurringPattern!,
                    ].join(' • '),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.icon,
    required this.title,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String title;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => constraints.maxWidth < 430
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(children: [
                  Icon(icon, color: const Color(0xFF2563EB), size: 22),
                  const SizedBox(width: 8),
                  Expanded(child: Text(title, style: const TextStyle(
                    fontSize: 19, fontWeight: FontWeight.w700,
                  ))),
                ]),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: onAction,
                  icon: const Icon(Icons.add, size: 17),
                  label: Text(actionLabel),
                ),
              ],
            )
          : Row(
      children: [
        Icon(icon, color: const Color(0xFF2563EB), size: 22),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
          ),
        ),
        OutlinedButton.icon(
          onPressed: onAction,
          icon: const Icon(Icons.add, size: 17),
          label: Text(actionLabel),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            visualDensity: VisualDensity.compact,
          ),
        ),
      ],
    ),
    );
  }
}

class _ClassCard extends StatelessWidget {
  const _ClassCard({required this.item});

  final AcademicClassModel item;

  @override
  Widget build(BuildContext context) {
    final location = [
      if (_hasText(item.building)) item.building!,
      if (_hasText(item.room)) 'Room ${item.room}',
    ].join(' · ');

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(13),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 10,
              height: 54,
              decoration: BoxDecoration(
                color: item.isActive
                    ? const Color(0xFF2563EB)
                    : const Color(0xFF9CA3AF),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.className,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_dayName(item.dayOfWeek)} · ${_formatTime(item.startTime)} - ${_formatTime(item.endTime)}',
                    style: const TextStyle(
                      color: Color(0xFF374151),
                      fontSize: 13,
                    ),
                  ),
                  if (_hasText(item.instructor))
                    Text(
                      item.instructor!,
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 13,
                      ),
                    ),
                  if (location.isNotEmpty)
                    Text(
                      location,
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 13,
                      ),
                    ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _Badge(
                  label: item.isActive ? 'Active' : 'Inactive',
                  color: item.isActive
                      ? const Color(0xFF16A34A)
                      : const Color(0xFF6B7280),
                ),
                const SizedBox(height: 5),
                Text(
                  '${item.credits ?? 0} credits',
                  style: const TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 12,
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

class _AssignmentCard extends StatelessWidget {
  const _AssignmentCard({required this.item});

  final AssignmentModel item;

  @override
  Widget build(BuildContext context) {
    final isOverdue =
        item.dueDate.isBefore(DateTime.now()) && !item.isCompleted;
    final color = _priorityColor(item.priority);

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(13),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 10,
              height: 58,
              decoration: BoxDecoration(
                color: item.isCompleted
                    ? const Color(0xFF16A34A)
                    : isOverdue
                        ? const Color(0xFFDC2626)
                        : color,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      decoration: item.isCompleted
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 7,
                    runSpacing: 5,
                    children: [
                      _Badge(label: _titleCase(item.type), color: color),
                      _Badge(
                        label: _statusLabel(item.status),
                        color: item.isCompleted
                            ? const Color(0xFF16A34A)
                            : const Color(0xFF2563EB),
                      ),
                    ],
                  ),
                  if (_hasText(item.description))
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        item.description!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF4B5563),
                          fontSize: 13,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _Badge(
                  label: isOverdue
                      ? 'Overdue'
                      : _relativeDueDate(item.dueDate),
                  color: isOverdue
                      ? const Color(0xFFDC2626)
                      : const Color(0xFF2563EB),
                ),
                const SizedBox(height: 5),
                if (item.estimatedHours != null)
                  Text(
                    '${item.estimatedHours}h estimated',
                    style: const TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 12,
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

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(.12),
        borderRadius: BorderRadius.circular(12),
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

class _ApiCapabilityNotice extends StatelessWidget {
  const _ApiCapabilityNotice({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.info_outline_rounded,
            color: Color(0xFFB45309),
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Color(0xFF92400E),
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
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
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),
        child: Column(
          children: [
            Icon(icon, size: 48, color: const Color(0xFF9CA3AF)),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF374151),
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> _showStudySessionDialog(BuildContext context) async {
  final academicBloc = context.read<AcademicBloc>();
  final subjectController = TextEditingController();
  final topicController = TextEditingController();
  final notesController = TextEditingController();
  final durationController = TextEditingController(text: '60');
  final formKey = GlobalKey<FormState>();
  var technique = _studyTechniques.first;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: const Text('Start New Study Session'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: subjectController,
                  decoration: const InputDecoration(labelText: 'Subject'),
                  validator: _requiredField('Subject is required'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: topicController,
                  decoration: const InputDecoration(labelText: 'Topic'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: technique,
                  decoration: const InputDecoration(labelText: 'Technique'),
                  items: _studyTechniques
                      .map(
                        (value) => DropdownMenuItem(
                          value: value,
                          child: Text(_titleCase(value)),
                        ),
                      )
                      .toList(),
                  onChanged: (value) =>
                      setState(() => technique = value ?? technique),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: durationController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Duration (minutes)',
                  ),
                  validator: (value) {
                    final duration = int.tryParse(value?.trim() ?? '');
                    if (duration == null || duration < 5 || duration > 300) {
                      return 'Enter a duration from 5 to 300 minutes';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: notesController,
                  minLines: 2,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Notes'),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (!formKey.currentState!.validate()) return;
              academicBloc.add(
                AddStudySession(
                  StudySessionInput(
                    subject: subjectController.text,
                    topic: topicController.text,
                    duration: int.parse(durationController.text.trim()),
                    technique: technique,
                    notes: notesController.text,
                  ),
                ),
              );
              Navigator.of(dialogContext).pop();
            },
            child: const Text('Start Session'),
          ),
        ],
      ),
    ),
  );

  subjectController.dispose();
  topicController.dispose();
  notesController.dispose();
  durationController.dispose();
}

Future<void> _showCampusLocationDialog(BuildContext context) async {
  final academicBloc = context.read<AcademicBloc>();
  final nameController = TextEditingController();
  final buildingController = TextEditingController();
  final floorController = TextEditingController();
  final descriptionController = TextEditingController();
  final formKey = GlobalKey<FormState>();
  var category = _campusLocationCategories.first;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: const Text('Add Campus Location'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Name'),
                  validator: _requiredField('Name is required'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: buildingController,
                  decoration: const InputDecoration(labelText: 'Building'),
                  validator: _requiredField('Building is required'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: floorController,
                  decoration: const InputDecoration(labelText: 'Floor'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: category,
                  decoration: const InputDecoration(labelText: 'Category'),
                  items: _campusLocationCategories
                      .map(
                        (value) => DropdownMenuItem(
                          value: value,
                          child: Text(_titleCase(value)),
                        ),
                      )
                      .toList(),
                  onChanged: (value) =>
                      setState(() => category = value ?? category),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: descriptionController,
                  minLines: 2,
                  maxLines: 3,
                  decoration:
                      const InputDecoration(labelText: 'Description'),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (!formKey.currentState!.validate()) return;
              academicBloc.add(
                AddCampusLocation(
                  CampusLocationInput(
                    name: nameController.text,
                    building: buildingController.text,
                    floor: floorController.text,
                    description: descriptionController.text,
                    category: category,
                  ),
                ),
              );
              Navigator.of(dialogContext).pop();
            },
            child: const Text('Add Location'),
          ),
        ],
      ),
    ),
  );

  nameController.dispose();
  buildingController.dispose();
  floorController.dispose();
  descriptionController.dispose();
}

Future<void> _showCampusTransportDialog(BuildContext context) async {
  final academicBloc = context.read<AcademicBloc>();
  final routeController = TextEditingController();
  final fromController = TextEditingController();
  final toController = TextEditingController();
  final departureController = TextEditingController();
  final durationController = TextEditingController(text: '15');
  final formKey = GlobalKey<FormState>();

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: const Text('Add Campus Transportation'),
      content: Form(
        key: formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: routeController,
                decoration: const InputDecoration(labelText: 'Route name'),
                validator: _requiredField('Route name is required'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: fromController,
                decoration: const InputDecoration(labelText: 'From stop'),
                validator: _requiredField('From stop is required'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: toController,
                decoration: const InputDecoration(labelText: 'To stop'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: departureController,
                decoration: const InputDecoration(
                  labelText: 'Departure time',
                  hintText: 'e.g. 08:30',
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: durationController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Estimated duration (minutes)',
                ),
                validator: (value) {
                  final duration = int.tryParse(value?.trim() ?? '');
                  if (duration == null || duration < 5 || duration > 120) {
                    return 'Enter a duration from 5 to 120 minutes';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () {
            if (!formKey.currentState!.validate()) return;
            academicBloc.add(
              AddCampusTransport(
                CampusTransportInput(
                  routeName: routeController.text,
                  fromStop: fromController.text,
                  toStop: toController.text,
                  departureTime: departureController.text,
                  estimatedDuration: int.parse(durationController.text.trim()),
                ),
              ),
            );
            Navigator.of(dialogContext).pop();
          },
          child: const Text('Add Route'),
        ),
      ],
    ),
  );

  routeController.dispose();
  fromController.dispose();
  toController.dispose();
  departureController.dispose();
  durationController.dispose();
}

Future<void> _showStudyGroupDialog(BuildContext context) async {
  final academicBloc = context.read<AcademicBloc>();
  final groupNameController = TextEditingController();
  final subjectController = TextEditingController();
  final descriptionController = TextEditingController();
  final locationController = TextEditingController();
  final notesController = TextEditingController();
  final formKey = GlobalKey<FormState>();
  var meetingDay = 'Monday';
  var meetingTime = '';
  var isRecurring = false;
  var recurringPattern = 'weekly';

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: const Text('Create Study Group'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: groupNameController,
                  decoration: const InputDecoration(labelText: 'Group name'),
                  validator: (value) =>
                      value == null || value.trim().isEmpty
                          ? 'Group name is required'
                          : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: subjectController,
                  decoration: const InputDecoration(labelText: 'Subject'),
                  validator: _requiredField('Subject is required'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: descriptionController,
                  minLines: 2,
                  maxLines: 3,
                  decoration:
                      const InputDecoration(labelText: 'Description'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: locationController,
                  decoration: const InputDecoration(labelText: 'Location'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: meetingDay,
                        decoration:
                            const InputDecoration(labelText: 'Meeting day'),
                        items: _weekdays
                            .map(
                              (value) => DropdownMenuItem(
                                value: value,
                                child: Text(value),
                              ),
                            )
                            .toList(),
                        onChanged: (value) =>
                            setState(() => meetingDay = value ?? meetingDay),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        decoration: const InputDecoration(
                          labelText: 'Meeting time',
                          hintText: 'e.g. 16:00',
                        ),
                        onChanged: (value) => meetingTime = value,
                      ),
                    ),
                  ],
                ),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: isRecurring,
                  title: const Text('Recurring meeting'),
                  onChanged: (value) =>
                      setState(() => isRecurring = value ?? false),
                ),
                if (isRecurring)
                  DropdownButtonFormField<String>(
                    value: recurringPattern,
                    decoration:
                        const InputDecoration(labelText: 'Repeat pattern'),
                    items: const [
                      DropdownMenuItem(value: 'weekly', child: Text('Weekly')),
                      DropdownMenuItem(
                        value: 'biweekly',
                        child: Text('Every two weeks'),
                      ),
                    ],
                    onChanged: (value) =>
                        setState(() => recurringPattern = value ?? 'weekly'),
                  ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: notesController,
                  minLines: 2,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Notes'),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (!formKey.currentState!.validate()) return;
              academicBloc.add(
                AddStudyGroup(
                  StudyGroupInput(
                    groupName: groupNameController.text,
                     meetingTime: _meetingDateTime(meetingDay, meetingTime),
                    location: locationController.text,
                    isRecurring: isRecurring,
                    recurringPattern: isRecurring ? recurringPattern : null,
                    topics: [
                      if (_hasText(subjectController.text))
                        subjectController.text.trim(),
                    ],
                    notes: [
                      if (_hasText(descriptionController.text))
                        descriptionController.text.trim(),
                      if (_hasText(notesController.text))
                        notesController.text.trim(),
                    ].join('\n'),
                  ),
                ),
              );
              Navigator.of(dialogContext).pop();
            },
            child: const Text('Create Group'),
          ),
        ],
      ),
    ),
  );
  groupNameController.dispose();
  subjectController.dispose();
  descriptionController.dispose();
  locationController.dispose();
  notesController.dispose();
}

class _AcademicLoading extends StatelessWidget {
  const _AcademicLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(height: 120, color: const Color(0xFFE5E7EB)),
        const SizedBox(height: 16),
        Container(height: 38, color: const Color(0xFFE5E7EB)),
        const SizedBox(height: 12),
        ...List.generate(
          4,
          (index) => Container(
            height: 92,
            margin: const EdgeInsets.only(bottom: 12),
            color: const Color(0xFFE5E7EB),
          ),
        ),
      ],
    );
  }
}

class _AcademicError extends StatelessWidget {
  const _AcademicError({required this.message, required this.onRetry});

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
              'We could not load your academic planner.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF991B1B),
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(message, textAlign: TextAlign.center),
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

bool _classDialogOpen = false;

Future<void> _showClassDialog(BuildContext context) async {
  if (_classDialogOpen) return;
  _classDialogOpen = true;
  try {
    final bloc = context.read<AcademicBloc>();
    await showDialog<void>(
      context: context,
      builder: (_) => _AcademicClassDialog(bloc: bloc),
    );
  } finally {
    _classDialogOpen = false;
  }
}

class _AcademicClassDialog extends StatefulWidget {
  const _AcademicClassDialog({required this.bloc});

  final AcademicBloc bloc;

  @override
  State<_AcademicClassDialog> createState() => _AcademicClassDialogState();
}

class _AcademicClassDialogState extends State<_AcademicClassDialog> {
  late final TextEditingController _nameController;
  late final TextEditingController _instructorController;
  late final TextEditingController _buildingController;
  late final TextEditingController _roomController;
  late final TextEditingController _creditsController;
  late final TextEditingController _notesController;
  final _formKey = GlobalKey<FormState>();
  var _dayOfWeek = 1;
  var _startTime = '';
  var _endTime = '';
  var _semester = 'Fall 2025';

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _instructorController = TextEditingController();
    _buildingController = TextEditingController();
    _roomController = TextEditingController();
    _creditsController = TextEditingController(text: '3');
    _notesController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _instructorController.dispose();
    _buildingController.dispose();
    _roomController.dispose();
    _creditsController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    if (_startTime.compareTo(_endTime) >= 0) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(content: Text('End time must be after start time.')),
        );
      return;
    }

    final credits = int.tryParse(_creditsController.text.trim());
    if (credits == null) return;
    widget.bloc.add(
      AddAcademicClass(
        AcademicClassInput(
          className: _nameController.text,
          instructor: _instructorController.text,
          building: _buildingController.text,
          room: _roomController.text,
          startTime: _startTime,
          endTime: _endTime,
          dayOfWeek: _dayOfWeek,
          credits: credits.clamp(1, 6).toInt(),
          semester: _semester,
          notes: _notesController.text,
        ),
      ),
    );
  }

  Future<void> _pickStartTime() async {
    final picked = await _pickTime(context, _startTime);
    if (!mounted || picked == null) return;
    setState(() => _startTime = picked);
  }

  Future<void> _pickEndTime() async {
    final picked = await _pickTime(context, _endTime);
    if (!mounted || picked == null) return;
    setState(() => _endTime = picked);
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AcademicBloc, AcademicState>(
      bloc: widget.bloc,
      listenWhen: (previous, current) =>
          previous.action == AcademicAction.addingClass &&
          current.action == AcademicAction.none &&
          current.actionMessage == 'Class added successfully.',
      listener: (context, state) {
        Future<void>.delayed(const Duration(milliseconds: 350), () {
          if (!mounted) return;
          Navigator.of(context).pop();
        });
      },
      child: BlocBuilder<AcademicBloc, AcademicState>(
        bloc: widget.bloc,
        buildWhen: (previous, current) {
          if (previous.action == current.action) return false;
          if (current.action == AcademicAction.addingClass) return true;
          return current.action == AcademicAction.none &&
              current.errorMessage != null;
        },
        builder: (context, state) {
          final isSubmitting = state.action == AcademicAction.addingClass;
          return AlertDialog(
            title: const Text('Add New Class'),
            content: Form(
              key: _formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: _nameController,
                      enabled: !isSubmitting,
                      decoration:
                          const InputDecoration(labelText: 'Class name'),
                      validator: _requiredValidator,
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _instructorController,
                      enabled: !isSubmitting,
                      decoration:
                          const InputDecoration(labelText: 'Instructor'),
                      validator: _requiredValidator,
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _buildingController,
                            enabled: !isSubmitting,
                            decoration: const InputDecoration(
                              labelText: 'Building',
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            controller: _roomController,
                            enabled: !isSubmitting,
                            decoration:
                                const InputDecoration(labelText: 'Room'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: _TimeField(
                            label: 'Start time',
                            value: _startTime,
                            onTap: isSubmitting ? () {} : _pickStartTime,
                            validator: _requiredValidator,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _TimeField(
                            label: 'End time',
                            value: _endTime,
                            onTap: isSubmitting ? () {} : _pickEndTime,
                            validator: _requiredValidator,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<int>(
                      value: _dayOfWeek,
                      decoration: const InputDecoration(labelText: 'Day'),
                      items: List.generate(
                        5,
                        (index) => DropdownMenuItem(
                          value: index + 1,
                          child: Text(_dayName(index + 1)),
                        ),
                      ),
                      onChanged: isSubmitting
                          ? null
                          : (value) => setState(
                                () => _dayOfWeek = value ?? _dayOfWeek,
                              ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _creditsController,
                            enabled: !isSubmitting,
                            keyboardType: TextInputType.number,
                            decoration:
                                const InputDecoration(labelText: 'Credits'),
                            validator: (value) {
                              final parsed =
                                  int.tryParse(value?.trim() ?? '');
                              if (parsed == null ||
                                  parsed < 1 ||
                                  parsed > 6) {
                                return 'Enter 1 to 6 credits';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _semester,
                            decoration:
                                const InputDecoration(labelText: 'Semester'),
                            items: _semesters
                                .map(
                                  (value) => DropdownMenuItem(
                                    value: value,
                                    child: Text(value),
                                  ),
                                )
                                .toList(),
                            onChanged: isSubmitting
                                ? null
                                : (value) => setState(
                                      () => _semester = value ?? _semester,
                                    ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _notesController,
                      enabled: !isSubmitting,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Notes (optional)',
                      ),
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: isSubmitting
                    ? null
                    : () {
                        if (mounted) Navigator.of(context).pop();
                      },
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: isSubmitting ? null : _submit,
                child: Text(isSubmitting ? 'Adding...' : 'Add Class'),
              ),
            ],
          );
        },
      ),
    );
  }
}

Future<void> _showAssignmentDialog(BuildContext context) async {
  final bloc = context.read<AcademicBloc>();
  final titleController = TextEditingController();
  final descriptionController = TextEditingController();
  final hoursController = TextEditingController(text: '2');
  final formKey = GlobalKey<FormState>();
  var type = 'homework';
  var priority = 'medium';
  DateTime? dueDate;
  int? classId;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: const Text('Add New Assignment'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: titleController,
                  decoration:
                      const InputDecoration(labelText: 'Assignment title'),
                  validator: _requiredValidator,
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: descriptionController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Description (optional)',
                  ),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: type,
                  decoration: const InputDecoration(labelText: 'Type'),
                  items: _assignmentTypes
                      .map(
                        (value) => DropdownMenuItem(
                          value: value,
                          child: Text(_titleCase(value)),
                        ),
                      )
                      .toList(),
                  onChanged: (value) => setState(() => type = value ?? type),
                ),
                const SizedBox(height: 10),
                _DateField(
                  label: 'Due date',
                  value: dueDate,
                  onTap: () async {
                    final initialDate =
                        dueDate ?? DateTime.now().add(const Duration(days: 1));
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: initialDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime(DateTime.now().year + 5),
                    );
                    if (picked != null) {
                      setState(
                        () => dueDate = DateTime(
                          picked.year,
                          picked.month,
                          picked.day,
                          initialDate.hour,
                          initialDate.minute,
                        ),
                      );
                    }
                  },
                ),
                const SizedBox(height: 10),
                if (bloc.state.classes.isNotEmpty)
                  DropdownButtonFormField<int?>(
                    value: classId,
                    decoration:
                        const InputDecoration(labelText: 'Class (optional)'),
                    items: [
                      const DropdownMenuItem<int?>(
                        value: null,
                        child: Text('No class'),
                      ),
                      ...bloc.state.classes.map(
                            (item) => DropdownMenuItem<int?>(
                              value: item.id,
                              child: Text(item.className),
                            ),
                          ),
                    ],
                    onChanged: (value) => setState(() => classId = value),
                  ),
                if (bloc.state.classes.isNotEmpty)
                  const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: priority,
                  decoration: const InputDecoration(labelText: 'Priority'),
                  items: _priorities
                      .map(
                        (value) => DropdownMenuItem(
                          value: value,
                          child: Text(_titleCase(value)),
                        ),
                      )
                      .toList(),
                  onChanged: (value) =>
                      setState(() => priority = value ?? priority),
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: hoursController,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: 'Estimated hours'),
                  validator: (value) {
                    final parsed = int.tryParse(value?.trim() ?? '');
                    if (parsed == null || parsed < 1 || parsed > 100) {
                      return 'Enter 1 to 100 hours';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              if (!formKey.currentState!.validate()) return;
              if (dueDate == null) {
                ScaffoldMessenger.of(context)
                  ..hideCurrentSnackBar()
                  ..showSnackBar(
                    const SnackBar(content: Text('Choose a due date.')),
                  );
                return;
              }
              bloc.add(
                    AddAssignment(
                      AssignmentInput(
                        title: titleController.text,
                        description: descriptionController.text,
                        type: type,
                        dueDate: dueDate!,
                        priority: priority,
                        classId: classId,
                        estimatedHours:
                            int.tryParse(hoursController.text.trim()) ?? 2,
                      ),
                    ),
                  );
              Navigator.pop(dialogContext);
            },
            child: const Text('Add Assignment'),
          ),
        ],
      ),
    ),
  );

  titleController.dispose();
  descriptionController.dispose();
  hoursController.dispose();
}

class _TimeField extends StatelessWidget {
  const _TimeField({
    required this.label,
    required this.value,
    required this.onTap,
    required this.validator,
  });

  final String label;
  final String value;
  final VoidCallback onTap;
  final String? Function(String?) validator;

  @override
  Widget build(BuildContext context) {
    return FormField<String>(
      initialValue: value,
      validator: (_) => validator(value),
      builder: (field) => InkWell(
        onTap: () {
          onTap();
          field.didChange(value);
        },
        child: InputDecorator(
          decoration: InputDecoration(
            labelText: label,
            errorText: field.errorText,
            suffixIcon: const Icon(Icons.access_time_outlined, size: 18),
            border: const OutlineInputBorder(),
          ),
          child: Text(
            value.isEmpty ? 'Select' : _formatTime(value),
            style: TextStyle(
              color: value.isEmpty
                  ? const Color(0xFF6B7280)
                  : const Color(0xFF111827),
            ),
          ),
        ),
      ),
    );
  }
}

class _DateField extends StatelessWidget {
  const _DateField({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final DateTime? value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: InputDecorator(
        decoration: const InputDecoration(
          labelText: 'Due date',
          suffixIcon: Icon(Icons.calendar_today_outlined, size: 18),
          border: OutlineInputBorder(),
        ),
         child: Text(
           value == null ? 'Select a date' : _fullDate(value!),
         ),
      ),
    );
  }
}

Future<String?> _pickTime(BuildContext context, String current) async {
  final parts = current.split(':');
  final initial = TimeOfDay(
    hour: int.tryParse(parts.first) ?? 9,
    minute: parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0,
  );
  final picked = await showTimePicker(context: context, initialTime: initial);
  if (picked == null) return null;
  return '${picked.hour.toString().padLeft(2, '0')}:'
      '${picked.minute.toString().padLeft(2, '0')}';
}

DateTime? _meetingDateTime(String day, String time) {
  final parts = time.trim().split(':');
  final hour = int.tryParse(parts.first);
  final minute = parts.length > 1 ? int.tryParse(parts[1]) : 0;
  if (hour == null ||
      minute == null ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59) {
    return null;
  }

  final weekday = _weekdays.indexOf(day) + 1;
  final now = DateTime.now();
  var daysAhead = weekday - now.weekday;
  if (daysAhead < 0) daysAhead += 7;
  final date = now.add(Duration(days: daysAhead));
  return DateTime(date.year, date.month, date.day, hour, minute);
}

Future<void> _refresh(BuildContext context) async {
  final bloc = context.read<AcademicBloc>();
  bloc.add(const RefreshAcademic());
  await bloc.stream.firstWhere(
    (state) =>
        (state.status == AcademicStatus.loaded ||
            state.status == AcademicStatus.failure) &&
        state.action == AcademicAction.none &&
        !state.isLoading,
  );
}

bool _matchesFilter(AssignmentModel item, AcademicAssignmentFilter filter) {
  final now = DateTime.now();
  switch (filter) {
    case AcademicAssignmentFilter.all:
      return true;
    case AcademicAssignmentFilter.upcoming:
      return item.dueDate.isAfter(now) && !item.isCompleted;
    case AcademicAssignmentFilter.overdue:
      return item.dueDate.isBefore(now) && !item.isCompleted;
    case AcademicAssignmentFilter.inProgress:
      return item.status == 'in_progress';
    case AcademicAssignmentFilter.completed:
      return item.isCompleted;
  }
}

String _filterLabel(AcademicAssignmentFilter filter) {
  switch (filter) {
    case AcademicAssignmentFilter.all:
      return 'All';
    case AcademicAssignmentFilter.upcoming:
      return 'Upcoming';
    case AcademicAssignmentFilter.overdue:
      return 'Overdue';
    case AcademicAssignmentFilter.inProgress:
      return 'In Progress';
    case AcademicAssignmentFilter.completed:
      return 'Completed';
  }
}

String _dayName(int day) {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return day >= 0 && day < days.length ? days[day] : 'Unknown day';
}

String _formatTime(String value) {
  final parts = value.split(':');
  final hour = int.tryParse(parts.first);
  final minute = parts.length > 1 ? int.tryParse(parts[1]) : null;
  if (hour == null || minute == null) return value;
  final time = TimeOfDay(hour: hour, minute: minute);
  final hour12 = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
  final period = time.period == DayPeriod.am ? 'AM' : 'PM';
  return '$hour12:${minute.toString().padLeft(2, '0')} $period';
}

String _relativeDueDate(DateTime date) {
  final today = DateTime.now();
  final a = DateTime(today.year, today.month, today.day);
  final b = DateTime(date.year, date.month, date.day);
  final days = b.difference(a).inDays;
  if (days == 0) return 'Today';
  if (days == 1) return 'Tomorrow';
  return '${_monthName(date.month)} ${date.day}';
}

String _fullDate(DateTime date) =>
    '${_monthName(date.month)} ${date.day}, ${date.year}';

String _monthName(int month) {
  const months = [
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
  return months[month - 1];
}

Color _priorityColor(String priority) {
  switch (priority) {
    case 'urgent':
      return const Color(0xFFDC2626);
    case 'high':
      return const Color(0xFFF97316);
    case 'medium':
      return const Color(0xFFD97706);
    case 'low':
      return const Color(0xFF16A34A);
    default:
      return const Color(0xFF6B7280);
  }
}

String _statusLabel(String status) {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'submitted':
      return 'Submitted';
    default:
      return _titleCase(status);
  }
}

String _titleCase(String value) {
  return value
      .split('_')
      .map(
        (part) => part.isEmpty
            ? part
            : '${part[0].toUpperCase()}${part.substring(1)}',
      )
      .join(' ');
}

String _formatNumber(double value) =>
    value == value.roundToDouble() ? '${value.toInt()}' : value.toStringAsFixed(1);

String? _requiredValidator(String? value) =>
    value == null || value.trim().isEmpty ? 'This field is required' : null;

FormFieldValidator<String> _requiredField(String message) =>
    (value) => value == null || value.trim().isEmpty ? message : null;

String? _positiveIntValidator(String? value) {
  final parsed = int.tryParse(value?.trim() ?? '');
  if (parsed == null || parsed <= 0) return 'Enter a positive whole number';
  return null;
}

bool _hasText(String? value) => value != null && value.trim().isNotEmpty;

const _assignmentTypes = ['homework', 'project', 'exam', 'quiz', 'paper'];
const _priorities = ['low', 'medium', 'high', 'urgent'];
const _semesters = ['Fall 2025', 'Spring 2026', 'Summer 2025', 'Winter 2025'];
const _studyTechniques = [
  'reading',
  'flashcards',
  'practice-problems',
  'note-taking',
  'group-study',
  'online-resources',
];
const _campusLocationCategories = [
  'academic',
  'dining',
  'recreation',
  'services',
  'transportation',
];
const _weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];