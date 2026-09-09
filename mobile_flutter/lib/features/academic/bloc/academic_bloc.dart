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
      ]);
      _emitLoaded(
        emit,
        results[0] as List<AcademicClassModel>,
        results[1] as List<AssignmentModel>,
      );
    } catch (error) {
      _emitFailure(emit, error);
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
    ]);
    _emitLoaded(
      emit,
      results[0] as List<AcademicClassModel>,
      results[1] as List<AssignmentModel>,
      actionMessage: successMessage,
    );
  }

  void _emitLoaded(
    Emitter<AcademicState> emit,
    List<AcademicClassModel> classes,
    List<AssignmentModel> assignments, {
    String? actionMessage,
  }) {
    emit(
      state.copyWith(
        status: AcademicStatus.loaded,
        classes: classes,
        assignments: assignments,
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