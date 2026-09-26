import 'package:equatable/equatable.dart';

class CaregiverInvitationModel extends Equatable {
  const CaregiverInvitationModel({
    required this.id,
    required this.caregiverId,
    required this.userName,
    required this.invitationCode,
    required this.status,
    required this.relationship,
    required this.permissionsGranted,
    required this.expiresAt,
    this.userEmail,
    this.userAge,
    this.acceptedAt,
    this.acceptedBy,
    this.createdAt,
  });

  factory CaregiverInvitationModel.fromJson(Map<String, dynamic> json) {
    return CaregiverInvitationModel(
      id: _asInt(json['id']),
      caregiverId: _asInt(json['caregiverId']),
      userName: _asString(json['userName'], fallback: 'Caregiver'),
      userEmail: _asNullableString(json['userEmail']),
      userAge: _asNullableInt(json['userAge']),
      invitationCode: _asString(json['invitationCode']),
      status: _asString(json['status'], fallback: 'pending'),
      relationship: _asString(json['relationship'], fallback: 'caregiver'),
      permissionsGranted: _asStringList(json['permissionsGranted']),
      expiresAt: _asDate(json['expiresAt']),
      acceptedAt: _asDate(json['acceptedAt']),
      acceptedBy: _asNullableInt(json['acceptedBy']),
      createdAt: _asDate(json['createdAt']),
    );
  }

  final int id;
  final int caregiverId;
  final String userName;
  final String? userEmail;
  final int? userAge;
  final String invitationCode;
  final String status;
  final String relationship;
  final List<String> permissionsGranted;
  final DateTime? expiresAt;
  final DateTime? acceptedAt;
  final int? acceptedBy;
  final DateTime? createdAt;

  bool get isPending => status.toLowerCase() == 'pending';

  @override
  List<Object?> get props => [
        id,
        caregiverId,
        userName,
        userEmail,
        userAge,
        invitationCode,
        status,
        relationship,
        permissionsGranted,
        expiresAt,
        acceptedAt,
        acceptedBy,
        createdAt,
      ];
}

class CaregiverInvitationInput extends Equatable {
  const CaregiverInvitationInput({
    required this.userName,
    required this.relationship,
    this.userEmail,
    this.userAge,
    this.permissionsGranted = const [],
  });

  final String userName;
  final String? userEmail;
  final int? userAge;
  final String relationship;
  final List<String> permissionsGranted;

  Map<String, dynamic> toJson() => {
        'userName': userName.trim(),
        'userEmail': _nullableText(userEmail),
        'userAge': userAge,
        'relationship': relationship,
        'permissionsGranted': permissionsGranted,
      };

  @override
  List<Object?> get props => [
        userName,
        userEmail,
        userAge,
        relationship,
        permissionsGranted,
      ];
}

class CareRelationshipModel extends Equatable {
  const CareRelationshipModel({
    required this.id,
    required this.caregiverId,
    this.caregiverName,
    required this.userId,
    required this.relationship,
    required this.isPrimary,
    required this.isActive,
    required this.establishedVia,
    this.establishedAt,
  });

  factory CareRelationshipModel.fromJson(Map<String, dynamic> json) {
    return CareRelationshipModel(
      id: _asInt(json['id']),
      caregiverId: _asInt(json['caregiverId']),
      caregiverName: _asNullableString(json['caregiverName']),
      userId: _asInt(json['userId']),
      relationship: _asString(json['relationship'], fallback: 'caregiver'),
      isPrimary: json['isPrimary'] == true,
      isActive: json['isActive'] != false,
      establishedAt: _asDate(json['establishedAt']),
      establishedVia: _asString(
        json['establishedVia'],
        fallback: 'invitation',
      ),
    );
  }

  final int id;
  final int caregiverId;
  final String? caregiverName;
  final int userId;
  final String relationship;
  final bool isPrimary;
  final bool isActive;
  final DateTime? establishedAt;
  final String establishedVia;

  @override
  List<Object?> get props => [
        id,
        caregiverId,
        caregiverName,
        userId,
        relationship,
        isPrimary,
        isActive,
        establishedAt,
        establishedVia,
      ];
}

class CareRecipientSummaryModel extends Equatable {
  const CareRecipientSummaryModel({
    required this.userId,
    required this.userName,
    required this.relationship,
    required this.isPrimary,
    required this.relationshipId,
  });

  factory CareRecipientSummaryModel.fromJson(Map<String, dynamic> json) {
    return CareRecipientSummaryModel(
      userId: _asInt(json['userId']),
      userName: _asString(json['userName'], fallback: 'Care recipient'),
      relationship: _asString(json['relationship'], fallback: 'caregiver'),
      isPrimary: json['isPrimary'] == true,
      relationshipId: _asInt(json['relationshipId']),
    );
  }

  final int userId;
  final String userName;
  final String relationship;
  final bool isPrimary;
  final int relationshipId;

  @override
  List<Object?> get props => [
        userId,
        userName,
        relationship,
        isPrimary,
        relationshipId,
      ];
}

int _asInt(Object? value, {int fallback = 0}) {
  if (value is int) return value;
  return int.tryParse('$value') ?? fallback;
}

int? _asNullableInt(Object? value) {
  if (value == null) return null;
  return int.tryParse('$value');
}

String _asString(Object? value, {String fallback = ''}) {
  return value is String && value.trim().isNotEmpty ? value : fallback;
}

String? _asNullableString(Object? value) {
  if (value is! String || value.trim().isEmpty) return null;
  return value;
}

DateTime? _asDate(Object? value) {
  if (value is DateTime) return value;
  if (value == null) return null;
  return DateTime.tryParse('$value');
}

List<String> _asStringList(Object? value) {
  if (value is List) {
    return value.whereType<String>().toList();
  }
  if (value is String && value.trim().isNotEmpty) {
    return value
        .replaceAll('[', '')
        .replaceAll(']', '')
        .split(',')
        .map((item) => item.trim().replaceAll('"', ''))
        .where((item) => item.isNotEmpty)
        .toList();
  }
  return const [];
}

String? _nullableText(String? value) {
  final trimmed = value?.trim();
  return trimmed == null || trimmed.isEmpty ? null : trimmed;
}