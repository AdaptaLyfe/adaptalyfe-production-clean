class UserModel {
  const UserModel({
    required this.id,
    required this.username,
    this.name,
    this.email,
    this.streakDays = 0,
    this.isAdmin = false,
    this.createdAt,
    this.accountType,
    this.subscriptionTier,
    this.subscriptionStatus,
    this.subscriptionPlatform,
    this.subscriptionExpiresAt,
  });

  final int id;
  final String username;
  final String? name;
  final String? email;
  final int streakDays;
  final bool isAdmin;
  final DateTime? createdAt;
  final String? accountType;
  final String? subscriptionTier;
  final String? subscriptionStatus;
  final String? subscriptionPlatform;
  final DateTime? subscriptionExpiresAt;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final rawId = json['id'];
    final id = rawId is int ? rawId : int.tryParse('$rawId');
    final username = json['username'];

    if (id == null || username is! String || username.isEmpty) {
      throw const FormatException('Invalid user response');
    }

    return UserModel(
      id: id,
      username: username,
      name: json['name'] as String?,
      email: json['email'] as String?,
      streakDays: _parseInt(json['streakDays']),
      isAdmin: json['isAdmin'] == true,
      createdAt: _parseDate(json['createdAt']),
      accountType: json['accountType'] as String?,
      subscriptionTier: json['subscriptionTier'] as String?,
      subscriptionStatus: json['subscriptionStatus'] as String?,
      subscriptionPlatform: json['subscriptionPlatform'] as String?,
      subscriptionExpiresAt: _parseDate(json['subscriptionExpiresAt']),
    );
  }

  static DateTime? _parseDate(Object? value) =>
      value is String ? DateTime.tryParse(value) : null;

  static int _parseInt(Object? value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse('$value') ?? 0;
  }
}