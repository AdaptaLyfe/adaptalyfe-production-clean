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
  Future<List<StudyGroupModel>> getStudyGroups() => api.getStudyGroups();
  Future<StudyGroupModel> createStudyGroup(StudyGroupInput input) =>
      api.createStudyGroup(input);
}