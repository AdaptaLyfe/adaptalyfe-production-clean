import '../../../core/network/api_client.dart';
import '../models/personal_document_model.dart';

class PersonalDocumentsRepository {
  const PersonalDocumentsRepository(this.client);

  final ApiClient client;

  Future<List<PersonalDocumentModel>> getDocuments() async {
    final response = await client.get<dynamic>('/api/personal-documents');
    final raw = response.data is List
        ? response.data
        : response.data is Map
            ? (response.data as Map)['documents']
            : null;
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map(
          (item) => PersonalDocumentModel.fromJson(
            Map<String, dynamic>.from(item),
          ),
        )
        .toList();
  }

  Future<PersonalDocumentModel> create(PersonalDocumentInput input) async {
    final response = await client.post<dynamic>(
      '/api/personal-documents',
      data: input.toJson(),
    );
    return _parseDocument(response.data);
  }

  Future<PersonalDocumentModel> update(
    int id,
    PersonalDocumentInput input,
  ) async {
    final response = await client.patch<dynamic>(
      '/api/personal-documents/$id',
      data: input.toJson(),
    );
    return _parseDocument(response.data);
  }

  Future<void> delete(int id) async {
    await client.delete<dynamic>('/api/personal-documents/$id');
  }

  PersonalDocumentModel _parseDocument(dynamic value) {
    if (value is! Map) {
      throw const FormatException('Invalid personal document response');
    }
    return PersonalDocumentModel.fromJson(Map<String, dynamic>.from(value));
  }
}