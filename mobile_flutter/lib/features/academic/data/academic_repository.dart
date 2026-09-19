import '../models/academic_models.dart';
import 'academic_api.dart';

class AcademicRepository {
  const AcademicRepository(this.api);

  final AcademicApi api;

  Future<List<AcademicClassModel>> getClasses() => api.getClasses();

  Future<AcademicClassModel> createClass(AcademicClassInput input) =>
      api.createClass(input);

  Future<List<AssignmentModel>> getAssignments() => api.getAssignments();

  Future<AssignmentModel> createAssignment(AssignmentInput input) =>
      api.createAssignment(input);

  Future<List<StudySessionModel>> getStudySessions() =>
      api.getStudySessions();

  Future<StudySessionModel> createStudySession(StudySessionInput input) =>
      api.createStudySession(input);

  Future<StudySessionModel> completeStudySession(
    int id, {
    required int effectiveness,
  }) =>
      api.completeStudySession(id, effectiveness: effectiveness);

  Future<List<CampusLocationModel>> getCampusLocations() =>
      api.getCampusLocations();

  Future<CampusLocationModel> createCampusLocation(
    CampusLocationInput input,
  ) =>
      api.createCampusLocation(input);

  Future<List<CampusTransportModel>> getCampusTransport() =>
      api.getCampusTransport();

  Future<CampusTransportModel> createCampusTransport(
    CampusTransportInput input,
  ) =>
      api.createCampusTransport(input);

  Future<List<StudyGroupModel>> getStudyGroups() => api.getStudyGroups();
  Future<StudyGroupModel> createStudyGroup(StudyGroupInput input) =>
      api.createStudyGroup(input);
}