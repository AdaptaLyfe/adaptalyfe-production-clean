import 'package:equatable/equatable.dart';

abstract final class RewardRedemptionLimit {
  static bool hasReached({
    required int? maximum,
    required int current,
  }) =>
      maximum != null && current >= maximum;

  static int? remaining({
    required int? maximum,
    required int current,
  }) {
    if (maximum == null) return null;
    final remaining = maximum - current;
    return remaining > 0 ? remaining : 0;
  }
}

class RewardModel extends Equatable {
  const RewardModel({
    required this.id,
    required this.userId,
    required this.caregiverId,
    required this.title,
    required this.description,
    required this.pointsRequired,
    required this.category,
    required this.rewardType,
    required this.value,
    required this.isActive,
    required this.maxRedemptions,
    required this.currentRedemptions,
    required this.expiresAt,
    required this.iconName,
    required this.color,
    required this.createdAt,
    required this.updatedAt,
  });

  factory RewardModel.fromJson(Map<String, dynamic> json) {
    return RewardModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      caregiverId: _asInt(json['caregiverId']),
      title: _asString(json['title']),
      description: _asString(json['description']),
      pointsRequired: _asInt(json['pointsRequired']),
      category: _asString(json['category'], fallback: 'privilege'),
      rewardType: _asString(json['rewardType'], fallback: 'immediate'),
      value: _asNullableString(json['value']),
      isActive: json['isActive'] != false,
      maxRedemptions: _asNullableInt(json['maxRedemptions']),
      currentRedemptions: _asInt(json['currentRedemptions']),
      expiresAt: _asDate(json['expiresAt']),
      iconName: _asString(json['iconName'], fallback: 'gift'),
      color: _asString(json['color'], fallback: '#3b82f6'),
      createdAt: _asDate(json['createdAt']),
      updatedAt: _asDate(json['updatedAt']),
    );
  }

  final int id;
  final int userId;
  final int caregiverId;
  final String title;
  final String description;
  final int pointsRequired;
  final String category;
  final String rewardType;
  final String? value;
  final bool isActive;
  final int? maxRedemptions;
  final int currentRedemptions;
  final DateTime? expiresAt;
  final String iconName;
  final String color;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  bool get hasReachedRedemptionLimit => RewardRedemptionLimit.hasReached(
        maximum: maxRedemptions,
        current: currentRedemptions,
      );

  int? get remainingRedemptions => RewardRedemptionLimit.remaining(
        maximum: maxRedemptions,
        current: currentRedemptions,
      );

  RewardModel withCurrentRedemptions(int value) => RewardModel(
        id: id,
        userId: userId,
        caregiverId: caregiverId,
        title: title,
        description: description,
        pointsRequired: pointsRequired,
        category: category,
        rewardType: rewardType,
        value: this.value,
        isActive: isActive,
        maxRedemptions: maxRedemptions,
        currentRedemptions: value,
        expiresAt: expiresAt,
        iconName: iconName,
        color: color,
        createdAt: createdAt,
        updatedAt: updatedAt,
      );

  @override
  List<Object?> get props => [
        id,
        userId,
        caregiverId,
        title,
        description,
        pointsRequired,
        category,
        rewardType,
        value,
        isActive,
        maxRedemptions,
        currentRedemptions,
        expiresAt,
        iconName,
        color,
        createdAt,
        updatedAt,
      ];
}

class RewardInput extends Equatable {
  const RewardInput({
    required this.title,
    required this.description,
    required this.pointsRequired,
    required this.category,
    required this.rewardType,
    this.value,
    this.maxRedemptions,
    this.iconName = 'gift',
    this.color = '#3b82f6',
  });

  final String title;
  final String description;
  final int pointsRequired;
  final String category;
  final String rewardType;
  final String? value;
  final int? maxRedemptions;
  final String iconName;
  final String color;

  Map<String, dynamic> toJson() => {
        'title': title.trim(),
        'description': description.trim(),
        'pointsRequired': pointsRequired,
        'category': category,
        'rewardType': rewardType,
        'value': _nullableText(value),
        'maxRedemptions': maxRedemptions,
        'iconName': iconName,
        'color': color,
      };

  @override
  List<Object?> get props => [
        title,
        description,
        pointsRequired,
        category,
        rewardType,
        value,
        maxRedemptions,
        iconName,
        color,
      ];
}

class PointsBalanceModel extends Equatable {
  const PointsBalanceModel({
    required this.userId,
    required this.totalPoints,
    required this.availablePoints,
    required this.lifetimeEarned,
    required this.lifetimeSpent,
    required this.updatedAt,
  });

  factory PointsBalanceModel.fromJson(Map<String, dynamic> json) {
    return PointsBalanceModel(
      userId: _asInt(json['userId']),
      totalPoints: _asInt(json['totalPoints']),
      availablePoints: _asInt(json['availablePoints']),
      lifetimeEarned: _asInt(json['lifetimeEarned'] ?? json['totalEarned']),
      lifetimeSpent: _asInt(json['lifetimeSpent'] ?? json['totalSpent']),
      updatedAt: _asDate(json['updatedAt']),
    );
  }

  final int userId;
  final int totalPoints;
  final int availablePoints;
  final int lifetimeEarned;
  final int lifetimeSpent;
  final DateTime? updatedAt;

  // The web page calls these values Total Earned and Total Spent.
  int get totalEarned => lifetimeEarned;
  int get totalSpent => lifetimeSpent;

  PointsBalanceModel afterRedemption(int points, DateTime redeemedAt) =>
      PointsBalanceModel(
        userId: userId,
        totalPoints: totalPoints - points,
        availablePoints: availablePoints - points,
        lifetimeEarned: lifetimeEarned,
        lifetimeSpent: lifetimeSpent + points,
        updatedAt: redeemedAt,
      );

  @override
  List<Object?> get props => [
        userId,
        totalPoints,
        availablePoints,
        lifetimeEarned,
        lifetimeSpent,
        updatedAt,
      ];
}

class PointsTransactionModel extends Equatable {
  const PointsTransactionModel({
    required this.id,
    required this.userId,
    required this.points,
    required this.transactionType,
    required this.source,
    required this.description,
    required this.awardedBy,
    required this.createdAt,
  });

  factory PointsTransactionModel.fromJson(Map<String, dynamic> json) {
    return PointsTransactionModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      points: _asInt(json['points']),
      transactionType: _asString(json['transactionType']),
      source: _asString(json['source']),
      description: _asString(json['description']),
      awardedBy: _asNullableInt(json['awardedBy']),
      createdAt: _asDate(json['createdAt']),
    );
  }

  final int id;
  final int userId;
  final int points;
  final String transactionType;
  final String source;
  final String description;
  final int? awardedBy;
  final DateTime? createdAt;

  @override
  List<Object?> get props => [
        id,
        userId,
        points,
        transactionType,
        source,
        description,
        awardedBy,
        createdAt,
      ];
}

enum AchievementBadgeStatus {
  earned,
  inProgress,
  locked,
}

/// A badge returned by the canonical /api/rewards/badges endpoint.
class AchievementBadgeModel extends Equatable {
  const AchievementBadgeModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.description,
    required this.iconName,
    required this.category,
    required this.points,
    required this.level,
    required this.earnedAt,
    this.isEarned = true,
    this.progress = 0,
    this.target = 0,
    this.requirement = '',
  });

  factory AchievementBadgeModel.fromJson(Map<String, dynamic> json) {
    return AchievementBadgeModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      type: _asString(json['achievementType'] ?? json['type']),
      title: _asString(json['title']),
      description: _asString(json['description']),
      iconName: _asString(
        json['iconName'] ?? json['icon'],
        fallback: 'trophy',
      ),
      category: _asString(json['category'], fallback: 'achievement'),
      points: _asInt(json['points']),
      level: _asInt(json['level'], fallback: 1),
      earnedAt: _asDate(json['earnedAt']),
      isEarned: json.containsKey('isEarned') ? json['isEarned'] == true : true,
      progress: _asInt(json['progress']),
      target: _asInt(json['target']),
      requirement: _asString(json['requirement']),
    );
  }

  final int id;
  final int userId;
  final String type;
  final String title;
  final String description;
  final String iconName;
  final String category;
  final int points;
  final int level;
  final DateTime? earnedAt;
  final bool isEarned;
  final int progress;
  final int target;
  final String requirement;

  AchievementBadgeStatus get badgeStatus {
    if (isEarned) return AchievementBadgeStatus.earned;
    if (progress > 0) return AchievementBadgeStatus.inProgress;
    return AchievementBadgeStatus.locked;
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        type,
        title,
        description,
        iconName,
        category,
        points,
        level,
        earnedAt,
        isEarned,
        progress,
        target,
        requirement,
      ];
}

DateTime? _asDate(Object? value) {
  if (value is DateTime) return value.toLocal();
  if (value is String && value.trim().isNotEmpty) {
    return DateTime.tryParse(value)?.toLocal();
  }
  return null;
}

int _asInt(Object? value, {int fallback = 0}) {
  if (value is int) return value;
  return int.tryParse('$value') ?? fallback;
}

int? _asNullableInt(Object? value) {
  if (value == null) return null;
  if (value is int) return value;
  return int.tryParse('$value');
}

String _asString(Object? value, {String fallback = ''}) {
  if (value is String && value.trim().isNotEmpty) return value;
  return fallback;
}

String? _asNullableString(Object? value) {
  if (value is String && value.trim().isNotEmpty) return value;
  return null;
}

String? _nullableText(String? value) =>
    value == null || value.trim().isEmpty ? null : value.trim();