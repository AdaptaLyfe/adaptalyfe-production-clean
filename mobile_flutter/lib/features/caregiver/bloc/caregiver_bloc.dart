import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/caregiver_repository.dart';
import '../models/caregiver_models.dart';
import 'caregiver_event.dart';
import 'caregiver_state.dart';

class CaregiverBloc extends Bloc<CaregiverEvent, CaregiverState> {
  CaregiverBloc(this.repository) : super(const CaregiverState()) {
    on<CaregiverStarted>(_loadSetup);
    on<RefreshCaregiver>(_loadSetup);
    on<LoadCareRecipients>(_loadRecipients);
    on<CreateCaregiverInvitation>(_createInvitation);
    on<DeleteCaregiverInvitation>(_deleteInvitation);
    on<ValidateCaregiverInvitation>(_validateInvitation);
    on<ClearCaregiverInvitationValidation>(_clearInvitationValidation);
    on<AcceptCaregiverInvitation>(_acceptInvitation);
    on<RemoveCareRelationship>(_removeRelationship);
  }

  final CaregiverRepository repository;

  Future<void> _loadSetup(
    CaregiverEvent event,
    Emitter<CaregiverState> emit,
  ) async {
    final userId = event is CaregiverStarted ? event.userId : (event as RefreshCaregiver).userId;
    emit(
      state.copyWith(
        status: CaregiverStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );

    try {
      final results = await Future.wait<Object>([
        repository.getInvitations(userId),
        repository.getRelationshipsForUser(userId),
      ]);
      emit(
        state.copyWith(
          status: CaregiverStatus.loaded,
          invitations: results[0] as List<CaregiverInvitationModel>,
          relationships: results[1] as List<CareRelationshipModel>,
          busyKey: null,
          errorMessage: null,
        ),
      );
    } on ApiException catch (error) {
      _emitFailure(emit, error);
    } catch (_) {
      _emitFailure(
        emit,
        null,
        fallback: 'Unable to load caregiver settings. Please try again.',
      );
    }
  }

  Future<void> _loadRecipients(
    LoadCareRecipients event,
    Emitter<CaregiverState> emit,
  ) async {
    emit(
      state.copyWith(
        status: CaregiverStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );
    try {
      final recipients = await repository.getMyCareRecipients();
      emit(
        state.copyWith(
          status: CaregiverStatus.loaded,
          recipients: recipients,
          busyKey: null,
          errorMessage: null,
        ),
      );
    } on ApiException catch (error) {
      _emitFailure(emit, error);
    } catch (_) {
      _emitFailure(
        emit,
        null,
        fallback: 'Unable to load your care recipients. Please try again.',
      );
    }
  }

  Future<void> _createInvitation(
    CreateCaregiverInvitation event,
    Emitter<CaregiverState> emit,
  ) async {
    emit(state.copyWith(busyKey: 'create', errorMessage: null, actionMessage: null));
    try {
      final invitation = await repository.createInvitation(event.input);
      emit(
        state.copyWith(
          status: CaregiverStatus.loaded,
          invitations: [invitation, ...state.invitations],
          busyKey: null,
          actionMessage: 'Invitation created. Share the code with your caregiver.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      _emitActionFailure(emit, error, 'create');
    } catch (_) {
      _emitActionFailure(
        emit,
        null,
        'create',
        fallback: 'Unable to create the invitation.',
      );
    }
  }

  Future<void> _deleteInvitation(
    DeleteCaregiverInvitation event,
    Emitter<CaregiverState> emit,
  ) async {
    emit(state.copyWith(busyKey: 'invitation-${event.id}', errorMessage: null));
    try {
      await repository.deleteInvitation(event.id);
      emit(
        state.copyWith(
          invitations:
              state.invitations.where((item) => item.id != event.id).toList(),
          busyKey: null,
          actionMessage: 'Invitation deleted.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      _emitActionFailure(emit, error, 'invitation-${event.id}');
    } catch (_) {
      _emitActionFailure(
        emit,
        null,
        'invitation-${event.id}',
        fallback: 'Unable to delete the invitation.',
      );
    }
  }

  Future<void> _validateInvitation(
    ValidateCaregiverInvitation event,
    Emitter<CaregiverState> emit,
  ) async {
    final code = event.code.trim().toUpperCase();
    if (code.length < 6) {
      emit(
        state.copyWith(
          validatedInvitation: null,
          validationError: 'Enter a valid invitation code.',
          errorMessage: null,
        ),
      );
      return;
    }

    emit(
      state.copyWith(
        busyKey: 'validate',
        validatedInvitation: null,
        validationError: null,
        errorMessage: null,
      ),
    );
    try {
      final invitation = await repository.validateInvitation(code);
      emit(
        state.copyWith(
          validatedInvitation: invitation,
          busyKey: null,
          validationError: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      final message = error.statusCode == 404
          ? 'Invitation code not found.'
          : error.statusCode == 410
              ? 'This invitation has expired.'
              : error.message;
      emit(
        state.copyWith(
          validatedInvitation: null,
          busyKey: null,
          validationError: message,
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (_) {
      emit(
        state.copyWith(
          validatedInvitation: null,
          busyKey: null,
          validationError: 'Unable to verify this code. Please try again.',
        ),
      );
    }
  }

  void _clearInvitationValidation(
    ClearCaregiverInvitationValidation event,
    Emitter<CaregiverState> emit,
  ) {
    emit(
      state.copyWith(
        validatedInvitation: null,
        validationError: null,
        errorMessage: null,
      ),
    );
  }

  Future<void> _acceptInvitation(
    AcceptCaregiverInvitation event,
    Emitter<CaregiverState> emit,
  ) async {
    emit(
      state.copyWith(
        busyKey: 'accept',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.acceptInvitation(code: event.code, userId: event.userId);
      emit(
        state.copyWith(
          busyKey: null,
          validatedInvitation: null,
          actionMessage: 'Invitation accepted. You are now connected.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      _emitActionFailure(emit, error, 'accept');
    } catch (_) {
      _emitActionFailure(
        emit,
        null,
        'accept',
        fallback: 'Unable to accept the invitation.',
      );
    }
  }

  Future<void> _removeRelationship(
    RemoveCareRelationship event,
    Emitter<CaregiverState> emit,
  ) async {
    emit(
      state.copyWith(
        busyKey: 'relationship-${event.id}',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.removeRelationship(event.id);
      emit(
        state.copyWith(
          relationships: state.relationships
              .where((relationship) => relationship.id != event.id)
              .toList(),
          busyKey: null,
          actionMessage: 'Caregiver access removed.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      _emitActionFailure(emit, error, 'relationship-${event.id}');
    } catch (_) {
      _emitActionFailure(
        emit,
        null,
        'relationship-${event.id}',
        fallback: 'Unable to remove caregiver access.',
      );
    }
  }

  void _emitFailure(
    Emitter<CaregiverState> emit,
    ApiException? error, {
    String fallback = 'Unable to load caregiver information.',
  }) {
    emit(
      state.copyWith(
        status: CaregiverStatus.failure,
        busyKey: null,
        errorMessage: error?.message ?? fallback,
        sessionInvalid: error?.type == ApiErrorType.unauthorized,
      ),
    );
  }

  void _emitActionFailure(
    Emitter<CaregiverState> emit,
    ApiException? error,
    String busyKey, {
    String fallback = 'That caregiver action could not be completed.',
  }) {
    emit(
      state.copyWith(
        busyKey: null,
        errorMessage: error?.message ?? fallback,
        sessionInvalid: error?.type == ApiErrorType.unauthorized,
      ),
    );
  }
}