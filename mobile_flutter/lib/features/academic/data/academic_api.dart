import '../../../core/network/api_client.dart';
import '../models/academic_models.dart';

class AcademicApi {
  const AcademicApi(this.client);

  final ApiClient client;

  Future<List<AcademicClassModel>> getClasses() =>
      _getList('/api/academic-classes', AcademicClassModel.fromJson);

  Future<AcademicClassModel> createClass(AcademicClassInput input) =>
      _post('/api/academic-classes', input.toJson(), AcademicClassModel.fromJson);

  Future<List<AssignmentModel>> getAssignments() =>
      _getList('/api/assignments', AssignmentModel.fromJson);

  Future<AssignmentModel> createAssignment(AssignmentInput input) =>
      _post('/api/assignments', input.toJson(), AssignmentModel.fromJson);

  Future<List<T>> _getList<T>(
    String path,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.get<dynamic>(path);
    if (response.data is! List) {
      throw const FormatException('Invalid academic planner response');
    }

    return (response.data as List)
        .whereType<Map>()
        .map((item) => fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<T> _post<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.post<dynamic>(path, data: data);
    if (response.data is! Map) {
      throw const FormatException('Invalid academic planner item response');
    }
    return fromJson(Map<String, dynamic>.from(response.data as Map));
  }
}