import 'package:equatable/equatable.dart';

const subscriptionPlans = <SubscriptionPlan>[
  SubscriptionPlan(
    id: 'basic',
    name: 'Basic Plan',
    description: 'Essential features for daily independence',
    monthlyPrice: 4.99,
    productId: 'adaptalyfe_basic_monthly',
    features: [
      'Daily task management (up to 50 tasks)',
      'Basic mood tracking',
      'Financial tracking & bill reminders',
      '1 caregiver connection',
      'Basic reminders & notifications',
      'Email support',
    ],
  ),
  SubscriptionPlan(
    id: 'premium',
    name: 'Premium Plan',
    description: 'Advanced features for enhanced independence',
    monthlyPrice: 12.99,
    productId: 'adaptalyfe_premium_monthly',
    popular: true,
    features: [
      'Everything in Basic',
      'Unlimited tasks (up to 1,000)',
      'Advanced analytics & insights',
      'Medication management',
      'Up to 5 caregiver connections',
      'Voice commands',
      'Smart notifications',
      'Meal planning & grocery lists',
      'Academic planner',
      'Priority support',
    ],
  ),
  SubscriptionPlan(
    id: 'family',
    name: 'Family Plan',
    description: 'Complete solution for families and care teams',
    monthlyPrice: 24.99,
    productId: 'adaptalyfe_family_monthly',
    features: [
      'Everything in Premium',
      'Up to 5 additional member accounts',
      'Unlimited caregiver connections',
      'Family dashboard & shared progress',
      'Emergency protocols & alerts',
      'Custom reporting',
      'Phone support',
    ],
  ),
];

class SubscriptionPlan extends Equatable {
  const SubscriptionPlan({
    required this.id,
    required this.name,
    required this.description,
    required this.monthlyPrice,
    required this.productId,
    required this.features,
    this.popular = false,
  });

  final String id;
  final String name;
  final String description;
  final double monthlyPrice;
  final String productId;
  final List<String> features;
  final bool popular;

  @override
  List<Object?> get props =>
      [id, name, description, monthlyPrice, productId, features, popular];
}

class SubscriptionModel extends Equatable {
  const SubscriptionModel({
    required this.id,
    required this.planType,
    required this.status,
    required this.billingCycle,
    this.subscriptionPlatform,
    this.isAccountTrial = false,
    this.currentPeriodStart,
    this.currentPeriodEnd,
    this.trialDaysLeft,
    this.usageStats = const {},
    this.features = const {},
  });

  final int id;
  final String planType;
  final String status;
  final String billingCycle;
  final String? subscriptionPlatform;
  final bool isAccountTrial;
  final DateTime? currentPeriodStart;
  final DateTime? currentPeriodEnd;
  final int? trialDaysLeft;
  final Map<String, dynamic> usageStats;
  final Map<String, dynamic> features;

  bool get isActive => status == 'active';
  bool get isTrialing => status == 'trialing';
  bool get isCancelled => status == 'cancelled';
  bool get isInGracePeriod => status == 'in_grace_period';
  bool get isExpired => status == 'expired';
  bool get _hasUnexpiredPeriod =>
      currentPeriodEnd?.isAfter(DateTime.now()) == true;
  bool get _isNativeStore =>
      subscriptionPlatform == 'app_store' ||
      subscriptionPlatform == 'google_play';
  bool get grantsAccess {
    if (_isNativeStore) {
      return const ['basic', 'premium', 'family'].contains(planType.toLowerCase()) &&
          _hasUnexpiredPeriod &&
          (isActive || isCancelled || isInGracePeriod);
    }
    if (currentPeriodEnd != null && !_hasUnexpiredPeriod) return false;
    return isActive || isTrialing || (isCancelled && _hasUnexpiredPeriod);
  }
  bool get hasPremiumAccess {
    if (!grantsAccess) return false;
    final tier = planType.toLowerCase();
    return tier == 'premium' || tier == 'family';
  }

  String get platformLabel {
    switch (subscriptionPlatform) {
      case 'app_store':
        return 'Apple App Store';
      case 'google_play':
        return 'Google Play';
      case 'web':
        return 'the Adaptalyfe website';
      default:
        return 'another platform';
    }
  }

  factory SubscriptionModel.fromJson(Map<String, dynamic> json) {
    final rawId = json['id'];
    final id = rawId is int ? rawId : int.tryParse('$rawId') ?? 0;
    final subscriptionPlatform = json['subscriptionPlatform'] as String?;
    return SubscriptionModel(
      id: id,
      planType: '${json['planType'] ?? 'free'}',
      status: '${json['status'] ?? 'expired'}',
      billingCycle: '${json['billingCycle'] ?? 'monthly'}',
      subscriptionPlatform: subscriptionPlatform,
      isAccountTrial: _isAccountTrial(json, subscriptionPlatform),
      currentPeriodStart: _date(json['currentPeriodStart']),
      currentPeriodEnd: _date(json['currentPeriodEnd']),
      trialDaysLeft: _int(json['trialDaysLeft']),
      usageStats: _map(json['usageStats']),
      features: _map(json['features']),
    );
  }

  static bool _isAccountTrial(
    Map<String, dynamic> json,
    String? subscriptionPlatform,
  ) {
    final explicitValue = json['isAccountTrial'];
    if (explicitValue is bool) return explicitValue;

    // Older servers omitted isAccountTrial. Only infer the free account trial
    // when it has no billing provider and the server reports days remaining.
    final daysLeft = _int(json['trialDaysLeft']);
    return json['status'] == 'trialing' &&
        (subscriptionPlatform == null || subscriptionPlatform.trim().isEmpty) &&
        daysLeft != null &&
        daysLeft > 0;
  }

  static DateTime? _date(Object? value) {
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }

  static int? _int(Object? value) {
    if (value is int) return value;
    return int.tryParse('$value');
  }

  static Map<String, dynamic> _map(Object? value) {
    if (value is Map) return Map<String, dynamic>.from(value);
    return const {};
  }

  @override
  List<Object?> get props => [
        id,
        planType,
        status,
        billingCycle,
        subscriptionPlatform,
        isAccountTrial,
        currentPeriodStart,
        currentPeriodEnd,
        trialDaysLeft,
        usageStats,
        features,
      ];
}

class PurchaseVerification extends Equatable {
  const PurchaseVerification({
    required this.success,
    this.message,
    this.planType,
    this.expiresAt,
    this.status,
    this.subscription,
  });

  final bool success;
  final String? message;
  final String? planType;
  final DateTime? expiresAt;
  final String? status;
  final SubscriptionModel? subscription;

  factory PurchaseVerification.fromJson(Map<String, dynamic> json) {
    final rawSubscription = json['subscription'];
    return PurchaseVerification(
      success: json['success'] == true || json['restored'] == true,
      message: json['message'] as String?,
      planType: (json['planType'] ?? json['plan']) as String?,
      expiresAt: SubscriptionModel._date(json['expiresAt']),
      status: json['status'] as String?,
      subscription: rawSubscription is Map
          ? SubscriptionModel.fromJson(
              Map<String, dynamic>.from(rawSubscription),
            )
          : null,
    );
  }

  @override
  List<Object?> get props => [
        success,
        message,
        planType,
        expiresAt,
        status,
        subscription,
      ];
}
