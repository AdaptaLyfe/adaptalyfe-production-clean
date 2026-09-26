import 'dart:async';

import 'package:adaptalyfe_mobile/features/caregiver/bloc/caregiver_bloc.dart';
import 'package:adaptalyfe_mobile/features/caregiver/bloc/caregiver_event.dart';
import 'package:adaptalyfe_mobile/features/caregiver/bloc/caregiver_state.dart';
import 'package:adaptalyfe_mobile/features/caregiver/data/caregiver_api.dart';
import 'package:adaptalyfe_mobile/features/caregiver/data/caregiver_repository.dart';
import 'package:adaptalyfe_mobile/features/caregiver/models/caregiver_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('an older setup response cannot replace a newer relationship snapshot',
      () async {
    final repository = _ControlledCaregiverRepository();
    final bloc = CaregiverBloc(repository);
    addTearDown(bloc.close);

    bloc.add(const CaregiverStarted(7));
    await repository.firstLoadStarted.future.timeout(
      const Duration(seconds: 2),
    );

    bloc.add(const RefreshCaregiver(7));
    await repository.secondLoadStarted.future.timeout(
      const Duration(seconds: 2),
    );

    final latestLoad = bloc.stream.firstWhere(
      (state) =>
          state.status == CaregiverStatus.loaded &&
          state.relationships.any((relationship) => relationship.id == 42),
    );
    repository.completeSecondLoad();
    await latestLoad.timeout(const Duration(seconds: 2));

    repository.completeFirstLoad();
    await Future<void>.delayed(Duration.zero);

    expect(
      bloc.state.relationships.map((relationship) => relationship.id),
      [42],
    );
    expect(bloc.state.invitations, isEmpty);
  });
}

class _ControlledCaregiverRepository implements CaregiverRepository {
  final firstInvitations = Completer<List<CaregiverInvitationModel>>();
  final firstRelationships = Completer<List<CareRelationshipModel>>();
  final secondInvitations = Completer<List<CaregiverInvitationModel>>();
  final secondRelationships = Completer<List<CareRelationshipModel>>();
  final firstLoadStarted = Completer<void>();
  final secondLoadStarted = Completer<void>();
  var _invitationCalls = 0;
  var _relationshipCalls = 0;

  @override
  CaregiverApi get api => throw UnimplementedError();

  @override
  Future<List<CaregiverInvitationModel>> getInvitations(int userId) {
    final call = _invitationCalls++;
    if (call == 0) {
      firstLoadStarted.complete();
      return firstInvitations.future;
    }
    if (call == 1) {
      secondLoadStarted.complete();
      return secondInvitations.future;
    }
    throw StateError('Unexpected invitation request $call');
  }

  @override
  Future<List<CareRelationshipModel>> getRelationshipsForUser(int userId) {
    final call = _relationshipCalls++;
    if (call == 0) return firstRelationships.future;
    if (call == 1) return secondRelationships.future;
    throw StateError('Unexpected relationship request $call');
  }

  void completeFirstLoad() {
    firstInvitations.complete([_pendingInvitation()]);
    firstRelationships.complete([]);
  }

  void completeSecondLoad() {
    secondInvitations.complete([]);
    secondRelationships.complete([_activeRelationship()]);
  }

  @override
  Future<CaregiverInvitationModel> createInvitation(
    CaregiverInvitationInput input,
  ) =>
      throw UnimplementedError();

  @override
  Future<void> deleteInvitation(int id) => throw UnimplementedError();

  @override
  Future<CaregiverInvitationModel> validateInvitation(String code) =>
      throw UnimplementedError();

  @override
  Future<CaregiverInvitationModel> acceptInvitation({
    required String code,
    required int userId,
  }) =>
      throw UnimplementedError();

  @override
  Future<void> removeRelationship(int id) => throw UnimplementedError();

  @override
  Future<List<CareRecipientSummaryModel>> getMyCareRecipients() =>
      throw UnimplementedError();
}

CaregiverInvitationModel _pendingInvitation() => CaregiverInvitationModel(
      id: 8,
      caregiverId: 7,
      userName: 'Taylor',
      invitationCode: 'ABC123',
      status: 'pending',
      relationship: 'sibling',
      permissionsGranted: const [],
      expiresAt: DateTime.utc(2026, 10, 1),
    );

CareRelationshipModel _activeRelationship() => const CareRelationshipModel(
      id: 42,
      caregiverId: 15,
      caregiverName: 'Taylor',
      userId: 7,
      relationship: 'sibling',
      isPrimary: false,
      isActive: true,
      establishedVia: 'invitation',
    );