class UserModel {
  const UserModel({
    required this.id,
    required this.username,
    this.name,
    this.email,
  });

  final int id;
  final String username;
  final String? name;
  final String? email;
}