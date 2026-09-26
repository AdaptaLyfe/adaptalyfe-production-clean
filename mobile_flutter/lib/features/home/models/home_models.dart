import 'package:equatable/equatable.dart';

class DailyGuideHighlight extends Equatable {
  const DailyGuideHighlight({
    required this.type,
    required this.title,
    this.time,
    this.priority = 'normal',
  });

  factory DailyGuideHighlight.fromJson(Map<String, dynamic> json) =>
      DailyGuideHighlight(
        type: '${json['type'] ?? 'task'}',
        title: '${json['title'] ?? ''}',
        time: json['time'] as String?,
        priority: '${json['priority'] ?? 'normal'}',
      );

  final String type;
  final String title;
  final String? time;
  final String priority;

  @override
  List<Object?> get props => [type, title, time, priority];
}

class DailyGuideNextAction extends Equatable {
  const DailyGuideNextAction({
    required this.title,
    this.reason,
    this.source,
  });

  factory DailyGuideNextAction.fromJson(Map<String, dynamic> json) =>
      DailyGuideNextAction(
        title: '${json['title'] ?? ''}',
        reason: json['reason'] as String?,
        source: json['source'] as String?,
      );

  final String title;
  final String? reason;
  final String? source;

  @override
  List<Object?> get props => [title, reason, source];
}

class DailyGuideModel extends Equatable {
  const DailyGuideModel({
    required this.greeting,
    required this.summary,
    required this.highlights,
    this.nextAction,
  });

  factory DailyGuideModel.fromJson(Map<String, dynamic> json) {
    final rawHighlights = json['highlights'];
    return DailyGuideModel(
      greeting: '${json['greeting'] ?? ''}',
      summary: '${json['summary'] ?? ''}',
      highlights: rawHighlights is List
          ? rawHighlights
              .whereType<Map>()
              .map(
                (item) => DailyGuideHighlight.fromJson(
                  Map<String, dynamic>.from(item),
                ),
              )
              .toList()
          : const [],
      nextAction: json['nextAction'] is Map
          ? DailyGuideNextAction.fromJson(
              Map<String, dynamic>.from(json['nextAction'] as Map),
            )
          : null,
    );
  }

  final String greeting;
  final String summary;
  final List<DailyGuideHighlight> highlights;
  final DailyGuideNextAction? nextAction;

  @override
  List<Object?> get props => [greeting, summary, highlights, nextAction];
}

class HomeChatMessage extends Equatable {
  const HomeChatMessage({
    required this.text,
    required this.isUser,
    this.isError = false,
    this.timestamp,
  });

  final String text;
  final bool isUser;
  final bool isError;
  final DateTime? timestamp;

  @override
  List<Object?> get props => [text, isUser, isError, timestamp];
}

class HomeChatAction extends Equatable {
  const HomeChatAction({
    required this.action,
    required this.parameters,
    required this.summary,
  });

  factory HomeChatAction.fromJson(Map<String, dynamic> json) => HomeChatAction(
        action: '${json['action'] ?? ''}',
        parameters: json['parameters'] is Map
            ? Map<String, dynamic>.from(json['parameters'] as Map)
            : const {},
        summary: '${json['summary'] ?? json['description'] ?? 'Make this change?'}',
      );

  final String action;
  final Map<String, dynamic> parameters;
  final String summary;

  @override
  List<Object?> get props => [action, parameters, summary];
}

class HomeQuickAction extends Equatable {
  const HomeQuickAction({
    required this.id,
    required this.label,
    required this.description,
    required this.route,
    required this.icon,
    required this.colorValue,
    required this.visible,
  });

  final String id;
  final String label;
  final String description;
  final String route;
  final String icon;
  final int colorValue;
  final bool visible;

  HomeQuickAction copyWith({bool? visible}) => HomeQuickAction(
        id: id,
        label: label,
        description: description,
        route: route,
        icon: icon,
        colorValue: colorValue,
        visible: visible ?? this.visible,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'visible': visible,
      };

  @override
  List<Object?> get props =>
      [id, label, description, route, icon, colorValue, visible];
}

const defaultHomeQuickActions = <HomeQuickAction>[
  HomeQuickAction(
    id: 'meal-shopping',
    label: 'Meals & Shopping',
    description: 'Plan and shop',
    route: '/meal-shopping',
    icon: 'shopping_cart',
    colorValue: 0xFFF97316,
    visible: true,
  ),
  HomeQuickAction(
    id: 'medical',
    label: 'Health Records',
    description: 'Personal health info',
    route: '/medical',
    icon: 'medical_services',
    colorValue: 0xFFEC4899,
    visible: true,
  ),
  HomeQuickAction(
    id: 'daily-tasks',
    label: 'Daily Tasks',
    description: 'Complete activities',
    route: '/daily-tasks',
    icon: 'check_box',
    colorValue: 0xFF14B8A6,
    visible: true,
  ),
  HomeQuickAction(
    id: 'mood-checkin',
    label: 'Mood Check-in',
    description: 'How are you feeling?',
    route: '/mood-tracking',
    icon: 'mood',
    colorValue: 0xFFEC4899,
    visible: true,
  ),
  HomeQuickAction(
    id: 'personal-documents',
    label: 'Personal Documents',
    description: 'Your documents',
    route: '/personal-documents',
    icon: 'description',
    colorValue: 0xFF60A5FA,
    visible: true,
  ),
  HomeQuickAction(
    id: 'financial',
    label: 'Bill Reminders',
    description: 'Manage payments',
    route: '/financial',
    icon: 'calendar',
    colorValue: 0xFF3B82F6,
    visible: true,
  ),
  HomeQuickAction(
    id: 'mood-tracking',
    label: 'Mood Log',
    description: 'Track your mood',
    route: '/mood-tracking',
    icon: 'mood',
    colorValue: 0xFFF97316,
    visible: false,
  ),
  HomeQuickAction(
    id: 'ai-chat',
    label: 'AI Chat Assistant',
    description: 'Get help from AI',
    route: '/ai-chat',
    icon: 'message_square',
    colorValue: 0xFF06B6D4,
    visible: false,
  ),
  HomeQuickAction(
    id: 'caregiver',
    label: 'Contact Support',
    description: 'Reach caregivers',
    route: '/caregiver',
    icon: 'people',
    colorValue: 0xFF6366F1,
    visible: false,
  ),
  HomeQuickAction(
    id: 'pharmacy',
    label: 'Medication List',
    description: 'Manage medications',
    route: '/pharmacy',
    icon: 'medication',
    colorValue: 0xFFEF4444,
    visible: false,
  ),
  HomeQuickAction(
    id: 'resources',
    label: 'Resources',
    description: 'Helpful guides',
    route: '/resources',
    icon: 'menu_book',
    colorValue: 0xFFEAB308,
    visible: false,
  ),
  HomeQuickAction(
    id: 'rewards',
    label: 'Achievements',
    description: 'View rewards',
    route: '/rewards',
    icon: 'star',
    colorValue: 0xFFF59E0B,
    visible: false,
  ),
  HomeQuickAction(
    id: 'academic',
    label: 'Academic Planner',
    description: 'School tasks',
    route: '/academic-planner',
    icon: 'school',
    colorValue: 0xFF7C3AED,
    visible: false,
  ),
];