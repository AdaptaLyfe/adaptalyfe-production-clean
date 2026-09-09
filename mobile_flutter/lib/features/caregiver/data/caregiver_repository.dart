import '../models/caregiver_models.dart';
import 'caregiver_api.dart';

class CaregiverRepository {
  const CaregiverRepository(this.api);

  final CaregiverApi api;

  Future<List<CaregiverInvitationModel>> getInvitations(int userId) =>
      api.getInvitations(userId);

  Future<CaregiverInvitationModel> createInvitation(
    CaregiverInvitationInput input,
  ) =>
      api.createInvitation(input);

  Future<void> deleteInvitation(int id) => api.deleteInvitation(id);

  Future<CaregiverInvitationModel> validateInvitation(String code) =>
      api.validateInvitation(code);

  Future<CaregiverInvitationModel> acceptInvitation({
    required String code,
    required int userId,
  }) =>
      api.acceptInvitation(code: code, userId: userId);

  Future<List<CareRelationshipModel>> getRelationshipsForUser(int userId) =>
      api.getRelationshipsForUser(userId);

  Future<void> removeRelationship(int id) => api.removeRelationship(id);

  Future<List<CareRecipientSummaryModel>> getMyCareRecipients() =>
      api.getMyCareRecipients();
}