import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../bloc/mood_bloc.dart';
import '../bloc/mood_event.dart';
import '../bloc/mood_state.dart';
import '../models/mood_entry_model.dart';

class MoodTrackingScreen extends StatefulWidget {
  const MoodTrackingScreen({super.key});

  @override
  State<MoodTrackingScreen> createState() => _MoodTrackingScreenState();
}

class _MoodTrackingScreenState extends State<MoodTrackingScreen> {
  final _notesController = TextEditingController();
  int? _selectedMood;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<MoodBloc, MoodState>(
      listener: (context, state) {
        if (state.sessionInvalid) {
          context.read<AuthBloc>().add(const CheckAuthentication());
          return;
        }

        if (state.actionMessage != null && state.actionMessage!.isNotEmpty) {
          if (state.actionMessage!.startsWith('Mood recorded')) {
            setState(() {
              _selectedMood = null;
              _notesController.clear();
            });
          }
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(content: Text(state.actionMessage!)),
            );
        } else if (state.errorMessage != null &&
            state.errorMessage!.isNotEmpty) {
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: const Color(0xFFB91C1C),
              ),
            );
        }
      },
      builder: (context, state) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Mood Log'),
            actions: [
              IconButton(
                tooltip: 'Refresh mood history',
                onPressed: () =>
                    context.read<MoodBloc>().add(const RefreshMood()),
                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
          ),
          body: _MoodBody(
            state: state,
            selectedMood: _selectedMood,
            notesController: _notesController,
            onMoodSelected: (mood) => setState(() => _selectedMood = mood),
            onSubmit: _submitMood,
          ),
        );
      },
    );
  }

  void _submitMood() {
    final mood = _selectedMood;
    if (mood == null) return;
    context.read<MoodBloc>().add(
          AddMood(
            MoodEntryInput(
              mood: mood,
              notes: _notesController.text.trim(),
            ),
          ),
        );
  }
}

class _MoodBody extends StatelessWidget {
  const _MoodBody({
    required this.state,
    required this.selectedMood,
    required this.notesController,
    required this.onMoodSelected,
    required this.onSubmit,
  });

  final MoodState state;
  final int? selectedMood;
  final TextEditingController notesController;
  final ValueChanged<int> onMoodSelected;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    if (state.isLoading && !state.hasData) {
      return const _MoodLoading();
    }

    if (state.status == MoodStatus.failure && !state.hasData) {
      return _MoodError(
        message: state.errorMessage ?? 'Unable to load your mood history.',
        onRetry: () => context.read<MoodBloc>().add(const RefreshMood()),
      );
    }

    final recentEntries = [...state.entries]
      ..sort((a, b) => _dateValue(b.entryDate).compareTo(_dateValue(a.entryDate)));

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFFFDF2F8),
            Color(0xFFF5F3FF),
            Color(0xFFEFF6FF),
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
            if (state.isLoading) const LinearProgressIndicator(),
            if (state.isLoading) const SizedBox(height: 12),
            const _MoodHeader(),
            _MoodSummary(state: state),
            const SizedBox(height: 16),
            _DailyCheckInCard(
              state: state,
              selectedMood: selectedMood,
              notesController: notesController,
              onMoodSelected: onMoodSelected,
              onSubmit: onSubmit,
            ),
            const SizedBox(height: 16),
            _MoodHistory(entries: recentEntries.take(7).toList()),
          ],
        ),
      ),
    );
  }

  Future<void> _refresh(BuildContext context) async {
    final bloc = context.read<MoodBloc>();
    bloc.add(const RefreshMood());
    await bloc.stream.firstWhere(
      (nextState) =>
          (nextState.status == MoodStatus.loaded ||
              nextState.status == MoodStatus.failure) &&
          !nextState.isSubmitting,
    );
  }
}

class _MoodHeader extends StatelessWidget {
  const _MoodHeader();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Track how you feel',
            style: TextStyle(
              color: Color(0xFF111827),
              fontSize: 25,
              fontWeight: FontWeight.w800,
            ),
          ),
          SizedBox(height: 5),
          Text(
            'A quick daily check-in helps you notice patterns over time.',
            style: TextStyle(color: Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }
}

class _MoodSummary extends StatelessWidget {
  const _MoodSummary({required this.state});

  final MoodState state;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _MoodSummaryCard(
            label: "Today's mood",
            value: state.todayMood == null
                ? '❓'
                : _moodOption(state.todayMood!.mood).emoji,
            color: const Color(0xFF9333EA),
            icon: Icons.favorite_rounded,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _MoodSummaryCard(
            label: 'Average mood',
            value: '${state.averageMood.toStringAsFixed(1)}/5',
            color: const Color(0xFFF59E0B),
            icon: Icons.trending_up_rounded,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _MoodSummaryCard(
            label: 'Check-ins',
            value: '${state.entries.length}',
            color: const Color(0xFF16A34A),
            icon: Icons.calendar_month_rounded,
          ),
        ),
      ],
    );
  }
}

class _MoodSummaryCard extends StatelessWidget {
  const _MoodSummaryCard({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  final String label;
  final String value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 108,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border(top: BorderSide(color: color, width: 4)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 5),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF6B7280),
              fontSize: 10,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 19,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _DailyCheckInCard extends StatelessWidget {
  const _DailyCheckInCard({
    required this.state,
    required this.selectedMood,
    required this.notesController,
    required this.onMoodSelected,
    required this.onSubmit,
  });

  final MoodState state;
  final int? selectedMood;
  final TextEditingController notesController;
  final ValueChanged<int> onMoodSelected;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final todayMood = state.todayMood;
    final isRequired = state.isMoodRequired;

    return Card(
      elevation: 0,
      color: isRequired ? const Color(0xFFFFF7ED) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
        side: BorderSide(
          color: isRequired
              ? const Color(0xFFFCA5A5)
              : const Color(0xFFE9D5FF),
          width: isRequired ? 1.5 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: todayMood != null
            ? _CompletedCheckIn(entry: todayMood)
            : _CheckInForm(
                isRequired: isRequired,
                selectedMood: selectedMood,
                notesController: notesController,
                isSubmitting: state.isSubmitting,
                onMoodSelected: onMoodSelected,
                onSubmit: onSubmit,
              ),
      ),
    );
  }
}

class _CompletedCheckIn extends StatelessWidget {
  const _CompletedCheckIn({required this.entry});

  final MoodEntryModel entry;

  @override
  Widget build(BuildContext context) {
    final option = _moodOption(entry.mood);
    return Column(
      children: [
        Text(option.emoji, style: const TextStyle(fontSize: 58)),
        const SizedBox(height: 7),
        Text(
          "You're feeling ${option.label}",
          style: const TextStyle(
            color: Color(0xFF111827),
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 5),
        const Text(
          "You've already checked in today!",
          style: TextStyle(color: Color(0xFF6B7280)),
        ),
        const SizedBox(height: 5),
        const Text(
          'Come back tomorrow for your next daily check-in.',
          style: TextStyle(
            color: Color(0xFF9333EA),
            fontSize: 12,
          ),
        ),
        if (entry.notes != null) ...[
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F3FF),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '"${entry.notes}"',
              style: const TextStyle(
                color: Color(0xFF4B5563),
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _CheckInForm extends StatelessWidget {
  const _CheckInForm({
    required this.isRequired,
    required this.selectedMood,
    required this.notesController,
    required this.isSubmitting,
    required this.onMoodSelected,
    required this.onSubmit,
  });

  final bool isRequired;
  final int? selectedMood;
  final TextEditingController notesController;
  final bool isSubmitting;
  final ValueChanged<int> onMoodSelected;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.favorite_rounded, color: Color(0xFF9333EA)),
            const SizedBox(width: 8),
            const Expanded(
              child: Text(
                'How are you feeling today?',
                style: TextStyle(
                  color: Color(0xFF111827),
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            if (isRequired)
              const _RequiredBadge(),
          ],
        ),
        if (isRequired) ...[
          const SizedBox(height: 8),
          const Text(
            'Daily mood check-in is available from navigation and is not blocking.',
            style: TextStyle(
              color: Color(0xFFB91C1C),
              fontSize: 12,
            ),
          ),
        ],
        const SizedBox(height: 18),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: _moodOptions
              .map(
                (option) => Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: _MoodChoice(
                      option: option,
                      selected: selectedMood == option.value,
                      onTap: () => onMoodSelected(option.value),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 18),
        TextField(
          controller: notesController,
          minLines: 2,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'Notes (optional)',
            hintText: 'Tell us more about how you are feeling...',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: selectedMood == null || isSubmitting ? null : onSubmit,
            child: isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Record Mood'),
          ),
        ),
      ],
    );
  }
}

class _RequiredBadge extends StatelessWidget {
  const _RequiredBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Text(
        'Required',
        style: TextStyle(
          color: Color(0xFFB91C1C),
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _MoodChoice extends StatelessWidget {
  const _MoodChoice({
    required this.option,
    required this.selected,
    required this.onTap,
  });

  final MoodOption option;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFF5F3FF) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected
                ? const Color(0xFF9333EA)
                : const Color(0xFFE5E7EB),
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Text(option.emoji, style: const TextStyle(fontSize: 25)),
            const SizedBox(height: 4),
            Text(
              option.label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF6B7280),
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MoodHistory extends StatelessWidget {
  const _MoodHistory({required this.entries});

  final List<MoodEntryModel> entries;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Recent check-ins',
              style: TextStyle(
                color: Color(0xFF111827),
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            if (entries.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: Text(
                    'No mood entries yet',
                    style: TextStyle(color: Color(0xFF6B7280)),
                  ),
                ),
              )
            else
              ...entries.map((entry) => _MoodHistoryRow(entry: entry)),
          ],
        ),
      ),
    );
  }
}

class _MoodHistoryRow extends StatelessWidget {
  const _MoodHistoryRow({required this.entry});

  final MoodEntryModel entry;

  @override
  Widget build(BuildContext context) {
    final option = _moodOption(entry.mood);
    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(option.emoji, style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      option.label,
                      style: const TextStyle(
                        color: Color(0xFF111827),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatTimeAgo(entry.entryDate),
                      style: const TextStyle(
                        color: Color(0xFF6B7280),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
                if (entry.notes != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    '"${entry.notes}"',
                    style: const TextStyle(
                      color: Color(0xFF6B7280),
                      fontSize: 13,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MoodLoading extends StatelessWidget {
  const _MoodLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          height: 34,
          width: 200,
          margin: const EdgeInsets.only(bottom: 16),
          color: const Color(0xFFE5E7EB),
        ),
        Container(height: 110, color: const Color(0xFFE5E7EB)),
        const SizedBox(height: 16),
        Container(height: 310, color: const Color(0xFFE5E7EB)),
      ],
    );
  }
}

class _MoodError extends StatelessWidget {
  const _MoodError({
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
              'We could not load your mood history.',
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

class MoodOption {
  const MoodOption({
    required this.value,
    required this.emoji,
    required this.label,
  });

  final int value;
  final String emoji;
  final String label;
}

const _moodOptions = [
  MoodOption(value: 1, emoji: '😢', label: 'Very Sad'),
  MoodOption(value: 2, emoji: '😐', label: 'Okay'),
  MoodOption(value: 3, emoji: '😊', label: 'Good'),
  MoodOption(value: 4, emoji: '😃', label: 'Great'),
  MoodOption(value: 5, emoji: '🤩', label: 'Amazing'),
];

MoodOption _moodOption(int value) {
  return _moodOptions.firstWhere(
    (option) => option.value == value,
    orElse: () => const MoodOption(value: 0, emoji: '❓', label: 'Unknown'),
  );
}

int _dateValue(DateTime? date) => date?.millisecondsSinceEpoch ?? 0;

String _formatTimeAgo(DateTime? date) {
  if (date == null) return 'Unknown date';
  final diff = DateTime.now().difference(date.toLocal());
  if (diff.inHours < 1) return 'Just now';
  if (diff.inHours < 24) {
    return '${diff.inHours} hour${diff.inHours > 1 ? 's' : ''} ago';
  }
  return '${diff.inDays} day${diff.inDays > 1 ? 's' : ''} ago';
}