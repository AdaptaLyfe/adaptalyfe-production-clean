import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/layout/responsive.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../bloc/sleep_bloc.dart';
import '../bloc/sleep_event.dart';
import '../bloc/sleep_state.dart';
import '../models/sleep_models.dart';
import '../sleep_calculations.dart';
import '../sleep_trends.dart';
import '../sleep_validation.dart';

class SleepTrackingScreen extends StatelessWidget {
  const SleepTrackingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<SleepBloc, SleepState>(
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
        if (state.status == SleepStatus.initial ||
            (state.isLoading && !state.hasData)) {
          return const Scaffold(
            appBar: _SleepAppBar(),
            body: _SleepLoading(),
          );
        }
        if (state.status == SleepStatus.failure && !state.hasData) {
          return Scaffold(
            appBar: const _SleepAppBar(),
            body: _SleepError(
              message: state.errorMessage ?? 'Unable to load sleep data.',
              onRetry: () =>
                  context.read<SleepBloc>().add(const RefreshSleep()),
            ),
          );
        }
        return _SleepDashboard(state: state);
      },
    );
  }
}

class _SleepAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _SleepAppBar();

  @override
  Widget build(BuildContext context) => AppBar(
        title: const Text('Sleep Routine'),
        actions: [
          IconButton(
            tooltip: 'Refresh sleep data',
            onPressed: () =>
                context.read<SleepBloc>().add(const RefreshSleep()),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      );

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _SleepDashboard extends StatefulWidget {
  const _SleepDashboard({required this.state});

  final SleepState state;

  @override
  State<_SleepDashboard> createState() => _SleepDashboardState();
}

class _SleepDashboardState extends State<_SleepDashboard> {
  int _targetSleepDuration = 480;
  String _targetBedtime = '22:00';
  String _targetWakeTime = '06:00';

  @override
  Widget build(BuildContext context) {
    final stats = _calculateStats(
      widget.state.sessions,
      _targetSleepDuration,
      referenceDate: _dateOnly(widget.state.activeDate),
    );
    return DefaultTabController(
      length: 4,
      child: Builder(
        builder: (tabContext) => BlocListener<SleepBloc, SleepState>(
          listenWhen: (previous, current) =>
              current.actionMessage != null &&
              current.actionMessage != previous.actionMessage,
          listener: (_, state) {
            if (state.actionMessage != null) {
              DefaultTabController.of(tabContext).animateTo(0);
            }
          },
          child: Scaffold(
        appBar: AppBar(
          title: const Text('Sleep Routine'),
          actions: [
            IconButton(
              tooltip: 'Refresh sleep data',
              onPressed: () =>
                  context.read<SleepBloc>().add(const RefreshSleep()),
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Log Sleep'),
              Tab(text: 'Trends'),
              Tab(text: 'Goals'),
            ],
          ),
        ),
        body: Column(
          children: [
            if (widget.state.isLoading || widget.state.busyAction != null)
              const LinearProgressIndicator(minHeight: 2),
            Expanded(
              child: TabBarView(
                children: [
                  _OverviewTab(state: widget.state, stats: stats),
                  _SleepLogTab(
                    state: widget.state,
                    onDateChanged: (date) => context
                        .read<SleepBloc>()
                        .add(SleepDateSelected(date)),
                  ),
                  _TrendsTab(sessions: widget.state.sessions),
                  _GoalsTab(
                    goals: _SleepGoalValues(
                      targetSleepDuration: _targetSleepDuration,
                      targetBedtime: _targetBedtime,
                      targetWakeTime: _targetWakeTime,
                    ),
                    stats: stats,
                    onDurationChanged: (value) =>
                        setState(() => _targetSleepDuration = value),
                    onBedtimeChanged: (value) =>
                        setState(() => _targetBedtime = value),
                    onWakeTimeChanged: (value) =>
                        setState(() => _targetWakeTime = value),
                  ),
                ],
              ),
            ),
          ],
        ),
          ),
        ),
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({
    required this.state,
    required this.stats,
  });

  final SleepState state;
  final SleepStats? stats;

  @override
  Widget build(BuildContext context) {
    final recent = getRecentSleepSessions(state.sessions);
    return RefreshIndicator(
      onRefresh: () async {
        final bloc = context.read<SleepBloc>();
        bloc.add(const RefreshSleep());
        await bloc.stream.firstWhere(
          (next) =>
              next.status == SleepStatus.loaded ||
              next.status == SleepStatus.failure,
        );
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
         padding: AppResponsive.pagePadding(context).add(
           const EdgeInsets.only(top: 18, bottom: 32),
         ),
        children: [
          Row(
            children: const [
              CircleAvatar(
                radius: 25,
                backgroundColor: Color(0xFFDBEAFE),
                foregroundColor: Color(0xFF2563EB),
                child: Icon(Icons.nightlight_round, size: 28),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Sleep Routine',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      'Monitor your sleep patterns and rest quality',
                      style: TextStyle(color: Color(0xFF6B7280)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _StatsGrid(stats: stats),
          const SizedBox(height: 18),
          Card(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Recent Sleep Sessions',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      OutlinedButton.icon(
                        onPressed: () => DefaultTabController.of(context)
                            .animateTo(1),
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Log Sleep'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (recent.isEmpty)
                    _EmptySleepHistory(
                      onAdd: () =>
                          DefaultTabController.of(context).animateTo(1),
                    )
                  else
                    ...recent.map(
                      (session) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _SleepHistoryCard(session: session),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.stats});

  final SleepStats? stats;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: AppResponsive.gridColumns(
        context,
        minimumItemWidth: 170,
        compactColumns: 1,
        mediumColumns: 2,
        wideColumns: 2,
      ),
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: AppResponsive.isCompact(context) ? 2.25 : 1.65,
      children: [
        _StatCard(
          title: 'Avg Sleep Duration',
          value: stats == null ? '--' : _formatDuration(stats!.avgSleepDuration),
          subtitle: 'Last 7 days',
          icon: Icons.nightlight_round,
        ),
        _StatCard(
          title: 'Sleep Score',
          value: stats?.avgSleepScore == null
              ? '--'
              : '${stats!.avgSleepScore}/100',
          subtitle: 'Average quality',
          icon: Icons.star_outline,
        ),
        _StatCard(
          title: 'Sleep Efficiency',
          value: stats?.avgEfficiency == null
              ? '--'
              : '${stats!.avgEfficiency}%',
          subtitle: 'Time asleep vs time in bed',
          icon: Icons.trending_up,
        ),
        _StatCard(
          title: 'Goal Progress',
          value: stats?.goalProgress == null
              ? '--'
              : '${stats!.goalProgress}%',
          subtitle: 'Average vs target',
          icon: Icons.track_changes,
          progress: stats?.goalProgress,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.icon,
    this.progress,
  });

  final String title;
  final String value;
  final String subtitle;
  final IconData icon;
  final int? progress;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF4B5563),
                    ),
                  ),
                ),
                Icon(icon, size: 17, color: const Color(0xFF6B7280)),
              ],
            ),
            const Spacer(),
            Text(
              value,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            if (progress != null)
              LinearProgressIndicator(
                value: (progress!.clamp(0, 100)) / 100,
                minHeight: 4,
                borderRadius: BorderRadius.circular(4),
              ),
            const SizedBox(height: 3),
            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 10,
                color: Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SleepHistoryCard extends StatelessWidget {
  const _SleepHistoryCard({required this.session});

  final SleepSessionModel session;

  @override
  Widget build(BuildContext context) {
    final sleepDate = _parseDateOnly(session.sleepDate);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) => constraints.maxWidth < 430
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    const CircleAvatar(
                      radius: 19,
                      backgroundColor: Color(0xFFDBEAFE),
                      foregroundColor: Color(0xFF2563EB),
                      child: Icon(Icons.nightlight_round, size: 19),
                    ),
                    const SizedBox(width: 10),
                    Expanded(child: _SleepHistorySummary(session: session)),
                  ]),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 12,
                    runSpacing: 8,
                    children: [
                      _SleepMetric(
                        value: _formatDuration(session.totalSleepDuration),
                        label: 'Duration',
                      ),
                      _SleepMetric(
                        value: session.sleepScore == null
                            ? '--'
                            : '${session.sleepScore}/100',
                        label: 'Score',
                      ),
                      if (_hasText(session.quality))
                        _QualityBadge(quality: session.quality!),
                      IconButton(
                        tooltip: 'Delete sleep log',
                        onPressed: () => _confirmDelete(context, session),
                        icon: const Icon(Icons.delete_outline,
                            color: Color(0xFFDC2626)),
                      ),
                    ],
                  ),
                ],
              )
            : Row(
        children: [
          const CircleAvatar(
            radius: 19,
            backgroundColor: Color(0xFFDBEAFE),
            foregroundColor: Color(0xFF2563EB),
            child: Icon(Icons.nightlight_round, size: 19),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      _formatDate(sleepDate),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    if (DateUtils.isSameDay(sleepDate, DateTime.now()))
                      const Padding(
                        padding: EdgeInsets.only(left: 8),
                        child: _SmallBadge(
                          label: 'Today',
                          background: Color(0xFFE0F2FE),
                          foreground: Color(0xFF0369A1),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  '${_formatTime(session.bedtime)} - '
                  '${_formatTime(session.wakeTime)}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _formatDuration(session.totalSleepDuration),
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              const Text(
                'Duration',
                style: TextStyle(fontSize: 10, color: Color(0xFF6B7280)),
              ),
            ],
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                session.sleepScore == null ? '--' : '${session.sleepScore}/100',
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              const Text(
                'Score',
                style: TextStyle(fontSize: 10, color: Color(0xFF6B7280)),
              ),
            ],
          ),
          if (_hasText(session.quality)) ...[
            const SizedBox(width: 8),
            _QualityBadge(quality: session.quality!),
          ],
          IconButton(
            tooltip: 'Delete sleep log',
            onPressed: () => _confirmDelete(context, session),
            icon: const Icon(
              Icons.delete_outline,
              color: Color(0xFFDC2626),
            ),
          ),
        ],
      ),
      ),
    );
  }
}

class _SleepHistorySummary extends StatelessWidget {
  const _SleepHistorySummary({required this.session});

  final SleepSessionModel session;

  @override
  Widget build(BuildContext context) {
    final date = _parseDateOnly(session.sleepDate);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text(_formatDate(date),
                style: const TextStyle(fontWeight: FontWeight.w700)),
            if (DateUtils.isSameDay(date, DateTime.now()))
              const _SmallBadge(
                label: 'Today',
                background: Color(0xFFE0F2FE),
                foreground: Color(0xFF0369A1),
              ),
          ],
        ),
        const SizedBox(height: 3),
        Text(
          '${_formatTime(session.bedtime)} - ${_formatTime(session.wakeTime)}',
          style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
        ),
      ],
    );
  }
}

class _SleepMetric extends StatelessWidget {
  const _SleepMetric({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
          Text(label,
              style: const TextStyle(fontSize: 10, color: Color(0xFF6B7280))),
        ],
      );
}

class _SleepLogTab extends StatefulWidget {
  const _SleepLogTab({
    required this.state,
    required this.onDateChanged,
  });

  final SleepState state;
  final ValueChanged<DateTime> onDateChanged;

  @override
  State<_SleepLogTab> createState() => _SleepLogTabState();
}

class _SleepLogTabState extends State<_SleepLogTab> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _dateController;
  late TextEditingController _notesController;
  DateTime? _bedtime;
  DateTime? _sleepTime;
  DateTime? _wakeTime;
  String _quality = '';
  DateTime? _formDate;
  int? _loadedSessionId;
  String? _validationError;

  @override
  void initState() {
    super.initState();
    _dateController = TextEditingController();
    _notesController = TextEditingController();
    _syncFromState();
  }

  @override
  void didUpdateWidget(covariant _SleepLogTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    final oldId = oldWidget.state.dailySession?.id;
    final newId = widget.state.dailySession?.id;
    if (oldId != newId ||
        oldWidget.state.activeDate != widget.state.activeDate) {
      _syncFromState();
    }
  }

  void _syncFromState() {
    final session = widget.state.dailySession;
    final date = session == null
        ? widget.state.activeDate
        : _parseDateOnly(session.sleepDate);
    _formDate = date;
    _dateController.text = _dateOnly(date);
    _notesController.text = session?.notes ?? '';
    _bedtime = session?.bedtime;
    _sleepTime = session?.sleepTime;
    _wakeTime = session?.wakeTime;
    _quality = session?.quality ?? '';
    _loadedSessionId = session?.id;
    _validationError = null;
  }

  @override
  void dispose() {
    _dateController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasExisting = widget.state.dailySession != null;
    return ListView(
       padding: AppResponsive.pagePadding(context).add(
         const EdgeInsets.only(top: 18, bottom: 32),
       ),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Log Sleep Session',
                    style: const TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _dateController,
                          readOnly: true,
                          decoration: const InputDecoration(
                            labelText: 'Sleep Date',
                            suffixIcon: Icon(Icons.calendar_today_outlined),
                          ),
                          onTap: _pickDate,
                           validator: sleepDateValidationError,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _quality.isEmpty ? null : _quality,
                          decoration:
                              const InputDecoration(labelText: 'Sleep Quality'),
                          items: const [
                            DropdownMenuItem(
                              value: 'excellent',
                              child: Text('Excellent'),
                            ),
                            DropdownMenuItem(
                              value: 'good',
                              child: Text('Good'),
                            ),
                            DropdownMenuItem(
                              value: 'fair',
                              child: Text('Fair'),
                            ),
                            DropdownMenuItem(
                              value: 'poor',
                              child: Text('Poor'),
                            ),
                          ],
                          onChanged: (value) =>
                              setState(() => _quality = value ?? ''),
                           validator: (value) =>
                               _hasText(value) ? null : 'Required',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _TimePickerField(
                    label: 'Bedtime',
                    value: _bedtime,
                    baseDate: _formDate,
                    onChanged: (value) => _setTime(
                      () => _bedtime = value,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _TimePickerField(
                    label: 'Time Fell Asleep',
                    value: _sleepTime,
                    baseDate: _formDate,
                    onChanged: (value) => _setTime(
                      () => _sleepTime = value,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _TimePickerField(
                    label: 'Wake Time',
                    value: _wakeTime,
                    baseDate: _formDate,
                    onChanged: (value) => _setTime(
                      () => _wakeTime = value,
                    ),
                  ),
                  if (_validationError != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _validationError!,
                      style: const TextStyle(
                        color: Color(0xFFB91C1C),
                        fontSize: 12,
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _notesController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Notes',
                      hintText:
                          'How did you feel? What might have affected your sleep?',
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: widget.state.busyAction != null ? null : _save,
                      icon: Icon(hasExisting ? Icons.save_outlined : Icons.add),
                      label: Text(
                        widget.state.busyAction != null
                            ? 'Saving...'
                            : 'Save Sleep Session',
                      ),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF16A34A),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _pickDate() async {
    final current = _formDate ?? DateTime.now();
    final today = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: current.isAfter(today) ? today : current,
      firstDate: DateTime(2000),
      lastDate: today,
    );
    if (!mounted || date == null) return;
    setState(() {
      _formDate = date;
      _dateController.text = _dateOnly(date);
      _validationError = _currentValidationError();
    });
    widget.onDateChanged(date);
  }

  Future<void> _pickTime(
    DateTime? current,
    ValueChanged<DateTime> onChanged,
  ) async {
    final selected = await showTimePicker(
      context: context,
      initialTime: current == null
          ? const TimeOfDay(hour: 22, minute: 0)
          : TimeOfDay.fromDateTime(current),
    );
    if (!mounted || selected == null) return;
    final date = _formDate ?? DateTime.now();
    onChanged(
      DateTime(
        date.year,
        date.month,
        date.day,
        selected.hour,
        selected.minute,
      ),
    );
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    if (_bedtime == null || _sleepTime == null || _wakeTime == null) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(content: Text('Please fill in all required fields.')),
        );
      return;
    }
    final date = _formDate ?? DateTime.now();
    final validationError = _currentValidationError();
    if (validationError != null) {
      setState(() => _validationError = validationError);
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(validationError)));
      return;
    }
    final input = SleepSessionInput(
      sleepDate: _dateOnly(date),
      bedtime: _bedtime,
      sleepTime: _sleepTime,
      wakeTime: _wakeTime,
      quality: _quality.isEmpty ? null : _quality,
      notes: _notesController.text,
    );
    final bloc = context.read<SleepBloc>();
    if (_loadedSessionId == null) {
      bloc.add(AddSleepSession(input));
    } else {
      bloc.add(UpdateSleepSession(id: _loadedSessionId!, input: input));
    }
  }

  void _setTime(void Function() update) {
    setState(() {
      update();
      _validationError = _currentValidationError();
    });
  }

  String? _currentValidationError() {
    return sleepDateValidationError(
          _formDate == null ? null : _dateOnly(_formDate!),
        ) ??
        sleepRoutineValidationError(_bedtime, _sleepTime, _wakeTime);
  }
}

class _TimePickerField extends StatelessWidget {
  const _TimePickerField({
    required this.label,
    required this.value,
    required this.baseDate,
    required this.onChanged,
  });

  final String label;
  final DateTime? value;
  final DateTime? baseDate;
  final ValueChanged<DateTime> onChanged;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () async {
        final selected = await showTimePicker(
          context: context,
          initialTime: value == null
              ? const TimeOfDay(hour: 22, minute: 0)
              : TimeOfDay.fromDateTime(value!),
        );
        if (!context.mounted || selected == null) return;
        final date = baseDate ?? value ?? DateTime.now();
        onChanged(
          DateTime(
            date.year,
            date.month,
            date.day,
            selected.hour,
            selected.minute,
          ),
        );
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.access_time_outlined),
        ),
        child: Text(value == null ? 'Not recorded' : _formatTime(value)),
      ),
    );
  }
}

class _TrendsTab extends StatelessWidget {
  const _TrendsTab({required this.sessions});

  final List<SleepSessionModel> sessions;

  @override
  Widget build(BuildContext context) {
    final ordered = sortSleepSessionsChronologically(sessions);
    return ListView(
       padding: AppResponsive.pagePadding(context).add(
         const EdgeInsets.only(top: 18, bottom: 32),
       ),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: ordered.isEmpty
                ? const _EmptyCard(
                    icon: Icons.bar_chart_outlined,
                    title: 'Not enough data to show trends',
                    subtitle: 'Log at least 3 sleep sessions to see trends.',
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Sleep Trends',
                        style: TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 18),
                      const Text(
                        'Sleep Duration Trend',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      ...ordered.map(
                        (session) => _DurationTrendRow(session: session),
                      ),
                      const SizedBox(height: 22),
                      const Text(
                        'Sleep Quality Trend',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      ...ordered.map(
                        (session) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 70,
                                child: Text(
                                  _formatShortDate(
                                    _parseDateOnly(session.sleepDate),
                                  ),
                                  style: const TextStyle(fontSize: 12),
                                ),
                              ),
                              _QualityBadge(
                                quality: session.quality ?? 'Not rated',
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}

class _DurationTrendRow extends StatelessWidget {
  const _DurationTrendRow({required this.session});

  final SleepSessionModel session;

  @override
  Widget build(BuildContext context) {
    final minutes = session.totalSleepDuration ?? 0;
    final barWidth = (minutes / 600 * 100).clamp(0, 100).toDouble();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            width: 70,
            child: Text(
              _formatShortDate(_parseDateOnly(session.sleepDate)),
              style: const TextStyle(fontSize: 12),
            ),
          ),
          Expanded(
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(
                height: 8,
                width: barWidth,
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6),
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
            ),
          ),
          SizedBox(
            width: 44,
            child: Text(
              minutes == 0 ? '--' : '${(minutes / 60).round()}h',
              textAlign: TextAlign.right,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _GoalsTab extends StatelessWidget {
  const _GoalsTab({
    required this.goals,
    required this.stats,
    required this.onDurationChanged,
    required this.onBedtimeChanged,
    required this.onWakeTimeChanged,
  });

  final _SleepGoalValues goals;
  final SleepStats? stats;
  final ValueChanged<int> onDurationChanged;
  final ValueChanged<String> onBedtimeChanged;
  final ValueChanged<String> onWakeTimeChanged;

  @override
  Widget build(BuildContext context) {
    final progress = stats?.goalProgress ?? 0;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 32),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Sleep Goals',
                  style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 18),
                DropdownButtonFormField<int>(
                  value: goals.targetSleepDuration,
                  decoration:
                      const InputDecoration(labelText: 'Target Sleep Duration'),
                  items: const [
                    DropdownMenuItem(value: 420, child: Text('7 hours')),
                    DropdownMenuItem(value: 450, child: Text('7.5 hours')),
                    DropdownMenuItem(value: 480, child: Text('8 hours')),
                    DropdownMenuItem(value: 510, child: Text('8.5 hours')),
                    DropdownMenuItem(value: 540, child: Text('9 hours')),
                  ],
                  onChanged: (value) {
                    if (value != null) onDurationChanged(value);
                  },
                ),
                const SizedBox(height: 12),
                _GoalTimeField(
                  label: 'Target Bedtime',
                  value: goals.targetBedtime,
                  onChanged: onBedtimeChanged,
                ),
                const SizedBox(height: 12),
                _GoalTimeField(
                  label: 'Target Wake Time',
                  value: goals.targetWakeTime,
                  onChanged: onWakeTimeChanged,
                ),
                if (stats != null) ...[
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Progress This Week',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Sleep Duration Goal'),
                            Text(
                               '$progress%',
                              style:
                                  const TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        LinearProgressIndicator(
                           value: progress.clamp(0, 100) / 100,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Average: '
                          '${_formatDuration(stats!.weeklyAvgSleepDuration)} / '
                          'Target: ${_formatDuration(goals.targetSleepDuration)}',
                          style: const TextStyle(color: Color(0xFF4B5563)),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _GoalTimeField extends StatelessWidget {
  const _GoalTimeField({
    required this.label,
    required this.value,
    required this.onChanged,
  });

  final String label;
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final parts = value.split(':');
    final hour = int.tryParse(parts.first) ?? 22;
    final minute = int.tryParse(parts.length > 1 ? parts[1] : '0') ?? 0;
    return InkWell(
      onTap: () async {
        final picked = await showTimePicker(
          context: context,
          initialTime: TimeOfDay(hour: hour, minute: minute),
        );
        if (picked == null) return;
        onChanged(
          '${picked.hour.toString().padLeft(2, '0')}:'
          '${picked.minute.toString().padLeft(2, '0')}',
        );
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.access_time_outlined),
        ),
        child: Text(value),
      ),
    );
  }
}

class _SmallBadge extends StatelessWidget {
  const _SmallBadge({
    required this.label,
    required this.background,
    required this.foreground,
  });

  final String label;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: foreground,
        ),
      ),
    );
  }
}

class _QualityBadge extends StatelessWidget {
  const _QualityBadge({required this.quality});

  final String quality;

  @override
  Widget build(BuildContext context) {
    final colors = switch (quality) {
      'excellent' => (const Color(0xFFDCFCE7), const Color(0xFF166534)),
      'good' => (const Color(0xFFDBEAFE), const Color(0xFF1E40AF)),
      'fair' => (const Color(0xFFFEF3C7), const Color(0xFF92400E)),
      'poor' => (const Color(0xFFFEE2E2), const Color(0xFF991B1B)),
      _ => (const Color(0xFFF3F4F6), const Color(0xFF374151)),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: colors.$1,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        quality,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: colors.$2,
        ),
      ),
    );
  }
}

class _EmptySleepHistory extends StatelessWidget {
  const _EmptySleepHistory({required this.onAdd});

  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 22),
      child: Column(
        children: [
          const Icon(
            Icons.nightlight_outlined,
            size: 48,
            color: Color(0xFF9CA3AF),
          ),
          const SizedBox(height: 8),
          const Text(
            'No sleep sessions recorded yet',
            style: TextStyle(color: Color(0xFF6B7280)),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: onAdd,
            child: const Text('Log your first sleep session'),
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
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 26),
      child: Column(
        children: [
          Icon(icon, size: 46, color: const Color(0xFF9CA3AF)),
          const SizedBox(height: 10),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: Color(0xFF4B5563),
            ),
          ),
          const SizedBox(height: 5),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
          ),
        ],
      ),
    );
  }
}

class _SleepLoading extends StatelessWidget {
  const _SleepLoading();

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
            child: Card(child: SizedBox(height: 72)),
          ),
        ),
      ],
    );
  }
}

class _SleepError extends StatelessWidget {
  const _SleepError({required this.message, required this.onRetry});

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
            const Icon(Icons.cloud_off_outlined,
                size: 48, color: Color(0xFF9CA3AF)),
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

class _SleepGoalValues {
  const _SleepGoalValues({
    required this.targetSleepDuration,
    required this.targetBedtime,
    required this.targetWakeTime,
  });

  final int targetSleepDuration;
  final String targetBedtime;
  final String targetWakeTime;
}

SleepStats? _calculateStats(
  List<SleepSessionModel> sessions,
  int targetSleepDuration,
  {
    String? referenceDate,
  }
) =>
    calculateSleepStats(
      sessions,
      targetSleepDuration: targetSleepDuration,
      referenceDate: referenceDate,
    );

Future<void> _confirmDelete(
  BuildContext context,
  SleepSessionModel session,
) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Are you sure you want to delete this log?'),
      content: const Text('This action cannot be undone.'),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(true),
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFFDC2626),
          ),
          child: const Text('Delete'),
        ),
      ],
    ),
  );
  if (confirmed == true && context.mounted) {
    context.read<SleepBloc>().add(DeleteSleepSession(session.id));
  }
}

DateTime _parseDateOnly(String value) => DateTime.tryParse(value) ?? DateTime.now();

String _dateOnly(DateTime value) =>
    '${value.year.toString().padLeft(4, '0')}-'
    '${value.month.toString().padLeft(2, '0')}-'
    '${value.day.toString().padLeft(2, '0')}';

String _formatDate(DateTime date) =>
    '${_monthName(date.month).substring(0, 3)} ${date.day}, ${date.year}';

String _formatShortDate(DateTime date) =>
    '${_monthName(date.month).substring(0, 3)} ${date.day}';

String _formatDuration(int? minutes) {
  if (minutes == null || minutes == 0) return '--';
  final hours = minutes ~/ 60;
  final mins = minutes % 60;
  return '${hours}h ${mins}m';
}

String _formatTime(DateTime? date) {
  if (date == null) return '--';
  final hour = date.hour == 0 ? 12 : date.hour > 12 ? date.hour - 12 : date.hour;
  final minute = date.minute.toString().padLeft(2, '0');
  return '$hour:$minute ${date.hour >= 12 ? 'PM' : 'AM'}';
}

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

bool _hasText(String? value) => value != null && value.trim().isNotEmpty;