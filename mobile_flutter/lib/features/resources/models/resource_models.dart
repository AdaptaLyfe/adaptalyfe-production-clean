import 'package:equatable/equatable.dart';

class PersonalResourceModel extends Equatable {
  const PersonalResourceModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.url,
    required this.description,
    required this.category,
    required this.tags,
    required this.isFavorite,
    required this.accessCount,
    required this.createdAt,
    required this.lastAccessedAt,
  });

  factory PersonalResourceModel.fromJson(Map<String, dynamic> json) {
    return PersonalResourceModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      title: _asString(json['title']),
      url: _asString(json['url']),
      description: _asNullableString(json['description']),
      category: _asString(json['category'], fallback: 'other'),
      tags: _asNullableString(json['tags']),
      isFavorite: json['isFavorite'] == true,
      accessCount: _asInt(json['accessCount']),
      createdAt: _asDate(json['createdAt']),
      lastAccessedAt: _asDate(json['lastAccessedAt']),
    );
  }

  final int id;
  final int userId;
  final String title;
  final String url;
  final String? description;
  final String category;
  final String? tags;
  final bool isFavorite;
  final int accessCount;
  final DateTime? createdAt;
  final DateTime? lastAccessedAt;

  @override
  List<Object?> get props => [
        id,
        userId,
        title,
        url,
        description,
        category,
        tags,
        isFavorite,
        accessCount,
        createdAt,
        lastAccessedAt,
      ];
}

class PersonalResourceInput extends Equatable {
  const PersonalResourceInput({
    required this.title,
    required this.url,
    required this.category,
    this.description,
    this.tags,
    this.isFavorite = false,
  });

  final String title;
  final String url;
  final String category;
  final String? description;
  final String? tags;
  final bool isFavorite;

  Map<String, dynamic> toJson() => {
        'title': title.trim(),
        'url': url.trim(),
        'category': category,
        'description': _nullableText(description),
        'tags': _nullableText(tags),
        'isFavorite': isFavorite,
      };

  @override
  List<Object?> get props => [
        title,
        url,
        category,
        description,
        tags,
        isFavorite,
      ];
}

class EmergencyResourceModel extends Equatable {
  const EmergencyResourceModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.resourceType,
    required this.phoneNumber,
    required this.address,
    required this.description,
    required this.isAvailable24_7,
    required this.createdAt,
    required this.updatedAt,
  });

  factory EmergencyResourceModel.fromJson(Map<String, dynamic> json) {
    return EmergencyResourceModel(
      id: _asInt(json['id']),
      userId: _asInt(json['userId']),
      name: _asString(json['name']),
      resourceType: _asString(
        json['resourceType'] ?? json['type'],
        fallback: 'crisis',
      ),
      phoneNumber: _asNullableString(json['phoneNumber']),
      address: _asNullableString(json['address']),
      description: _asNullableString(json['description']),
      isAvailable24_7:
          json['isAvailable24_7'] == true || json['isEmergencyOnly'] == true,
      createdAt: _asDate(json['createdAt']),
      updatedAt: _asDate(json['updatedAt']),
    );
  }

  final int id;
  final int userId;
  final String name;
  final String resourceType;
  final String? phoneNumber;
  final String? address;
  final String? description;
  final bool isAvailable24_7;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => [
        id,
        userId,
        name,
        resourceType,
        phoneNumber,
        address,
        description,
        isAvailable24_7,
        createdAt,
        updatedAt,
      ];
}

class EmergencyResourceInput extends Equatable {
  const EmergencyResourceInput({
    required this.name,
    required this.resourceType,
    this.phoneNumber,
    this.address,
    this.description,
    this.isAvailable24_7 = false,
  });

  final String name;
  final String resourceType;
  final String? phoneNumber;
  final String? address;
  final String? description;
  final bool isAvailable24_7;

  Map<String, dynamic> toJson() => {
        'name': name.trim(),
        'resourceType': resourceType,
        'phoneNumber': _nullableText(phoneNumber),
        'address': _nullableText(address),
        'description': _nullableText(description),
        'isAvailable24_7': isAvailable24_7,
      };

  @override
  List<Object?> get props => [
        name,
        resourceType,
        phoneNumber,
        address,
        description,
        isAvailable24_7,
      ];
}

DateTime? _asDate(Object? value) {
  if (value is DateTime) return value.toLocal();
  if (value is String && value.trim().isNotEmpty) {
    return DateTime.tryParse(value)?.toLocal();
  }
  return null;
}

int _asInt(Object? value) {
  if (value is int) return value;
  return int.tryParse('$value') ?? 0;
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