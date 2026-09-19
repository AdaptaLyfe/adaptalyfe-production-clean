import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/academic_repository.dart';
import '../models/academic_models.dart';
import 'academic_event.dart';
import 'academic_state.dart';

class AcademicBloc extends Bloc<AcademicEvent, AcademicState> {
  AcademicBloc(this.repository) : super(const AcademicState()) {
    on<AcademicStarted>(_load);
    on<RefreshAcademic>(_load);
    on<AddAcademicClass>(_addClass);
    on<AddAssignment>(_addAssignment);
    on<AddStudySession>(_addStudySession);
    on<CompleteStudySession>(_completeStudySession);
    on<AddCampusLocation>(_addCampusLocation);
    on<AddCampusTransport>(_addCampusTransport);
    on<AddStudyGroup>(_addStudyGroup);
    on<SetAssignmentFilter>(_setAssignmentFilter);
  }

  final AcademicRepository repository;

  Future<void> _load(
    AcademicEvent event,
    Emitter<AcademicState> emit,
  ) async {
    emit(
      state.copyWith(
        status: AcademicStatus.loading,
        action: AcademicAction.none,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );

    try {
      final results = await Future.wait<Object>([
        repository.getClasses(),
        repository.getAssignments(),
        repository.getStudySessions(),
        repository.getCampusLocations(),
        repository.getCampusTransport(),
        repository.getStudyGroups(),
      ]);
      _emitLoaded(
        emit,
        results[0] as List<AcademicClassModel>,
        results[1] as List<AssignmentModel>,
        studySessions: results[2] as List<StudySessionModel>,
        campusLocations: results[3] as List<CampusLocationModel>,
        campusTransport: results[4] as List<CampusTransportModel>,
        studyGroups: results[5] as List<StudyGroupModel>,
      );
    } catch (error) {
      _emitFailure(emit, error);
    }
  }

  Future<void> _addStudyGroup(
    AddStudyGroup event,
    Emitter<AcademicState> emit,
  ) async {
    emit(
      state.copyWith(
        action: AcademicAction.addingStudyGroup,
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.createStudyGroup(event.input);
      await _reloadAfterMutation(
        emit,
        successMessage: 'Study group created successfully.',
      );
    } catch (error) {
      _emitActionFailure(
        emit,
        error,
        'Failed to create study group. Please try again.',
      );
    }
  }

  Future<void> _addClass(
    AddAcademicClass event,
    Emitter<AcademicState> emit,
  ) async {
    emit(
      state.copyWith(
        action: AcademicAction.addingClass,
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.createClass(event.input);
      await _reloadAfterMutation(
        emit,
        successMessage: 'Class added successfully.',
      );
    } catch (error) {
      _emitActionFailure(emit, error, 'Failed to add class. Please try again.');
    }
  }

  Future<void> _addAssignment(
    AddAssignment event,
    Emitter<AcademicState> emit,
  ) async {
    emit(
      state.copyWith(
        action: AcademicAction.addingAssignment,
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.createAssignment(event.input);
      await _reloadAfterMutation(
        emit,
        successMessage: 'Assignment added successfully.',
      );
    } catch (error) {
      _emitActionFailure(
        emit,
        error,
        'Failed to add assignment. Please try again.',
      );
    }
  }

  Future<void> _addStudySession(
    AddStudySession event,
    Emitter<AcademicState> emit,
  ) async {
    emit(
      state.copyWith(
        action: AcademicAction.addingStudySession,
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.createStudySession(event.input);
      await _reloadAfterMutation(
        emit,
        successMessage: 'Study session started successfully.',
      );
    } catch (error) {
      _emitActionFailure(
        emit,
        error,
        'Failed to start study session. Please try again.',
      );
    }
  }

  Future<void> _completeStudySession(
    CompleteStudySession event,
    Emitter<AcademicState> emit,
  ) async {
    emit(
      state.copyWith(
        action: AcademicAction.completingStudySession,
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.completeStudySession(
        event.sessionId,
        effectiveness: event.effectiveness,
      );
      await _reloadAfterMutation(
        emit,
        successMessage: 'Study session completed.',
      );
    } catch (error) {
      _emitActionFailure(
        emit,
        error,
        'Failed to complete study session. Please try again.',
      );
    }
  }

  Future<void> _addCampusLocation(
    AddCampusLocation event,
    Emitter<AcademicState> emit,
  ) async {
    emit(
      state.copyWith(
        action: AcademicAction.addingCampusLocation,
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.createCampusLocation(event.input);
      await _reloadAfterMutation(
        emit,
        successMessage: 'Campus location added successfully.',
      );
    } catch (error) {
      _emitActionFailure(
        emit,
        error,
        'Failed to add campus location. Please try again.',
      );
    }
  }

  Future<void> _addCampusTransport(
    AddCampusTransport event,
    Emitter<AcademicState> emit,
  ) async {
    emit(
      state.copyWith(
        action: AcademicAction.addingCampusTransport,
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.createCampusTransport(event.input);
      await _reloadAfterMutation(
        emit,
        successMessage: 'Campus route added successfully.',
      );
    } catch (error) {
      _emitActionFailure(
        emit,
        error,
        'Failed to add campus route. Please try again.',
      );
    }
  }

  void _setAssignmentFilter(
    SetAssignmentFilter event,
    Emitter<AcademicState> emit,
  ) {
    emit(
      state.copyWith(
        assignmentFilter: event.filter,
        errorMessage: null,
        actionMessage: null,
      ),
    );
  }

  Future<void> _reloadAfterMutation(
    Emitter<AcademicState> emit, {
    required String successMessage,
  }) async {
    final results = await Future.wait<Object>([
      repository.getClasses(),
      repository.getAssignments(),
      repository.getStudySessions(),
      repository.getCampusLocations(),
      repository.getCampusTransport(),
      repository.getStudyGroups(),
    ]);
    _emitLoaded(
      emit,
      results[0] as List<AcademicClassModel>,
      results[1] as List<AssignmentModel>,
      studySessions: results[2] as List<StudySessionModel>,
      campusLocations: results[3] as List<CampusLocationModel>,
      campusTransport: results[4] as List<CampusTransportModel>,
      studyGroups: results[5] as List<StudyGroupModel>,
      actionMessage: successMessage,
    );
  }

  void _emitLoaded(
    Emitter<AcademicState> emit,
    List<AcademicClassModel> classes,
    List<AssignmentModel> assignments, {
    required List<StudySessionModel> studySessions,
    required List<CampusLocationModel> campusLocations,
    required List<CampusTransportModel> campusTransport,
    required List<StudyGroupModel> studyGroups,
    String? actionMessage,
  }) {
    emit(
      state.copyWith(
        status: AcademicStatus.loaded,
        classes: classes,
        assignments: assignments,
        studySessions: studySessions,
        campusLocations: campusLocations,
        campusTransport: campusTransport,
        studyGroups: studyGroups,
        action: AcademicAction.none,
        errorMessage: null,
        actionMessage: actionMessage,
        sessionInvalid: false,
      ),
    );
  }

  void _emitFailure(Emitter<AcademicState> emit, Object error) {
    emit(
      state.copyWith(
        status: state.hasData ? AcademicStatus.loaded : AcademicStatus.failure,
        action: AcademicAction.none,
        errorMessage: _messageFor(error),
        actionMessage: null,
        sessionInvalid:
            error is ApiException && error.type == ApiErrorType.unauthorized,
      ),
    );
  }

  void _emitActionFailure(
    Emitter<AcademicState> emit,
    Object error,
    String fallback,
  ) {
    emit(
      state.copyWith(
        status: state.hasData ? AcademicStatus.loaded : AcademicStatus.failure,
        action: AcademicAction.none,
        errorMessage: error is ApiException ? error.message : fallback,
        actionMessage: null,
        sessionInvalid:
            error is ApiException && error.type == ApiErrorType.unauthorized,
      ),
    );
  }

  String _messageFor(Object error) {
    if (error is ApiException) return error.message;
    if (error is FormatException) return error.message;
    return 'Unable to load your academic planner. Please try again.';
  }
}