class UserModel {
  const UserModel({
    required this.id,
    required this.username,
    this.name,
    this.email,
    this.isAdmin = false,
    this.createdAt,
    this.accountType,
    this.subscriptionTier,
    this.subscriptionStatus,
  });

  final int id;
  final String username;
  final String? name;
  final String? email;
  final bool isAdmin;
  final DateTime? createdAt;
  final String? accountType;
  final String? subscriptionTier;
  final String? subscriptionStatus;

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
      isAdmin: json['isAdmin'] == true,
      createdAt: _parseDate(json['createdAt']),
      accountType: json['accountType'] as String?,
      subscriptionTier: json['subscriptionTier'] as String?,
      subscriptionStatus: json['subscriptionStatus'] as String?,
    );
  }

  static DateTime? _parseDate(Object? value) =>
      value is String ? DateTime.tryParse(value) : null;
}