import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/analytics/firebase_analytics_service.dart';
import '../../../core/layout/responsive.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../bloc/daily_tasks_bloc.dart';
import '../bloc/daily_tasks_event.dart';
import '../bloc/daily_tasks_state.dart';
import '../models/daily_task_model.dart';

class DailyTasksScreen extends StatelessWidget {
  const DailyTasksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<DailyTasksBloc, DailyTasksState>(
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
            title: const Text('Daily Tasks'),
            actions: [
              IconButton(
                tooltip: 'Refresh tasks',
                onPressed: state.action == DailyTaskAction.none
                    ? () => context
                        .read<DailyTasksBloc>()
                        .add(const RefreshDailyTasks())
                    : null,
                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
          ),
          body: _DailyTasksBody(state: state),
        );
      },
    );
  }
}

class _DailyTasksBody extends StatelessWidget {
  const _DailyTasksBody({required this.state});

  final DailyTasksState state;

  @override
  Widget build(BuildContext context) {
    if (state.isLoading && !state.hasTasks) {
      return const _DailyTasksLoading();
    }

    if (state.status == DailyTasksStatus.failure && !state.hasTasks) {
      return _DailyTasksError(
        message: state.errorMessage ?? 'Unable to load your daily tasks.',
        onRetry: () {
          context.read<DailyTasksBloc>().add(const RefreshDailyTasks());
        },
      );
    }

    final completedTasks =
        state.tasks.where((task) => task.isCompleted).length;
    final totalTasks = state.tasks.length;
    final progress = totalTasks == 0
        ? 0
        : ((completedTasks / totalTasks) * 100).round();
    DailyTaskModel? nextTask;
    for (final task in state.tasks) {
      if (!task.isCompleted) {
        nextTask = task;
        break;
      }
    }
    final remainingMinutes = state.tasks
        .where((task) => !task.isCompleted)
        .fold<int>(0, (total, task) => total + task.estimatedMinutes);

    final tasksByCategory = <String, List<DailyTaskModel>>{};
    for (final task in state.tasks) {
      tasksByCategory.putIfAbsent(task.category, () => []).add(task);
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
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
          children: [
            const Text(
              'Daily Tasks',
              style: TextStyle(
                color: Color(0xFF111827),
                fontSize: 28,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 14),
            _TaskJourneySummary(
              completedTasks: completedTasks,
              totalTasks: totalTasks,
              nextTaskTitle: nextTask?.title,
              remainingMinutes: remainingMinutes,
            ),
            const SizedBox(height: 16),
            _ProgressCard(
              completedTasks: completedTasks,
              totalTasks: totalTasks,
              progress: progress,
            ),
            const SizedBox(height: 20),
            if (state.isLoading && state.hasTasks)
              const LinearProgressIndicator(minHeight: 3),
            if (state.isLoading && state.hasTasks)
              const SizedBox(height: 12),
            if (tasksByCategory.isEmpty)
              const _EmptyTasksCard()
            else
              ...tasksByCategory.entries.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _CategoryCard(
                    category: entry.key,
                    tasks: entry.value,
                    state: state,
                  ),
                ),
              ),
            const SizedBox(height: 4),
            FilledButton.icon(
              onPressed: state.action == DailyTaskAction.none
                  ? () => _openTaskForm(context)
                  : null,
              icon: const Icon(Icons.add_rounded),
              label: const Text('Add New Task'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(52),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _refresh(BuildContext context) async {
    final bloc = context.read<DailyTasksBloc>();
    bloc.add(const RefreshDailyTasks());
    await bloc.stream.firstWhere(
      (nextState) =>
          (nextState.status == DailyTasksStatus.loaded ||
              nextState.status == DailyTasksStatus.failure) &&
          nextState.action == DailyTaskAction.none,
    );
  }

  Future<void> _openTaskForm(
    BuildContext context, {
    DailyTaskModel? task,
  }) async {
    final bloc = context.read<DailyTasksBloc>();
    await showDialog<void>(
      context: context,
      builder: (_) => BlocProvider.value(
        value: bloc,
        child: _TaskFormDialog(task: task),
      ),
    );
  }
}

class _TaskJourneySummary extends StatelessWidget {
  const _TaskJourneySummary({
    required this.completedTasks,
    required this.totalTasks,
    required this.nextTaskTitle,
    required this.remainingMinutes,
  });

  final int completedTasks;
  final int totalTasks;
  final String? nextTaskTitle;
  final int remainingMinutes;

  @override
  Widget build(BuildContext context) {
    final progress = totalTasks == 0
        ? 0
        : ((completedTasks / totalTasks) * 100).round();
    final remaining = (totalTasks - completedTasks).clamp(0, totalTasks);

    return Card(
      elevation: 0,
      color: const Color(0xFFF0FDFA),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Color(0xFFCCFBF1)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFCCFBF1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'Task journey',
                    style: TextStyle(
                      color: Color(0xFF115E59),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Text(
                  '$completedTasks complete · $remaining remaining',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              nextTaskTitle == null
                  ? 'Your task list is ready'
                  : 'Next manageable step: $nextTaskTitle',
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              nextTaskTitle == null
                  ? 'Add a task when there is something you want to remember or practice.'
                  : 'Start when you’re ready, mark it complete, and let progress build naturally.',
              style: const TextStyle(
                color: Color(0xFF475569),
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                const Text(
                  'Progress',
                  style: TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 13,
                  ),
                ),
                const Spacer(),
                Text(
                  '$progress%',
                  style: const TextStyle(
                    color: Color(0xFF115E59),
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 7),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: progress / 100,
                minHeight: 8,
                backgroundColor: const Color(0xFFCCFBF1),
                valueColor: const AlwaysStoppedAnimation(Color(0xFF0D9488)),
              ),
            ),
            if (remainingMinutes > 0) ...[
              const SizedBox(height: 8),
              Text(
                'About $remainingMinutes min remaining',
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 12,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  const _ProgressCard({
    required this.completedTasks,
    required this.totalTasks,
    required this.progress,
  });

  final int completedTasks;
  final int totalTasks;
  final int progress;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(14),
          topRight: Radius.circular(14),
        ),
        side: BorderSide(color: Color(0xFFBBF7D0)),
      ),
      child: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: Color(0xFF16A34A), width: 4),
          ),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Today’s Progress',
                        style: TextStyle(
                          color: Color(0xFF111827),
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(height: 4),
                    ],
                  ),
                ),
                Text(
                  '$progress%',
                  style: const TextStyle(
                    color: Color(0xFF16A34A),
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            Text(
              '$completedTasks of $totalTasks tasks completed',
              style: const TextStyle(
                color: Color(0xFF4B5563),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: progress / 100,
                minHeight: 12,
                backgroundColor: const Color(0xFFD1D5DB),
                valueColor: const AlwaysStoppedAnimation(Color(0xFF22C55E)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({
    required this.category,
    required this.tasks,
    required this.state,
  });

  final String category;
  final List<DailyTaskModel> tasks;
  final DailyTasksState state;

  @override
  Widget build(BuildContext context) {
    final completed = tasks.where((task) => task.isCompleted).length;

    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      child: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: Color(0xFFD1D5DB), width: 4),
          ),
        ),
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: _categoryColor(category),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '${_prettyLabel(category)} Tasks',
                    style: const TextStyle(
                      color: Color(0xFF1F2937),
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Text(
                  '($completed/${tasks.length})',
                  style: const TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...tasks.map(
              (task) => _TaskTile(
                task: task,
                state: state,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _categoryColor(String value) {
    switch (value) {
      case 'morning':
        return const Color(0xFFF59E0B);
      case 'cooking':
        return const Color(0xFF22C55E);
      case 'organization':
        return const Color(0xFF3B82F6);
      case 'planning':
        return const Color(0xFFA855F7);
      default:
        return const Color(0xFF9CA3AF);
    }
  }
}

class _TaskTile extends StatelessWidget {
  const _TaskTile({
    required this.task,
    required this.state,
  });

  final DailyTaskModel task;
  final DailyTasksState state;

  @override
  Widget build(BuildContext context) {
    final isActive = state.activeTaskId == task.id;
    final isBusy = isActive && state.action != DailyTaskAction.none;

    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconButton(
            tooltip: task.isCompleted
                ? 'Mark task incomplete'
                : 'Mark task complete',
            onPressed: state.action == DailyTaskAction.none
                ? () {
                    if (!task.isCompleted) {
                      FirebaseAnalyticsService.instance
                          .logTaskCompletion(task.category);
                    }
                    context.read<DailyTasksBloc>().add(
                          ToggleDailyTask(
                            taskId: task.id,
                            isCompleted: !task.isCompleted,
                          pointValue: task.pointValue,
                          ),
                        );
                  }
                : null,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            style: IconButton.styleFrom(
              backgroundColor: task.isCompleted
                  ? const Color(0xFF16A34A)
                  : const Color(0xFF22C55E),
              foregroundColor: Colors.white,
              shape: const CircleBorder(),
            ),
            icon: isBusy
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(
                    task.isCompleted
                        ? Icons.check_circle_rounded
                        : Icons.radio_button_unchecked_rounded,
                    color: Colors.white,
                    size: 26,
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.title,
                  style: TextStyle(
                    color: const Color(0xFF111827),
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    decoration: task.isCompleted
                        ? TextDecoration.lineThrough
                        : TextDecoration.none,
                  ),
                ),
                if (task.description.trim().isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    task.description,
                    style: const TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 13,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 5,
                  children: [
                    _TaskMetadata(
                      icon: Icons.schedule_rounded,
                      label: '${task.estimatedMinutes} min',
                    ),
                    if (task.frequency != 'daily')
                      _TaskMetadata(
                        label: task.frequency,
                        backgroundColor: const Color(0xFFDBEAFE),
                        foregroundColor: const Color(0xFF1D4ED8),
                      ),
                    if (task.scheduledTime != null)
                      _TaskMetadata(
                        label: _formatTime(task.scheduledTime!),
                        backgroundColor: const Color(0xFFF3E8FF),
                        foregroundColor: const Color(0xFF7E22CE),
                      ),
                    if (task.pointValue > 0)
                      _TaskMetadata(
                        icon: Icons.star_rounded,
                        label: '${task.pointValue} pts',
                        backgroundColor: const Color(0xFFFEF3C7),
                        foregroundColor: const Color(0xFFCA8A04),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _TaskActionButton(
                tooltip: 'Edit task',
                icon: Icons.edit_outlined,
                color: const Color(0xFF2563EB),
                onPressed: state.action == DailyTaskAction.none
                    ? () => _editTask(context)
                    : null,
              ),
              _TaskActionButton(
                tooltip: 'Delete task',
                icon: Icons.delete_outline_rounded,
                color: const Color(0xFFDC2626),
                onPressed: state.action == DailyTaskAction.none
                    ? () => _deleteTask(context)
                    : null,
              ),
              if (task.isCompleted)
                Container(
                  width: 44,
                  height: 44,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF59E0B),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.star_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _editTask(BuildContext context) async {
    final bloc = context.read<DailyTasksBloc>();
    await showDialog<void>(
      context: context,
      builder: (_) => BlocProvider.value(
        value: bloc,
        child: _TaskFormDialog(task: task),
      ),
    );
  }

  Future<void> _deleteTask(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete task?'),
        content: Text('Are you sure you want to delete "${task.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      context.read<DailyTasksBloc>().add(DeleteDailyTask(task.id));
    }
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
}

class _TaskMetadata extends StatelessWidget {
  const _TaskMetadata({
    required this.label,
    this.icon,
    this.backgroundColor = const Color(0xFFF3F4F6),
    this.foregroundColor = const Color(0xFF6B7280),
  });

  final String label;
  final IconData? icon;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
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

class _TaskActionButton extends StatelessWidget {
  const _TaskActionButton({
    required this.tooltip,
    required this.icon,
    required this.color,
    required this.onPressed,
  });

  final String tooltip;
  final IconData icon;
  final Color color;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      onPressed: onPressed,
      padding: EdgeInsets.zero,
      constraints: const BoxConstraints.tightFor(width: 44, height: 44),
      icon: Icon(icon, color: color, size: 18),
    );
  }
}

class _EmptyTasksCard extends StatelessWidget {
  const _EmptyTasksCard();

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
              Icons.checklist_rounded,
              size: 52,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 12),
            const Text(
              'No tasks yet',
              style: TextStyle(
                color: Color(0xFF374151),
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 5),
            const Text(
              'Add a task when there is something you want to remember or practice.',
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

class _DailyTasksLoading extends StatelessWidget {
  const _DailyTasksLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          height: 34,
          width: 180,
          decoration: BoxDecoration(
            color: const Color(0xFFE5E7EB),
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        const SizedBox(height: 16),
        ...List.generate(
          4,
          (index) => Container(
            height: 110,
            margin: const EdgeInsets.only(bottom: 14),
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

class _DailyTasksError extends StatelessWidget {
  const _DailyTasksError({
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
              'We could not load your daily tasks.',
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

class _TaskFormDialog extends StatefulWidget {
  const _TaskFormDialog({this.task});

  final DailyTaskModel? task;

  @override
  State<_TaskFormDialog> createState() => _TaskFormDialogState();
}

class _TaskFormDialogState extends State<_TaskFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _estimatedMinutesController;
  late final TextEditingController _pointValueController;
  late String _category;
  late String _frequency;
  String? _scheduledTime;

  static const _categories = [
    ('personal_care', 'Personal Care'),
    ('household', 'Household'),
    ('work', 'Work'),
    ('health', 'Health'),
    ('social', 'Social'),
    ('education', 'Education'),
  ];

  static const _frequencies = [
    ('daily', 'Daily'),
    ('weekly', 'Weekly'),
    ('monthly', 'Monthly'),
  ];

  @override
  void initState() {
    super.initState();
    final task = widget.task;
    _titleController = TextEditingController(text: task?.title ?? '');
    _descriptionController =
        TextEditingController(text: task?.description ?? '');
    _estimatedMinutesController = TextEditingController(
      text: '${task?.estimatedMinutes ?? 15}',
    );
    _pointValueController = TextEditingController(
      text: '${task?.pointValue ?? 0}',
    );
    _category = task?.category ?? 'personal_care';
    _frequency = task?.frequency ?? 'daily';
    _scheduledTime = task?.scheduledTime;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _estimatedMinutesController.dispose();
    _pointValueController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.task != null;
    final isSaving = context.select<DailyTasksBloc, bool>(
      (bloc) => bloc.state.action != DailyTaskAction.none,
    );
    final categoryOptions = [..._categories];
    if (!categoryOptions.any((option) => option.$1 == _category)) {
      categoryOptions.add((_category, _prettyLabel(_category)));
    }

    return BlocListener<DailyTasksBloc, DailyTasksState>(
      listenWhen: (previous, current) =>
          previous.action != current.action ||
          previous.actionMessage != current.actionMessage ||
          previous.errorMessage != current.errorMessage,
      listener: (context, state) {
        if (state.action == DailyTaskAction.none &&
            state.actionMessage != null &&
            state.errorMessage == null) {
          Navigator.of(context).pop();
        }
      },
      child: AlertDialog(
        title: Text(isEditing ? 'Edit Task' : 'Add New Daily Task'),
        content: SizedBox(
          width: AppResponsive.dialogWidth(context),
          height: AppResponsive.dialogMaxHeight(context, fraction: .78),
          child: SingleChildScrollView(
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: _titleController,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Task title',
                      hintText: 'What would you like to do?',
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter a task title';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Description',
                      hintText: 'Description (optional)',
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _category,
                    decoration: const InputDecoration(labelText: 'Category'),
                    items: categoryOptions
                        .map(
                          (option) => DropdownMenuItem(
                            value: option.$1,
                            child: Text(option.$2),
                          ),
                        )
                        .toList(),
                    onChanged: isSaving
                        ? null
                        : (value) {
                            if (value != null) setState(() => _category = value);
                          },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _frequency,
                    decoration: const InputDecoration(labelText: 'Frequency'),
                    items: _frequencies
                        .map(
                          (option) => DropdownMenuItem(
                            value: option.$1,
                            child: Text(option.$2),
                          ),
                        )
                        .toList(),
                    onChanged: isSaving
                        ? null
                        : (value) {
                            if (value != null) {
                              setState(() => _frequency = value);
                            }
                          },
                  ),
                  const SizedBox(height: 12),
                  _ScheduledTimeField(
                    value: _scheduledTime,
                    onChanged: isSaving
                        ? (_) {}
                        : (value) => setState(() => _scheduledTime = value),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _estimatedMinutesController,
                    enabled: !isSaving,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Estimated Time (minutes)',
                      hintText: '1–480 minutes',
                    ),
                    validator: (value) {
                      final minutes = int.tryParse(value ?? '');
                      if (minutes == null || minutes < 1 || minutes > 480) {
                        return 'Enter a number from 1 to 480';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _pointValueController,
                    enabled: !isSaving,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Point Value',
                      hintText: '0–100 points',
                    ),
                    validator: (value) {
                      final points = int.tryParse(value ?? '');
                      if (points == null || points < 0 || points > 100) {
                        return 'Enter a number from 0 to 100';
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: isSaving ? null : () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: isSaving ? null : _submit,
            child: isSaving
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(isEditing ? 'Update Task' : 'Create Task'),
          ),
        ],
      ),
    );
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final input = DailyTaskInput(
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      category: _category,
      frequency: _frequency,
      estimatedMinutes: int.parse(_estimatedMinutesController.text),
      pointValue: int.parse(_pointValueController.text),
      scheduledTime: _scheduledTime,
    );
    final bloc = context.read<DailyTasksBloc>();
    final task = widget.task;
    if (task == null) {
      bloc.add(AddDailyTask(input));
    } else {
      bloc.add(EditDailyTask(taskId: task.id, input: input));
    }
  }
}

class _ScheduledTimeField extends StatelessWidget {
  const _ScheduledTimeField({
    required this.value,
    required this.onChanged,
  });

  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return InputDecorator(
      decoration: const InputDecoration(
        labelText: 'Scheduled Time (optional)',
        border: OutlineInputBorder(),
      ),
      child: Row(
        children: [
          const Icon(Icons.access_time_rounded, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value == null ? 'No specific time' : _displayTime(value!),
              style: TextStyle(
                color: value == null
                    ? const Color(0xFF6B7280)
                    : const Color(0xFF111827),
              ),
            ),
          ),
          TextButton(
            onPressed: () async {
              final initial = _parseTime(value) ?? TimeOfDay.now();
              final selected = await showTimePicker(
                context: context,
                initialTime: initial,
              );
              if (selected == null) return;
              onChanged(
                '${selected.hour.toString().padLeft(2, '0')}:'
                '${selected.minute.toString().padLeft(2, '0')}',
              );
            },
            child: Text(value == null ? 'Set' : 'Change'),
          ),
          if (value != null)
            IconButton(
              tooltip: 'Clear time',
              onPressed: () => onChanged(null),
              icon: const Icon(Icons.close_rounded),
            ),
        ],
      ),
    );
  }

  TimeOfDay? _parseTime(String? value) {
    if (value == null) return null;
    final parts = value.split(':');
    final hour = int.tryParse(parts.first);
    final minute = parts.length > 1 ? int.tryParse(parts[1]) : null;
    if (hour == null || minute == null) return null;
    return TimeOfDay(hour: hour, minute: minute);
  }

  String _displayTime(String value) {
    final time = _parseTime(value);
    if (time == null) return value;
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final period = time.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:${time.minute.toString().padLeft(2, '0')} $period';
  }
}

String _prettyLabel(String value) {
  return value
      .split('_')
      .map(
        (word) => word.isEmpty
            ? word
            : '${word[0].toUpperCase()}${word.substring(1)}',
      )
      .join(' ');
}