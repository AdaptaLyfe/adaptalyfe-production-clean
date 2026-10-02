import 'package:flutter/material.dart';

enum _FeatureCategory { basic, premium, family }

class _CatalogFeature {
  const _CatalogFeature({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    required this.category,
  });

  final String id;
  final String title;
  final String description;
  final IconData icon;
  final _FeatureCategory category;
}

class _CategoryFilter {
  const _CategoryFilter({
    required this.label,
    required this.category,
  });

  final String label;
  final _FeatureCategory? category;
}

class FeaturesScreen extends StatefulWidget {
  const FeaturesScreen({super.key});

  @override
  State<FeaturesScreen> createState() => _FeaturesScreenState();
}

class _FeaturesScreenState extends State<FeaturesScreen> {
  static const _features = <_CatalogFeature>[
    _CatalogFeature(
      id: 'daily-task-management',
      title: 'Daily Task Management',
      description:
          'Create and complete daily activities with categorized tasks and progress tracking',
      icon: Icons.check_box_outlined,
      category: _FeatureCategory.basic,
    ),
    _CatalogFeature(
      id: 'daily-checkins',
      title: 'Daily Check-ins',
      description: 'Simple 1–5 scale for personal reflection and mood tracking',
      icon: Icons.mood_outlined,
      category: _FeatureCategory.basic,
    ),
    _CatalogFeature(
      id: 'financial-tracking',
      title: 'Financial Tracking',
      description: 'Bill reminders, due-date alerts, and bill payment quick links',
      icon: Icons.attach_money_rounded,
      category: _FeatureCategory.basic,
    ),
    _CatalogFeature(
      id: 'appointment-management',
      title: 'Appointment Management',
      description: 'Track personal schedules, appointments, and reminders',
      icon: Icons.calendar_today_outlined,
      category: _FeatureCategory.basic,
    ),
    _CatalogFeature(
      id: 'trusted-contacts',
      title: 'Trusted Contacts',
      description: 'Quick access to saved contacts and your support network',
      icon: Icons.phone_outlined,
      category: _FeatureCategory.basic,
    ),
    _CatalogFeature(
      id: 'mobile-app-access',
      title: 'Mobile App Access',
      description: 'Full mobile functionality on iOS and Android',
      icon: Icons.phone_android_outlined,
      category: _FeatureCategory.basic,
    ),
    _CatalogFeature(
      id: 'email-support',
      title: 'Email Support',
      description: 'Standard customer assistance via email',
      icon: Icons.mail_outline_rounded,
      category: _FeatureCategory.basic,
    ),
    _CatalogFeature(
      id: 'usage-patterns',
      title: 'Usage Patterns & Progress Journals',
      description:
          'Track patterns and document your independence journey over time',
      icon: Icons.bar_chart_rounded,
      category: _FeatureCategory.premium,
    ),
    _CatalogFeature(
      id: 'personal-records',
      title: 'Personal Records',
      description:
          'Notes, medications, allergies, and sensitivities all in one place',
      icon: Icons.folder_shared_outlined,
      category: _FeatureCategory.premium,
    ),
    _CatalogFeature(
      id: 'skill-challenges-templates',
      title: 'Skill Challenges & Custom Task Templates',
      description:
          'Interactive challenges and personalized task templates for daily routines',
      icon: Icons.track_changes_outlined,
      category: _FeatureCategory.premium,
    ),
    _CatalogFeature(
      id: 'meal-planning',
      title: 'Meal Planning & Shopping Lists',
      description: 'Weekly meal plans, recipes, and grocery list management',
      icon: Icons.restaurant_outlined,
      category: _FeatureCategory.premium,
    ),
    _CatalogFeature(
      id: 'data-export-tutorials',
      title: 'Data Export & Guided Tutorials',
      description:
          'Export your data (JSON, CSV, PDF) with step-by-step skill tutorials',
      icon: Icons.download_outlined,
      category: _FeatureCategory.premium,
    ),
    _CatalogFeature(
      id: 'unlimited-tasks',
      title: 'Unlimited Daily Tasks & Trusted Contacts',
      description: 'No limits on daily tasks or how many trusted contacts you can add',
      icon: Icons.bolt_outlined,
      category: _FeatureCategory.premium,
    ),
    _CatalogFeature(
      id: 'expanded-achievements',
      title: 'Expanded Achievements & Rewards',
      description:
          'Unlock advanced gamification with badges, levels, and reward milestones',
      icon: Icons.emoji_events_outlined,
      category: _FeatureCategory.premium,
    ),
    _CatalogFeature(
      id: 'priority-email-support',
      title: 'Priority Email Support',
      description: 'Faster response times for premium subscribers',
      icon: Icons.mark_email_unread_outlined,
      category: _FeatureCategory.premium,
    ),
    _CatalogFeature(
      id: 'multiple-profiles',
      title: 'Up to 5 Individual User Profiles',
      description:
          'Manage multiple family members or care recipients under one plan',
      icon: Icons.person_add_alt_1_outlined,
      category: _FeatureCategory.family,
    ),
    _CatalogFeature(
      id: 'shared-dashboards',
      title: 'Shared Dashboards',
      description: 'Coordinated views for family members and caregivers',
      icon: Icons.dashboard_outlined,
      category: _FeatureCategory.family,
    ),
    _CatalogFeature(
      id: 'role-based-access',
      title: 'Role-Based Access Controls',
      description: 'Set permissions for caregivers, family, and care team roles',
      icon: Icons.key_outlined,
      category: _FeatureCategory.family,
    ),
    _CatalogFeature(
      id: 'in-app-messaging',
      title: 'In-App Messaging & Video Calls',
      description:
          'Stay connected with secure messaging and video communication',
      icon: Icons.video_call_outlined,
      category: _FeatureCategory.family,
    ),
    _CatalogFeature(
      id: 'granular-sharing',
      title: 'Granular Sharing & Security Controls',
      description:
          'Fine-grained control over what each family member can see',
      icon: Icons.shield_outlined,
      category: _FeatureCategory.family,
    ),
    _CatalogFeature(
      id: 'activity-history',
      title: 'Activity History & Audit Views',
      description: 'Complete audit log of activity across all family profiles',
      icon: Icons.history_rounded,
      category: _FeatureCategory.family,
    ),
    _CatalogFeature(
      id: 'combined-progress',
      title: 'Combined Progress Summaries',
      description:
          'See progress across all family members in unified reports',
      icon: Icons.trending_up_rounded,
      category: _FeatureCategory.family,
    ),
    _CatalogFeature(
      id: 'shared-routines',
      title: 'Shared Routines, Templates & Calendars',
      description:
          'Build and share routines, task templates, and calendars across the family',
      icon: Icons.calendar_month_outlined,
      category: _FeatureCategory.family,
    ),
    _CatalogFeature(
      id: 'cascading-alerts',
      title: 'Cascading Contact Alerts',
      description:
          'Automated alert system that notifies multiple contacts in priority order',
      icon: Icons.notifications_active_outlined,
      category: _FeatureCategory.family,
    ),
    _CatalogFeature(
      id: 'family-achievements',
      title: 'Family Achievements & Milestones',
      description: 'Celebrate wins and milestones together as a family',
      icon: Icons.workspace_premium_outlined,
      category: _FeatureCategory.family,
    ),
    _CatalogFeature(
      id: 'dedicated-assistance',
      title: 'Dedicated Account Assistance',
      description: 'Personal support representative for your family account',
      icon: Icons.headset_mic_outlined,
      category: _FeatureCategory.family,
    ),
    _CatalogFeature(
      id: 'priority-chat-support',
      title: 'Priority Email & Chat Support',
      description: 'Top-tier support with priority email and live chat access',
      icon: Icons.forum_outlined,
      category: _FeatureCategory.family,
    ),
    _CatalogFeature(
      id: 'guided-onboarding',
      title: 'Guided Onboarding Sessions',
      description:
          'Personalized onboarding to help your family get the most from Adaptalyfe',
      icon: Icons.school_outlined,
      category: _FeatureCategory.family,
    ),
  ];

  static const _filters = <_CategoryFilter>[
    _CategoryFilter(label: 'All Features', category: null),
    _CategoryFilter(label: 'Basic Plan', category: _FeatureCategory.basic),
    _CategoryFilter(label: 'Premium Plan', category: _FeatureCategory.premium),
    _CategoryFilter(label: 'Family Plan', category: _FeatureCategory.family),
  ];

  _FeatureCategory? _selectedCategory;

  List<_CatalogFeature> get _visibleFeatures {
    if (_selectedCategory == null) return _features;
    return _features
        .where((feature) => feature.category == _selectedCategory)
        .toList();
  }

  int _countFor(_CategoryFilter filter) {
    if (filter.category == null) return _features.length;
    return _features
        .where((feature) => feature.category == filter.category)
        .length;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Features')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        children: [
          Text(
            'Adaptalyfe Features',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: const Color(0xFF1D4ED8),
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Discover all the tools and features available to help you achieve '
            'independence and build life skills',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: const Color(0xFF6B7280),
            ),
          ),
          const SizedBox(height: 20),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final filter in _filters)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text('${filter.label} (${_countFor(filter)})'),
                      selected: _selectedCategory == filter.category,
                      onSelected: (_) {
                        setState(() => _selectedCategory = filter.category);
                      },
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          for (final feature in _visibleFeatures)
            _FeatureCard(feature: feature),
          const SizedBox(height: 12),
          Text('Feature Summary', style: theme.textTheme.titleLarge),
          const SizedBox(height: 8),
          _SummaryCard(
            title: 'Available Now',
            count: _countFor(_filters[1]),
            detail: 'Features ready to use',
            color: const Color(0xFF15803D),
            background: const Color(0xFFF0FDF4),
          ),
          _SummaryCard(
            title: 'Premium Plan',
            count: _countFor(_filters[2]),
            detail: 'Premium features',
            color: const Color(0xFF7E22CE),
            background: const Color(0xFFFAF5FF),
          ),
          _SummaryCard(
            title: 'Family Plan',
            count: _countFor(_filters[3]),
            detail: 'Family and care-team features',
            color: const Color(0xFFBE185D),
            background: const Color(0xFFFDF2F8),
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({required this.feature});

  final _CatalogFeature feature;

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(feature.category);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(feature.icon, color: const Color(0xFF2563EB)),
                ),
                const Spacer(),
                _StatusBadge(category: feature.category),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              feature.title,
              key: ValueKey(feature.id),
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 6),
            Text(
              feature.description,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF6B7280),
                    height: 1.45,
                  ),
            ),
            if (feature.category == _FeatureCategory.premium) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFAF5FF),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFE9D5FF)),
                ),
                child: const Text(
                  'Upgrade to Premium to unlock this feature and gain access '
                  'to advanced tools designed to enhance your independence journey.',
                  style: TextStyle(
                    color: Color(0xFF7E22CE),
                    fontSize: 12,
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

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.category});

  final _FeatureCategory category;

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(category);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        border: Border.all(color: color.withValues(alpha: 0.35)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_statusIcon(category), size: 13, color: color),
          const SizedBox(width: 5),
          Text(
            _statusLabel(category),
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.title,
    required this.count,
    required this.detail,
    required this.color,
    required this.background,
  });

  final String title;
  final int count;
  final String detail;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: background,
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Icon(Icons.check_circle_outline, color: color),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    detail,
                    style: TextStyle(color: color.withValues(alpha: 0.85)),
                  ),
                ],
              ),
            ),
            Text(
              '$count',
              style: TextStyle(
                color: color,
                fontSize: 22,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Color _statusColor(_FeatureCategory category) {
  switch (category) {
    case _FeatureCategory.basic:
      return const Color(0xFF16A34A);
    case _FeatureCategory.premium:
      return const Color(0xFF9333EA);
    case _FeatureCategory.family:
      return const Color(0xFFDB2777);
  }
}

IconData _statusIcon(_FeatureCategory category) {
  switch (category) {
    case _FeatureCategory.basic:
      return Icons.check_circle_outline;
    case _FeatureCategory.premium:
      return Icons.lock_outline;
    case _FeatureCategory.family:
      return Icons.groups_outlined;
  }
}

String _statusLabel(_FeatureCategory category) {
  switch (category) {
    case _FeatureCategory.basic:
      return 'Basic Plan';
    case _FeatureCategory.premium:
      return 'Premium Feature';
    case _FeatureCategory.family:
      return 'Family Plan';
  }
}