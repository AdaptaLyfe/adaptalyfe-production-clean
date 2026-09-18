import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/layout/responsive.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../bloc/skills_bloc.dart';
import '../bloc/skills_event.dart';
import '../bloc/skills_state.dart';
import '../models/skill_models.dart';

class SkillsScreen extends StatefulWidget {
  const SkillsScreen({super.key});

  @override
  State<SkillsScreen> createState() => _SkillsScreenState();
}

class _SkillsScreenState extends State<SkillsScreen> {
  String _category = 'all';

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<SkillsBloc, SkillsState>(
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
        if (state.isLoading && !state.hasSkills) {
          return const Scaffold(
            appBar: _SkillsAppBar(),
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (state.status == SkillsStatus.failure && !state.hasSkills) {
          return Scaffold(
            appBar: const _SkillsAppBar(),
            body: _SkillsError(
              message: state.errorMessage ?? 'Unable to load your skills.',
              onRetry: () =>
                  context.read<SkillsBloc>().add(const RefreshSkills()),
            ),
          );
        }

        final visibleSkills = _category == 'all'
            ? state.skills
            : state.skills
                .where((skill) => skill.skillCategory == _category)
                .toList();
        const categories = [
          'all',
          'academic',
          'social',
          'independent_living',
          'career',
          'personal',
          'health',
        ];

        return Scaffold(
          appBar: const _SkillsAppBar(),
          body: RefreshIndicator(
            onRefresh: () async {
              final bloc = context.read<SkillsBloc>();
              bloc.add(const RefreshSkills());
              await bloc.stream.firstWhere(
                (next) =>
                    next.status == SkillsStatus.loaded ||
                    next.status == SkillsStatus.failure,
              );
            },
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: AppResponsive.pagePadding(context).add(
                const EdgeInsets.only(top: 18, bottom: 32),
              ),
              children: [
                const Text(
                  'Skills & Milestones',
                  style: TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 5),
                const Text(
                  'Track your progress in life skills, set goals, and celebrate achievements.',
                  style: TextStyle(color: Color(0xFF6B7280)),
                ),
                const SizedBox(height: 18),
                _SkillsStats(state: state),
                const SizedBox(height: 18),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final categoryFilter = DropdownButtonFormField<String>(
                      value: categories.contains(_category) ? _category : 'all',
                      decoration: const InputDecoration(
                        labelText: 'Category',
                        prefixIcon: Icon(Icons.filter_list_rounded),
                      ),
                      items: categories
                          .map(
                            (category) => DropdownMenuItem(
                              value: category,
                              child: Text(_categoryLabel(category)),
                            ),
                          )
                          .toList(),
                      onChanged: (value) =>
                          setState(() => _category = value ?? 'all'),
                    );
                    final addButton = FilledButton.icon(
                      onPressed: state.busyKey == 'create'
                          ? null
                          : () => _addSkill(context),
                      icon: const Icon(Icons.add),
                      label: const Text('Add Skill Milestone'),
                    );

                    if (constraints.maxWidth < 520) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          categoryFilter,
                          const SizedBox(height: 10),
                          addButton,
                        ],
                      );
                    }

                    return Row(
                      children: [
                        Expanded(child: categoryFilter),
                        const SizedBox(width: 12),
                        addButton,
                      ],
                    );
                  },
                ),
                const SizedBox(height: 16),
                if (visibleSkills.isEmpty)
                  const _EmptySkills()
                else
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final columns = constraints.maxWidth >= 980
                          ? 3
                          : constraints.maxWidth >= 620
                              ? 2
                              : 1;
                      const gap = 12.0;
                      final cardWidth = columns == 1
                          ? constraints.maxWidth
                          : (constraints.maxWidth - gap * (columns - 1)) /
                              columns;
                      return Wrap(
                        spacing: gap,
                        runSpacing: gap,
                        children: visibleSkills
                            .map(
                              (skill) => SizedBox(
                                width: cardWidth,
                                child: _SkillCard(
                                  skill: skill,
                                  busy: state.busyKey == 'skill-${skill.id}',
                                  onEdit: () => _editSkill(context, skill),
                                  onDelete: () => _deleteSkill(context, skill),
                                  onProgress: (level) =>
                                      context.read<SkillsBloc>().add(
                                    UpdateSkillProgress(
                                      skillId: skill.id,
                                      currentLevel: level,
                                    ),
                                  ),
                                ),
                              ),
                            )
                            .toList(),
                      );
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _addSkill(BuildContext context) async {
    final input = await showDialog<TransitionSkillInput>(
      context: context,
      builder: (_) => const _SkillFormDialog(),
    );
    if (input != null && context.mounted) {
      context.read<SkillsBloc>().add(CreateSkill(input));
    }
  }

  Future<void> _editSkill(
    BuildContext context,
    TransitionSkillModel skill,
  ) async {
    final input = await showDialog<TransitionSkillInput>(
      context: context,
      builder: (_) => _SkillFormDialog(skill: skill),
    );
    if (input != null && context.mounted) {
      context.read<SkillsBloc>().add(
            UpdateSkill(skillId: skill.id, input: input),
          );
    }
  }

  Future<void> _deleteSkill(
    BuildContext context,
    TransitionSkillModel skill,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete skill milestone?'),
        content: Text(
          'Delete "${skill.skillName}"? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
            ),
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      context.read<SkillsBloc>().add(DeleteSkill(skill.id));
    }
  }
}

class _SkillsAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _SkillsAppBar();

  @override
  Widget build(BuildContext context) => AppBar(
        title: const Text('Skills & Milestones'),
        actions: [
          IconButton(
            tooltip: 'Refresh skills',
            onPressed: () =>
                context.read<SkillsBloc>().add(const RefreshSkills()),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      );

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _SkillsStats extends StatelessWidget {
  const _SkillsStats({required this.state});

  final SkillsState state;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth < 430 ? 2 : 3;
        final width =
            (constraints.maxWidth - ((columns - 1) * 8)) / columns;
        final cards = [
          _StatCard(
            icon: Icons.track_changes_rounded,
            label: 'Total Skills',
            value: '${state.skills.length}',
            color: const Color(0xFF2563EB),
          ),
          _StatCard(
            icon: Icons.check_circle_outline_rounded,
            label: 'Completed',
            value: '${state.completedCount}',
            color: const Color(0xFF16A34A),
          ),
          _StatCard(
            icon: Icons.trending_up_rounded,
            label: 'Average',
            value: '${state.averageProgress}%',
            color: const Color(0xFF7C3AED),
          ),
        ];

        return Wrap(
          spacing: 8,
          runSpacing: 8,
          children: cards
              .map((card) => SizedBox(width: width, child: card))
              .toList(),
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
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
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                color: Color(0xFF111827),
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }
}

class _SkillCard extends StatelessWidget {
  const _SkillCard({
    required this.skill,
    required this.busy,
    required this.onEdit,
    required this.onDelete,
    required this.onProgress,
  });

  final TransitionSkillModel skill;
  final bool busy;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final ValueChanged<int> onProgress;

  @override
  Widget build(BuildContext context) {
    final progress = skill.progressPercentage;
    final categoryColor = _categoryColor(skill.skillCategory);
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  backgroundColor: categoryColor.withOpacity(.12),
                  foregroundColor: categoryColor,
                  child: Icon(_categoryIcon(skill.skillCategory)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        skill.skillName,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        _categoryLabel(skill.skillCategory),
                        style: TextStyle(
                          color: categoryColor,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  onSelected: (value) {
                    if (value == 'edit') onEdit();
                    if (value == 'delete') onDelete();
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem(value: 'edit', child: Text('Edit')),
                    PopupMenuItem(value: 'delete', child: Text('Delete')),
                  ],
                ),
              ],
            ),
            if (skill.description != null) ...[
              const SizedBox(height: 12),
              Text(
                skill.description!,
                style: const TextStyle(color: Color(0xFF4B5563)),
              ),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                const Text(
                  'Progress',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const Spacer(),
                Text(
                  skill.isCompleted ? 'Completed' : 'In Progress',
                  style: TextStyle(
                    color: skill.isCompleted
                        ? const Color(0xFF16A34A)
                        : const Color(0xFF2563EB),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(
                value: progress / 100,
                minHeight: 8,
                backgroundColor: const Color(0xFFE5E7EB),
                valueColor: AlwaysStoppedAnimation(categoryColor),
              ),
            ),
            const SizedBox(height: 7),
            Row(
              children: [
                Text(
                  'Level ${skill.currentLevel}',
                  style: const TextStyle(
                    color: Color(0xFF4B5563),
                    fontSize: 12,
                  ),
                ),
                const Spacer(),
                Text(
                  'Target: ${skill.targetLevel}  •  $progress%',
                  style: const TextStyle(
                    color: Color(0xFF6B7280),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 13),
            Row(
              children: [
                OutlinedButton(
                  onPressed: busy || skill.currentLevel <= 1
                      ? null
                      : () => onProgress(skill.currentLevel - 1),
                  child: const Text('−'),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton(
                    onPressed: busy || skill.currentLevel >= skill.targetLevel
                        ? null
                        : () => onProgress(skill.currentLevel + 1),
                    child: Text(busy ? 'Updating…' : 'Update Progress'),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: busy || skill.currentLevel >= skill.targetLevel
                      ? null
                      : () => onProgress(skill.targetLevel),
                  child: const Text('Max'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SkillFormDialog extends StatefulWidget {
  const _SkillFormDialog({this.skill});

  final TransitionSkillModel? skill;

  @override
  State<_SkillFormDialog> createState() => _SkillFormDialogState();
}

class _SkillFormDialogState extends State<_SkillFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _currentController;
  late final TextEditingController _targetController;
  String _category = 'independent_living';
  String _priority = 'medium';

  static const _categories = [
    'academic',
    'social',
    'independent_living',
    'career',
    'personal',
    'health',
  ];
  static const _priorities = ['low', 'medium', 'high', 'critical'];

  @override
  void initState() {
    super.initState();
    final skill = widget.skill;
    _nameController = TextEditingController(text: skill?.skillName ?? '');
    _descriptionController =
        TextEditingController(text: skill?.description ?? '');
    _currentController = TextEditingController(
      text: '${skill?.currentLevel ?? 1}',
    );
    _targetController = TextEditingController(
      text: '${skill?.targetLevel ?? 5}',
    );
    _category = skill?.skillCategory ?? _category;
    _priority = skill?.priority ?? _priority;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _currentController.dispose();
    _targetController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.skill == null ? 'Add Skill Milestone' : 'Edit Skill'),
      content: SizedBox(
        width: 440,
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Skill name'),
                  validator: (value) =>
                      value == null || value.trim().isEmpty
                          ? 'Skill name is required.'
                          : null,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _category,
                  decoration: const InputDecoration(labelText: 'Category'),
                  items: _categories
                      .map(
                        (value) => DropdownMenuItem(
                          value: value,
                          child: Text(_categoryLabel(value)),
                        ),
                      )
                      .toList(),
                  onChanged: (value) =>
                      setState(() => _category = value ?? _category),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _currentController,
                        keyboardType: TextInputType.number,
                        decoration:
                            const InputDecoration(labelText: 'Current level'),
                        validator: (_) => _levelError(),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _targetController,
                        keyboardType: TextInputType.number,
                        decoration:
                            const InputDecoration(labelText: 'Target level'),
                        validator: (_) => _levelError(),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _priority,
                  decoration: const InputDecoration(labelText: 'Priority'),
                  items: _priorities
                      .map(
                        (value) => DropdownMenuItem(
                          value: value,
                          child: Text(value[0].toUpperCase() + value.substring(1)),
                        ),
                      )
                      .toList(),
                  onChanged: (value) =>
                      setState(() => _priority = value ?? _priority),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _descriptionController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Description (optional)',
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
          onPressed: _submit,
          child: Text(widget.skill == null ? 'Add Skill' : 'Save Changes'),
        ),
      ],
    );
  }

  String? _levelError() {
    final current = int.tryParse(_currentController.text);
    final target = int.tryParse(_targetController.text);
    if (current == null || target == null || current < 1 || target < 1) {
      return 'Enter levels from 1 to 10.';
    }
    if (current > 10 || target > 10) return 'Enter levels from 1 to 10.';
    if (current > target) return skillLevelRangeError;
    return null;
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    final input = TransitionSkillInput(
      skillCategory: _category,
      skillName: _nameController.text,
      description: _descriptionController.text,
      currentLevel: int.parse(_currentController.text),
      targetLevel: int.parse(_targetController.text),
      priority: _priority,
    );
    Navigator.of(context).pop(input);
  }
}

class _EmptySkills extends StatelessWidget {
  const _EmptySkills();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          children: const [
            Icon(Icons.track_changes_outlined, size: 46, color: Color(0xFF9CA3AF)),
            SizedBox(height: 10),
            Text(
              'No skill milestones yet',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17),
            ),
            SizedBox(height: 5),
            Text(
              'Add a skill goal to start tracking your progress.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }
}

class _SkillsError extends StatelessWidget {
  const _SkillsError({required this.message, required this.onRetry});

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

String _categoryLabel(String category) {
  if (category == 'all') return 'All categories';
  return category
      .split('_')
      .map((word) => word.isEmpty
          ? word
          : '${word[0].toUpperCase()}${word.substring(1)}')
      .join(' ');
}

IconData _categoryIcon(String category) {
  switch (category) {
    case 'academic':
      return Icons.menu_book_rounded;
    case 'social':
      return Icons.groups_rounded;
    case 'career':
      return Icons.work_outline_rounded;
    case 'personal':
      return Icons.favorite_outline_rounded;
    case 'health':
      return Icons.psychology_outlined;
    default:
      return Icons.home_work_outlined;
  }
}

Color _categoryColor(String category) {
  switch (category) {
    case 'academic':
      return const Color(0xFF2563EB);
    case 'social':
      return const Color(0xFF16A34A);
    case 'career':
      return const Color(0xFFEA580C);
    case 'personal':
      return const Color(0xFFDB2777);
    case 'health':
      return const Color(0xFF0D9488);
    default:
      return const Color(0xFF7C3AED);
  }
}