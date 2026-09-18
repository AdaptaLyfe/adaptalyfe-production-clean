import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../core/layout/responsive.dart';
import '../../../models/user_model.dart';
import '../../calendar/bloc/calendar_bloc.dart';
import '../../calendar/bloc/calendar_state.dart';
import '../../daily_tasks/bloc/daily_tasks_bloc.dart';
import '../../daily_tasks/bloc/daily_tasks_event.dart';
import '../../daily_tasks/bloc/daily_tasks_state.dart';
import '../../daily_tasks/models/daily_task_model.dart';
import '../../financial/bloc/financial_bloc.dart';
import '../../financial/bloc/financial_state.dart';
import '../../mood/bloc/mood_bloc.dart';
import '../../mood/bloc/mood_event.dart';
import '../../mood/models/mood_entry_model.dart';
import '../../mood/bloc/mood_state.dart';
import '../../subscription/bloc/subscription_bloc.dart';
import '../../subscription/bloc/subscription_state.dart';
import '../bloc/home_state.dart';
import 'home_extended_widgets.dart';

class HomeDashboardBody extends StatelessWidget {
  const HomeDashboardBody({
    required this.homeState,
    required this.onRefresh,
    super.key,
  });

  final HomeState homeState;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final user = homeState is HomeLoaded
        ? (homeState as HomeLoaded).user
        : null;

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFFD9FAFB),
            Color(0xFFE9FCFB),
            Color(0xFFFFFFFF),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: RefreshIndicator(
        onRefresh: onRefresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
           padding: AppResponsive.pagePadding(context).copyWith(top: 16, bottom: 36),
          children: [
            if (homeState is HomeInitial || homeState is HomeLoading)
              const HomeLoadingCard()
            else if (user != null)
              BlocBuilder<DailyTasksBloc, DailyTasksState>(
                builder: (context, taskState) => HomeWelcomeCard(
                  user: user,
                  tasks: taskState.tasks,
                ),
              )
            else if (homeState is HomeError)
              HomeErrorCard(
                message: (homeState as HomeError).message,
                onRetry: onRefresh,
              ),
            const SizedBox(height: 16),
            if (user != null)
              BlocBuilder<SubscriptionBloc, SubscriptionState>(
                builder: (context, state) => HomeSubscriptionBanner(
                  user: user,
                  state: state,
                ),
              ),
            if (user != null) ...[
              const HomeConfigurableQuickActions(),
              const SizedBox(height: 20),
              HomeTodayFlowRich(user: user),
              const SizedBox(height: 20),
              const HomeLiveDailyGuide(),
              const SizedBox(height: 20),
              const HomeDashboardModules(),
            ],
          ],
        ),
      ),
    );
  }
}

class HomeLoadingCard extends StatelessWidget {
  const HomeLoadingCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 214,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF2DD4BF), width: 2),
      ),
      child: const Center(
        child: CircularProgressIndicator(color: Color(0xFF2DD4BF)),
      ),
    );
  }
}

class HomeErrorCard extends StatelessWidget {
  const HomeErrorCard({
    required this.message,
    required this.onRetry,
    super.key,
  });

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return HomeSectionCard(
      borderColor: const Color(0xFFFECACA),
      child: Column(
        children: [
          const Icon(Icons.cloud_off_rounded, color: Color(0xFFB91C1C), size: 38),
          const SizedBox(height: 10),
          const Text(
            'We could not load your dashboard.',
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
            style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () {
              onRetry();
            },
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Try again'),
          ),
        ],
      ),
    );
  }
}

class HomeWelcomeCard extends StatelessWidget {
  const HomeWelcomeCard({
    required this.user,
    required this.tasks,
    super.key,
  });

  final UserModel user;
  final List<DailyTaskModel> tasks;

  @override
  Widget build(BuildContext context) {
    final completed = tasks.where((task) => task.isCompleted).length;
    final progress = tasks.isEmpty ? 0 : ((completed / tasks.length) * 100).round();
    final displayName = user.name?.trim().isNotEmpty == true
        ? user.name!.trim()
        : user.username;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF2DD4BF), width: 2),
        boxShadow: const [
          BoxShadow(
            color: Color(0x22000000),
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.asset(
                  'assets/adaptalyfe-icon.png',
                  width: 28,
                  height: 28,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Adaptalyfe',
                      style: TextStyle(
                        color: Color(0xFF2DD4BF),
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'Grow with Guidance. Thrive with Confidence.',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.rocket_launch_rounded,
                  color: Color(0xFF2DD4BF), size: 30),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            '${_greeting()}, $displayName! ★',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 25,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _WelcomeMetric(
                label: "Today's Progress",
                value: '$progress%',
              ),
              _WelcomeMetric(
                label: 'Current Streak',
                value: '${user.streakDays} days',
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }
}

class _WelcomeMetric extends StatelessWidget {
  const _WelcomeMetric({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(9),
        border: Border.all(color: const Color(0x662DD4BF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              color: Color(0xFF2DD4BF),
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class HomeSubscriptionBanner extends StatelessWidget {
  const HomeSubscriptionBanner({
    required this.user,
    required this.state,
    super.key,
  });

  final UserModel user;
  final SubscriptionState state;

  @override
  Widget build(BuildContext context) {
    final subscription = state.subscription;
    if (user.isAdmin ||
        subscription == null ||
        subscription.isActive ||
        (!subscription.isExpired &&
            (subscription.trialDaysLeft == null ||
                subscription.trialDaysLeft! > 2))) {
      return const SizedBox.shrink();
    }

    final expired = subscription.isExpired || subscription.trialDaysLeft == 0;
    final days = subscription.trialDaysLeft ?? 0;
    final color = expired ? const Color(0xFFB91C1C) : const Color(0xFF92400E);
    final background = expired ? const Color(0xFFFEF2F2) : const Color(0xFFFEFCE8);

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: expired ? const Color(0xFFFCA5A5) : const Color(0xFFFDE68A),
          width: 2,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            expired ? Icons.warning_amber_rounded : Icons.schedule_rounded,
            color: color,
            size: 24,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  expired ? 'Free Trial Expired' : 'Trial Ending Soon',
                  style: TextStyle(color: color, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  expired
                      ? 'Subscribe now to continue using Adaptalyfe features.'
                      : 'Your free trial ends in $days ${days == 1 ? 'day' : 'days'}.',
                  style: TextStyle(color: color, fontSize: 13),
                ),
                const SizedBox(height: 9),
                FilledButton.icon(
                  onPressed: () => context.go('/subscription'),
                  icon: const Icon(Icons.star_rounded, size: 16),
                  label: const Text('View Plans'),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF7C3AED),
                    foregroundColor: Colors.white,
                    visualDensity: VisualDensity.compact,
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

class HomeQuickActions extends StatelessWidget {
  const HomeQuickActions({super.key});

  static const _actions = [
    _QuickAction(
      'Meals & Shopping',
      'Plan and shop',
      Icons.shopping_cart_outlined,
      Color(0xFFF97316),
      '/meal-shopping',
    ),
    _QuickAction(
      'Health Records',
      'Personal health info',
      Icons.medical_services_outlined,
      Color(0xFFEC4899),
      '/medical',
    ),
    _QuickAction(
      'Daily Tasks',
      'Complete activities',
      Icons.check_box_outlined,
      Color(0xFF14B8A6),
      '/daily-tasks',
    ),
    _QuickAction(
      'Mood Check-in',
      'How are you feeling?',
      Icons.sentiment_satisfied_alt_outlined,
      Color(0xFFEC4899),
      '/mood-tracking',
    ),
    _QuickAction(
      'Bill Reminders',
      'Manage payments',
      Icons.calendar_month_outlined,
      Color(0xFF3B82F6),
      '/financial',
    ),
    _QuickAction(
      'Resources',
      'Helpful guides',
      Icons.menu_book_outlined,
      Color(0xFFEAB308),
      '/resources',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return HomeSectionCard(
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Quick Actions',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 14),
           LayoutBuilder(
             builder: (context, constraints) => GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _actions.length,
             gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
               crossAxisCount: constraints.maxWidth < 360 ? 1 : 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
               childAspectRatio: 1.55,
             ),
             itemBuilder: (context, index) {
              final action = _actions[index];
              return InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => context.push(action.route),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: action.color.withAlpha(22),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: action.color.withAlpha(90)),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: action.color,
                        foregroundColor: Colors.white,
                        child: Icon(action.icon, size: 20),
                      ),
                      const SizedBox(width: 9),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              action.label,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF111827),
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              action.description,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF6B7280),
                                fontSize: 11,
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
        ],
      ),
    );
  }
}

class _QuickAction {
  const _QuickAction(
    this.label,
    this.description,
    this.icon,
    this.color,
    this.route,
  );

  final String label;
  final String description;
  final IconData icon;
  final Color color;
  final String route;
}

class HomeTodayFlow extends StatelessWidget {
  const HomeTodayFlow({required this.user, super.key});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DailyTasksBloc, DailyTasksState>(
      builder: (context, taskState) {
        return BlocBuilder<CalendarBloc, CalendarState>(
          builder: (context, calendarState) {
            final now = DateTime.now();
            final pending = taskState.tasks.where((task) => !task.isCompleted).toList();
            final todayAppointments = calendarState.upcomingAppointments
                .where((appointment) =>
                    DateUtils.isSameDay(appointment.appointmentDate, now) &&
                    !appointment.isCompleted)
                .toList();
            final todayEvents = calendarState.calendarEvents
                .where((event) =>
                    DateUtils.isSameDay(event.startDate, now) &&
                    !event.isCompleted)
                .toList();
            final nextTask = pending.isEmpty ? null : pending.first;
            final nextAppointment =
                todayAppointments.isEmpty ? null : todayAppointments.first;
            final nextEvent = todayEvents.isEmpty ? null : todayEvents.first;
            final hasSchedule =
                nextTask != null || nextAppointment != null || nextEvent != null;
            final title =
                nextAppointment?.title ?? nextEvent?.title ?? nextTask?.title;
            final detail = nextAppointment != null
                ? _formatTime(nextAppointment.appointmentDate)
                : nextEvent != null
                    ? (nextEvent.allDay
                        ? 'All day'
                        : _formatTime(nextEvent.startDate))
                : nextTask?.scheduledTime;

            return HomeSectionCard(
              borderColor: const Color(0xFF99F6E4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.explore_outlined,
                          color: Color(0xFF0F766E)),
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
                      Text(
                        _dateLabel(now),
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "Let's look at today, ${user.name?.trim().isNotEmpty == true ? user.name!.trim() : user.username}",
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'One step at a time.',
                    style: TextStyle(color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDFA),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFCCFBF1)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.auto_awesome_rounded,
                            color: Color(0xFF0F766E), size: 24),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            hasSchedule
                                ? '$title${detail == null ? '' : ' · $detail'} is coming up. Start with one small preparation step.'
                                : pending.isEmpty
                                    ? 'Your schedule is clear. You made space for what matters today.'
                                    : 'Start with “${pending.first.title}” when you are ready.',
                            style: const TextStyle(
                              color: Color(0xFF134E4A),
                              height: 1.35,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () => context.push('/daily-tasks'),
                    icon: const Icon(Icons.list_alt_rounded, size: 18),
                    label: const Text('Open tasks'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class HomeDailyGuide extends StatelessWidget {
  const HomeDailyGuide({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DailyTasksBloc, DailyTasksState>(
      builder: (context, state) {
        final period = _periodLabel(DateTime.now().hour);
        final pending = state.tasks.where((task) => !task.isCompleted).toList();
        final grouped = <String, List<DailyTaskModel>>{
          'Morning': pending.where((task) => _taskPeriod(task) == 'Morning').toList(),
          'Afternoon': pending.where((task) => _taskPeriod(task) == 'Afternoon').toList(),
          'Evening': pending.where((task) => _taskPeriod(task) == 'Evening').toList(),
          'Anytime': pending.where((task) => _taskPeriod(task) == 'Anytime').toList(),
        };

        return HomeSectionCard(
          borderColor: const Color(0xFFC7D2FE),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(_periodIcon(DateTime.now().hour),
                      color: const Color(0xFF4F46E5)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '$period check-in',
                      style: const TextStyle(
                        color: Color(0xFF1E1B4B),
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                _periodTagline(DateTime.now().hour),
                style: const TextStyle(color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 14),
              if (state.isLoading)
                const LinearProgressIndicator(minHeight: 3)
              else if (pending.isEmpty)
                const _GuideMessage(
                  icon: Icons.check_circle_outline_rounded,
                  text: 'You made space for what matters today.',
                )
              else
                ...grouped.entries
                    .where((entry) => entry.value.isNotEmpty)
                    .map(
                      (entry) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _GuideGroup(
                          label: entry.key,
                          tasks: entry.value.take(3).toList(),
                        ),
                      ),
                    ),
            ],
          ),
        );
      },
    );
  }
}

class _GuideGroup extends StatelessWidget {
  const _GuideGroup({required this.label, required this.tasks});

  final String label;
  final List<DailyTaskModel> tasks;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.schedule_rounded,
              color: Color(0xFF6366F1), size: 17),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF4338CA),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                ...tasks.map(
                  (task) => Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: Text(
                      task.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF334155),
                        fontSize: 13,
                      ),
                    ),
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

class _GuideMessage extends StatelessWidget {
  const _GuideMessage({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF16A34A)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: Color(0xFF475569)),
          ),
        ),
      ],
    );
  }
}

class HomeDailySummary extends StatelessWidget {
  const HomeDailySummary({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DailyTasksBloc, DailyTasksState>(
      builder: (context, taskState) {
        return BlocBuilder<FinancialBloc, FinancialState>(
          builder: (context, financialState) {
            return BlocBuilder<MoodBloc, MoodState>(
              builder: (context, moodState) {
                final today = DateTime.now();
                final dailyTasks = taskState.tasks
                    .where((task) => task.frequency == 'daily' || task.frequency.isEmpty)
                    .toList();
                final completedToday = dailyTasks
                    .where((task) =>
                        task.isCompleted &&
                        (task.completedAt == null ||
                            DateUtils.isSameDay(task.completedAt, today)))
                    .length;
                final progress = dailyTasks.isEmpty
                    ? 0
                    : ((completedToday / dailyTasks.length) * 100).round();
                final dueBills = financialState.bills.where((bill) => !bill.isPaid).take(3).toList();
                final dueTasks = dailyTasks.where((task) => !task.isCompleted).take(3).toList();

                return HomeSectionCard(
                  borderColor: const Color(0xFFBFDBFE),
                  gradient: const LinearGradient(
                    colors: [Color(0xFFEFF6FF), Color(0xFFF5F3FF)],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const _SectionHeading(
                        icon: Icons.calendar_today_rounded,
                        color: Color(0xFF2563EB),
                        title: "Today's Summary",
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _fullDate(today),
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.all(13),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(180),
                          borderRadius: BorderRadius.circular(11),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.trending_up_rounded,
                                    color: Color(0xFF16A34A), size: 18),
                                const SizedBox(width: 6),
                                const Expanded(
                                  child: Text(
                                    'Daily Progress',
                                    style: TextStyle(
                                      color: Color(0xFF1F2937),
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                _StatusBadge(
                                  text: '$progress%',
                                  color: progress >= 80
                                      ? const Color(0xFF15803D)
                                      : progress >= 50
                                          ? const Color(0xFFA16207)
                                          : const Color(0xFF4B5563),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            _ProgressBar(value: progress / 100),
                            const SizedBox(height: 5),
                            Text(
                              '$completedToday of ${dailyTasks.length} daily tasks completed',
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (dueTasks.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        _SummaryList(
                          title: "Today's Tasks",
                          icon: Icons.check_circle_outline_rounded,
                          color: const Color(0xFF2563EB),
                          items: dueTasks.map((task) => task.title).toList(),
                          onOpen: () => context.push('/daily-tasks'),
                        ),
                      ],
                      if (dueBills.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        _SummaryList(
                          title: 'Upcoming Bills',
                          icon: Icons.attach_money_rounded,
                          color: const Color(0xFF16A34A),
                          items: dueBills
                              .map((bill) => '${bill.name} · \$${bill.amount.toStringAsFixed(2)}')
                              .toList(),
                          onOpen: () => context.push('/financial'),
                        ),
                      ],
                      if (moodState.todayMood == null &&
                          moodState.status == MoodStatus.loaded) ...[
                        const SizedBox(height: 12),
                        _SummaryAlert(
                          title: 'Required Daily Check-in',
                          message: 'Complete your mood check-in to continue using Adaptalyfe.',
                          onTap: () => context.push('/mood-tracking'),
                        ),
                      ],
                      if (dueTasks.isEmpty &&
                          dueBills.isEmpty &&
                          moodState.todayMood != null)
                        const Padding(
                          padding: EdgeInsets.only(top: 14),
                          child: _GuideMessage(
                            icon: Icons.check_circle_rounded,
                            text: 'All caught up! No urgent tasks or deadlines today.',
                          ),
                        ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }
}

class HomeTasksModule extends StatelessWidget {
  const HomeTasksModule({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DailyTasksBloc, DailyTasksState>(
      builder: (context, state) {
        final dailyTasks = state.tasks
            .where((task) => task.frequency == 'daily' || task.frequency.isEmpty)
            .toList();
        final weeklyTasks =
            state.tasks.where((task) => task.frequency == 'weekly').toList();
        final monthlyTasks =
            state.tasks.where((task) => task.frequency == 'monthly').toList();
        final completed = state.tasks.where((task) => task.isCompleted).length;

        return HomeSectionCard(
          borderColor: const Color(0xFF99F6E4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: Color(0xFF14B8A6),
                    foregroundColor: Colors.white,
                    child: Icon(Icons.check_box_rounded),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Task Management',
                      style: TextStyle(
                        color: Color(0xFF111827),
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Text(
                    '$completed done',
                    style: const TextStyle(
                      color: Color(0xFF0F766E),
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              if (state.isLoading)
                const LinearProgressIndicator(minHeight: 3)
              else if (state.status == DailyTasksStatus.failure && state.tasks.isEmpty)
                _InlineError(
                  message: state.errorMessage ?? 'Unable to load tasks.',
                  onRetry: () => context
                      .read<DailyTasksBloc>()
                      .add(const RefreshDailyTasks()),
                )
              else
                DefaultTabController(
                  length: 3,
                  child: Column(
                    children: [
                      const TabBar(
                        labelColor: Color(0xFF0F766E),
                        unselectedLabelColor: Color(0xFF64748B),
                        indicatorColor: Color(0xFF14B8A6),
                        tabs: [
                          Tab(text: 'Daily'),
                          Tab(text: 'Weekly'),
                          Tab(text: 'Monthly'),
                        ],
                      ),
                      SizedBox(
                        height: 248,
                        child: TabBarView(
                          children: [
                            _TaskCategoryPanel(
                              tasks: dailyTasks,
                              state: state,
                            ),
                            _TaskCategoryPanel(
                              tasks: weeklyTasks,
                              state: state,
                            ),
                            _TaskCategoryPanel(
                              tasks: monthlyTasks,
                              state: state,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => context.push('/daily-tasks'),
                  child: const Text('View all tasks'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _TaskCategoryPanel extends StatelessWidget {
  const _TaskCategoryPanel({
    required this.tasks,
    required this.state,
  });

  final List<DailyTaskModel> tasks;
  final DailyTasksState state;

  @override
  Widget build(BuildContext context) {
    final pending = tasks.where((task) => !task.isCompleted).take(3).toList();
    final completed = tasks.where((task) => task.isCompleted).take(2).toList();

    if (tasks.isEmpty) {
      return const Center(
        child: Text(
          'No tasks in this category yet.',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.only(top: 10),
      physics: const NeverScrollableScrollPhysics(),
      children: [
        if (pending.isNotEmpty)
          ...pending.map(
            (task) => _TaskRow(
              task: task,
              busy: state.activeTaskId == task.id,
              onToggle: () => context.read<DailyTasksBloc>().add(
                    ToggleDailyTask(
                      taskId: task.id,
                      isCompleted: true,
                    ),
                  ),
            ),
          ),
        if (completed.isNotEmpty) ...[
          const Padding(
            padding: EdgeInsets.only(top: 3, bottom: 7),
            child: Text(
              'Completed',
              style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
              ),
            ),
          ...completed.map(
            (task) => _TaskRow(
              task: task,
              completed: true,
              busy: state.activeTaskId == task.id,
              onToggle: () => context.read<DailyTasksBloc>().add(
                    ToggleDailyTask(
                      taskId: task.id,
                      isCompleted: false,
                    ),
                  ),
            ),
          ),
        ],
        if (pending.isEmpty && completed.isEmpty)
          const _GuideMessage(
            icon: Icons.celebration_rounded,
            text: 'All tasks are complete. Great job staying on track!',
          ),
      ],
    );
  }
}

class HomeMoodModule extends StatelessWidget {
  const HomeMoodModule({super.key});

  static const _moods = [
    (1, '😢', 'Sad'),
    (2, '😐', 'Okay'),
    (3, '😊', 'Good'),
    (4, '😃', 'Great'),
    (5, '🤩', 'Amazing'),
  ];

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<MoodBloc, MoodState>(
      builder: (context, state) {
        final required = state.status == MoodStatus.loaded && state.todayMood == null;
        final current = state.todayMood?.mood;
        final border = required ? const Color(0xFFFCA5A5) : const Color(0xFFC4B5FD);

        return HomeSectionCard(
          borderColor: border,
          background: required ? const Color(0xFFFFF7F7) : Colors.white,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor:
                        required ? const Color(0xFFEF4444) : const Color(0xFF8B5CF6),
                    foregroundColor: Colors.white,
                    child: const Icon(Icons.favorite_rounded),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Mood Log',
                      style: TextStyle(
                        color: Color(0xFF111827),
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  if (required)
                    const _StatusBadge(
                      text: 'Required',
                      color: Color(0xFFB91C1C),
                    ),
                ],
              ),
              if (required) ...[
                const SizedBox(height: 5),
                const Text(
                  'Daily mood check-in is required to continue.',
                  style: TextStyle(color: Color(0xFFDC2626), fontSize: 13),
                ),
              ],
              const SizedBox(height: 14),
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
                          child: OutlinedButton(
                            onPressed: current != null || state.isSubmitting
                                ? null
                                : () => context.read<MoodBloc>().add(
                                      AddMood(MoodEntryInput(mood: mood.$1)),
                                    ),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              side: BorderSide(
                                color: current == mood.$1
                                    ? const Color(0xFF8B5CF6)
                                    : const Color(0xFFE5E7EB),
                                width: current == mood.$1 ? 2 : 1,
                              ),
                              backgroundColor: current == mood.$1
                                  ? const Color(0xFFF5F3FF)
                                  : null,
                            ),
                            child: Column(
                              children: [
                                Text(mood.$2, style: const TextStyle(fontSize: 22)),
                                const SizedBox(height: 2),
                                Text(
                                  mood.$3,
                                  style: const TextStyle(fontSize: 9),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => context.push('/mood-tracking'),
                icon: const Icon(Icons.favorite_outline_rounded, size: 17),
                label: Text(required ? 'Complete check-in' : 'Open mood log'),
              ),
              if (state.actionMessage != null) ...[
                const SizedBox(height: 8),
                Text(
                  state.actionMessage!,
                  style: const TextStyle(
                    color: Color(0xFF15803D),
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
}

class _TaskRow extends StatelessWidget {
  const _TaskRow({
    required this.task,
    required this.busy,
    required this.onToggle,
    this.completed = false,
  });

  final DailyTaskModel task;
  final bool busy;
  final VoidCallback onToggle;
  final bool completed;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: busy ? null : onToggle,
            icon: busy
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(
                    completed
                        ? Icons.check_circle_rounded
                        : Icons.radio_button_unchecked_rounded,
                  ),
            color: completed
                ? const Color(0xFF16A34A)
                : const Color(0xFF14B8A6),
            tooltip: 'Complete task',
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF1F2937),
                    fontWeight: FontWeight.w600,
                  ).copyWith(
                    decoration:
                        completed ? TextDecoration.lineThrough : null,
                  ),
                ),
                if (task.description.isNotEmpty)
                  Text(
                    task.description,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          if (task.estimatedMinutes > 0)
            Text(
              '${task.estimatedMinutes}m',
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 11,
              ),
            ),
        ],
      ),
    );
  }
}

class _SummaryList extends StatelessWidget {
  const _SummaryList({
    required this.title,
    required this.icon,
    required this.color,
    required this.items,
    required this.onOpen,
  });

  final String title;
  final IconData icon;
  final Color color;
  final List<String> items;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: color, size: 17),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  color: Color(0xFF1F2937),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            TextButton(
              onPressed: onOpen,
              child: const Text('Open'),
            ),
          ],
        ),
        ...items.map(
          (item) => Padding(
            padding: const EdgeInsets.only(bottom: 3),
            child: Text(
              '• $item',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Color(0xFF4B5563), fontSize: 13),
            ),
          ),
        ),
      ],
    );
  }
}

class _SummaryAlert extends StatelessWidget {
  const _SummaryAlert({
    required this.title,
    required this.message,
    required this.onTap,
  });

  final String title;
  final String message;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF1F2),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFFCA5A5)),
        ),
        child: Row(
          children: [
            const Icon(Icons.warning_amber_rounded,
                color: Color(0xFFDC2626)),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Color(0xFF991B1B),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    message,
                    style: const TextStyle(
                      color: Color(0xFFDC2626),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_rounded,
                color: Color(0xFFDC2626), size: 18),
          ],
        ),
      ),
    );
  }
}

class HomeSectionCard extends StatelessWidget {
  const HomeSectionCard({
    required this.child,
    this.background = Colors.white,
    this.gradient,
    this.borderColor = const Color(0xFFE5E7EB),
    this.padding = const EdgeInsets.all(16),
    super.key,
  });

  final Widget child;
  final Color? background;
  final Gradient? gradient;
  final Color borderColor;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: gradient == null ? background : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading({
    required this.icon,
    required this.color,
    required this.title,
  });

  final IconData icon;
  final Color color;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 7),
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFF1F2937),
            fontSize: 19,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.text, required this.color});

  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
        return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _ProgressBar extends StatelessWidget {
  const _ProgressBar({required this.value});

  final double value;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: LinearProgressIndicator(
        value: value.clamp(0, 1).toDouble(),
        minHeight: 8,
        backgroundColor: const Color(0xFFE5E7EB),
        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF22C55E)),
      ),
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Color(0xFFB91C1C), fontSize: 13),
        ),
        TextButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh_rounded, size: 16),
          label: const Text('Retry'),
        ),
      ],
    );
  }
}

String _fullDate(DateTime date) {
  const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
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
  return '${weekdays[date.weekday - 1]}, ${months[date.month - 1]} ${date.day}, ${date.year}';
}

String _dateLabel(DateTime date) =>
    '${date.month}/${date.day}/${date.year} · One step at a time.';

String _formatTime(DateTime date) {
  final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
  final minute = date.minute.toString().padLeft(2, '0');
  return '$hour:$minute ${date.hour >= 12 ? 'PM' : 'AM'}';
}

String _periodLabel(int hour) {
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return "Tonight's recap";
}

String _periodTagline(int hour) {
  if (hour >= 5 && hour < 12) return "Here's what's ahead today.";
  if (hour >= 12 && hour < 17) return "Here's how your day is going.";
  if (hour >= 17 && hour < 21) return "Here's how your day went.";
  return 'Winding down for the day.';
}

IconData _periodIcon(int hour) {
  if (hour >= 5 && hour < 12) return Icons.wb_sunny_outlined;
  if (hour >= 12 && hour < 17) return Icons.sunny;
  if (hour >= 17 && hour < 21) return Icons.nightlight_round;
  return Icons.auto_awesome;
}

String _taskPeriod(DailyTaskModel task) {
  final raw = task.scheduledTime?.trim();
  if (raw == null || raw.isEmpty) return 'Anytime';
  final hour = int.tryParse(raw.split(':').first) ?? 12;
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Anytime';
}