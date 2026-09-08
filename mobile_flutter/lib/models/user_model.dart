class UserModel {
  const UserModel({
    required this.id,
    required this.username,
    this.name,
    this.email,
    this.isAdmin = false,
  });

  final int id;
  final String username;
  final String? name;
  final String? email;
  final bool isAdmin;

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
    );
  }
}