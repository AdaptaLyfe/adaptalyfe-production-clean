import 'package:equatable/equatable.dart';

class PersonalDocumentModel extends Equatable {
  const PersonalDocumentModel({
    required this.id,
    required this.title,
    required this.category,
    required this.documentType,
    required this.content,
    required this.linkUrl,
    required this.imageUrl,
    required this.isImportant,
    required this.createdAt,
    required this.updatedAt,
  });

  factory PersonalDocumentModel.fromJson(Map<String, dynamic> json) {
    return PersonalDocumentModel(
      id: _asInt(json['id']),
      title: _asString(json['title']),
      category: _asString(json['category'], fallback: 'personal'),
      documentType: _asString(json['documentType'], fallback: 'text'),
      content: _asNullableString(json['content']),
      linkUrl: _asNullableString(json['linkUrl']),
      imageUrl: _asNullableString(json['imageUrl']),
      isImportant: json['isImportant'] == true,
      createdAt: _asDate(json['createdAt']),
      updatedAt: _asDate(json['updatedAt']),
    );
  }

  final int id;
  final String title;
  final String category;
  final String documentType;
  final String? content;
  final String? linkUrl;
  final String? imageUrl;
  final bool isImportant;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  @override
  List<Object?> get props => [
        id,
        title,
        category,
        documentType,
        content,
        linkUrl,
        imageUrl,
        isImportant,
        createdAt,
        updatedAt,
      ];
}

class PersonalDocumentInput extends Equatable {
  const PersonalDocumentInput({
    required this.title,
    required this.category,
    required this.documentType,
    this.content,
    this.linkUrl,
    this.isImportant = false,
  });

  final String title;
  final String category;
  final String documentType;
  final String? content;
  final String? linkUrl;
  final bool isImportant;

  Map<String, dynamic> toJson() => {
        'title': title.trim(),
        'category': category,
        'documentType': documentType,
        'content': content?.trim() ?? '',
        'isImportant': isImportant,
        if (documentType == 'link') 'linkUrl': linkUrl?.trim() ?? '',
      };

  @override
  List<Object?> get props => [
        title,
        category,
        documentType,
        content,
        linkUrl,
        isImportant,
      ];
}

int _asInt(Object? value) => value is int ? value : int.tryParse('$value') ?? 0;

String _asString(Object? value, {String fallback = ''}) =>
    value is String && value.trim().isNotEmpty ? value : fallback;

String? _asNullableString(Object? value) =>
    value is String && value.trim().isNotEmpty ? value : null;

DateTime? _asDate(Object? value) {
  if (value is DateTime) return value.toLocal();
  if (value is String && value.trim().isNotEmpty) {
    return DateTime.tryParse(value)?.toLocal();
  }
  return null;
}