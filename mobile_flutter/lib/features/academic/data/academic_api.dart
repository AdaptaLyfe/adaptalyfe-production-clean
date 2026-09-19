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

  Future<List<StudySessionModel>> getStudySessions() =>
      _getList('/api/study-sessions', StudySessionModel.fromJson);

  Future<StudySessionModel> createStudySession(StudySessionInput input) =>
      _post('/api/study-sessions', input.toJson(), StudySessionModel.fromJson);

  Future<StudySessionModel> completeStudySession(
    int id, {
    required int effectiveness,
  }) =>
      _patch(
        '/api/study-sessions/$id',
        {
          'completedAt': DateTime.now().toUtc().toIso8601String(),
          'effectiveness': effectiveness,
        },
        StudySessionModel.fromJson,
      );

  Future<List<CampusLocationModel>> getCampusLocations() =>
      _getList('/api/campus-locations', CampusLocationModel.fromJson);

  Future<CampusLocationModel> createCampusLocation(
    CampusLocationInput input,
  ) =>
      _post(
        '/api/campus-locations',
        input.toJson(),
        CampusLocationModel.fromJson,
      );

  Future<List<CampusTransportModel>> getCampusTransport() =>
      _getList('/api/campus-transport', CampusTransportModel.fromJson);

  Future<CampusTransportModel> createCampusTransport(
    CampusTransportInput input,
  ) =>
      _post(
        '/api/campus-transport',
        input.toJson(),
        CampusTransportModel.fromJson,
      );

  Future<List<StudyGroupModel>> getStudyGroups() =>
      _getList('/api/study-groups', StudyGroupModel.fromJson);

  Future<StudyGroupModel> createStudyGroup(StudyGroupInput input) =>
      _post('/api/study-groups', input.toJson(), StudyGroupModel.fromJson);

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

  Future<T> _patch<T>(
    String path,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    final response = await client.patch<dynamic>(path, data: data);
    if (response.data is! Map) {
      throw const FormatException('Invalid academic planner item response');
    }
    return fromJson(Map<String, dynamic>.from(response.data as Map));
  }
}