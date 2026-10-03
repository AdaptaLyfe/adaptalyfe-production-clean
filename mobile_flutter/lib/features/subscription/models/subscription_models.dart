import 'package:equatable/equatable.dart';

class SubscriptionProducts {
  static const basicMonthly = 'adaptalyfe_basic_monthly';
  static const premiumMonthly = 'adaptalyfe_premium_monthly';
  static const familyMonthly = 'adaptalyfe_family_monthly';

  static const android = <String>{
    basicMonthly,
    premiumMonthly,
    familyMonthly,
  };
  static const ios = <String>{
    basicMonthly,
    premiumMonthly,
    familyMonthly,
  };

  static Set<String> forPlatform(String platform) {
    return switch (platform) {
      'android' => android,
      'ios' => ios,
      _ => const <String>{},
    };
  }

  const SubscriptionProducts._();
}

const subscriptionPlans = <SubscriptionPlan>[
  SubscriptionPlan(
    id: 'basic',
    name: 'Basic Plan',
    description: 'Essential features for daily independence',
    productId: SubscriptionProducts.basicMonthly,
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
    productId: SubscriptionProducts.premiumMonthly,
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
    productId: SubscriptionProducts.familyMonthly,
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
    required this.productId,
    required this.features,
    this.popular = false,
  });

  final String id;
  final String name;
  final String description;
  final String productId;
  final List<String> features;
  final bool popular;

  @override
  List<Object?> get props =>
      [id, name, description, productId, features, popular];
}

class SubscriptionModel extends Equatable {
  const SubscriptionModel({
    required this.id,
    required this.planType,
    required this.status,
    required this.billingCycle,
    this.subscriptionPlatform,
    this.currentPeriodStart,
    this.currentPeriodEnd,
    this.trialDaysLeft,
    this.hasOrganizationAccess = false,
    this.usageStats = const {},
    this.features = const {},
  });

  final int id;
  final String planType;
  final String status;
  final String billingCycle;
  final String? subscriptionPlatform;
  final DateTime? currentPeriodStart;
  final DateTime? currentPeriodEnd;
  final int? trialDaysLeft;
  final bool hasOrganizationAccess;
  final Map<String, dynamic> usageStats;
  final Map<String, dynamic> features;

  bool get isActive => status == 'active';
  bool get isTrialing => status == 'trialing';
  bool get isExpired => status == 'expired';
  bool get grantsAccess => isActive || isTrialing;
  bool get hasPlanEntitlement =>
      grantsAccess && planType.toLowerCase() != 'free';

  /// Mirrors the wrapper's general premium-route rule: server-active
  /// subscriptions are allowed regardless of tier, and trial access is valid
  /// only while the server reports days remaining.
  bool get hasPremiumAccess =>
      isActive || (isTrialing && (trialDaysLeft ?? 0) > 0);

  bool get hasApplicationAccess =>
      hasOrganizationAccess || hasPremiumAccess;

  /// Feature-specific routes must also honor the backend's verified feature
  /// flags, just like the wrapper's `hasFeature` checks.
  bool hasFeatureAccess(String featureKey) =>
      hasOrganizationAccess ||
      (hasPremiumAccess && features[featureKey] == true);

  SubscriptionModel withOrganizationAccess(bool value) {
    return SubscriptionModel(
      id: id,
      planType: planType,
      status: status,
      billingCycle: billingCycle,
      subscriptionPlatform: subscriptionPlatform,
      currentPeriodStart: currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd,
      trialDaysLeft: trialDaysLeft,
      hasOrganizationAccess: value,
      usageStats: usageStats,
      features: features,
    );
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
    return SubscriptionModel(
      id: id,
      planType: '${json['planType'] ?? 'free'}',
      status: '${json['status'] ?? 'expired'}',
      billingCycle: '${json['billingCycle'] ?? 'monthly'}',
      subscriptionPlatform: json['subscriptionPlatform'] as String?,
      currentPeriodStart: _date(json['currentPeriodStart']),
      currentPeriodEnd: _date(json['currentPeriodEnd']),
      trialDaysLeft: _int(json['trialDaysLeft']),
      hasOrganizationAccess: json['hasOrganizationAccess'] == true,
      usageStats: _map(json['usageStats']),
      features: _map(json['features']),
    );
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
        currentPeriodStart,
        currentPeriodEnd,
        trialDaysLeft,
        hasOrganizationAccess,
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
  });

  final bool success;
  final String? message;
  final String? planType;
  final DateTime? expiresAt;

  factory PurchaseVerification.fromJson(Map<String, dynamic> json) {
    return PurchaseVerification(
      success: json['success'] == true || json['restored'] == true,
      message: json['message'] as String?,
      planType: (json['planType'] ?? json['plan']) as String?,
      expiresAt: SubscriptionModel._date(json['expiresAt']),
    );
  }

  @override
  List<Object?> get props => [success, message, planType, expiresAt];
}
