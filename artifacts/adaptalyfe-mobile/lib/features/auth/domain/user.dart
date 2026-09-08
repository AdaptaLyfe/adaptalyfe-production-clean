class User {
  const User(
      {required this.id,
      required this.username,
      required this.name,
      this.email});
  final int id;
  final String username;
  final String name;
  final String? email;

  factory User.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final username = json['username'];
    final name = json['name'];
    if (id is! num || username is! String || name is! String) {
      throw const FormatException('Invalid user');
    }
    return User(
        id: id.toInt(),
        username: username,
        name: name,
        email: json['email'] is String ? json['email'] as String : null);
  }
}
