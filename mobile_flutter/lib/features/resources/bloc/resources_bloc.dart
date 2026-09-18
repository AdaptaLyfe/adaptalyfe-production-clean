import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_client.dart';
import '../data/resources_repository.dart';
import '../models/resource_models.dart';
import '../../medical/models/medical_models.dart';
import 'resources_event.dart';
import 'resources_state.dart';

class ResourcesBloc extends Bloc<ResourcesEvent, ResourcesState> {
  ResourcesBloc(this.repository) : super(const ResourcesState()) {
    on<ResourcesStarted>(_loadResources);
    on<RefreshResources>(_loadResources);
    on<FilterPersonalResources>(_filterPersonalResources);
    on<SearchPersonalResources>(_searchPersonalResources);
    on<CreatePersonalResource>(_createPersonalResource);
    on<UpdatePersonalResource>(_updatePersonalResource);
    on<DeletePersonalResource>(_deletePersonalResource);
    on<TogglePersonalFavorite>(_togglePersonalFavorite);
    on<OpenPersonalResource>(_openPersonalResource);
    on<CreateEmergencyResource>(_createEmergencyResource);
    on<UpdateEmergencyResource>(_updateEmergencyResource);
    on<DeleteEmergencyResource>(_deleteEmergencyResource);
    on<CreateEmergencyContact>(_createEmergencyContact);
    on<UpdateEmergencyContact>(_updateEmergencyContact);
    on<DeleteEmergencyContact>(_deleteEmergencyContact);
  }

  final ResourcesRepository repository;

  Future<void> _loadResources(
    ResourcesEvent event,
    Emitter<ResourcesState> emit,
  ) async {
    emit(
      state.copyWith(
        status: ResourcesStatus.loading,
        errorMessage: null,
        actionMessage: null,
        sessionInvalid: false,
      ),
    );

    try {
      final results = await Future.wait<Object>([
        repository.getPersonalResources(),
        repository.getEmergencyResources(),
        repository.getEmergencyContacts(),
      ]);
      if (emit.isDone) return;
      emit(
        state.copyWith(
          status: ResourcesStatus.loaded,
          personalResources: results[0] as List<PersonalResourceModel>,
          emergencyResources: results[1] as List<EmergencyResourceModel>,
          emergencyContacts: results[2] as List<EmergencyContactModel>,
          busyKey: null,
          errorMessage: null,
          actionMessage: null,
        ),
      );
    } on ApiException catch (error) {
      if (emit.isDone) return;
      _emitFailure(emit, error);
    } catch (error) {
      if (emit.isDone) return;
      _emitFailure(
        emit,
        error,
        fallback: 'Unable to load your resources. Please try again.',
      );
    }
  }

  void _filterPersonalResources(
    FilterPersonalResources event,
    Emitter<ResourcesState> emit,
  ) {
    emit(state.copyWith(selectedCategory: event.category));
  }

  void _searchPersonalResources(
    SearchPersonalResources event,
    Emitter<ResourcesState> emit,
  ) {
    emit(state.copyWith(searchQuery: event.query));
  }

  Future<void> _createPersonalResource(
    CreatePersonalResource event,
    Emitter<ResourcesState> emit,
  ) async {
    emit(state.copyWith(busyKey: 'personal-create', errorMessage: null));
    try {
      final created = await repository.createPersonalResource(event.input);
      if (emit.isDone) return;
      emit(
        state.copyWith(
          status: ResourcesStatus.loaded,
          personalResources: [...state.personalResources, created],
          busyKey: null,
          actionMessage: 'Personal resource added.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(emit, error, 'personal-create');
    } catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(
        emit,
        error,
        'personal-create',
        fallback: 'Unable to add that resource.',
      );
    }
  }

  Future<void> _updatePersonalResource(
    UpdatePersonalResource event,
    Emitter<ResourcesState> emit,
  ) async {
    emit(
      state.copyWith(
        busyKey: 'personal-${event.id}',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      final updated =
          await repository.updatePersonalResource(event.id, event.updates);
      if (emit.isDone) return;
      emit(
        state.copyWith(
          status: ResourcesStatus.loaded,
          personalResources: _replacePersonal(updated),
          busyKey: null,
          actionMessage: 'Personal resource updated.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(emit, error, 'personal-${event.id}');
    } catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(
        emit,
        error,
        'personal-${event.id}',
        fallback: 'Unable to update that resource.',
      );
    }
  }

  Future<void> _deletePersonalResource(
    DeletePersonalResource event,
    Emitter<ResourcesState> emit,
  ) async {
    emit(
      state.copyWith(
        busyKey: 'personal-${event.id}',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.deletePersonalResource(event.id);
      if (emit.isDone) return;
      emit(
        state.copyWith(
          personalResources: state.personalResources
              .where((resource) => resource.id != event.id)
              .toList(),
          busyKey: null,
          actionMessage: 'Personal resource deleted.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(emit, error, 'personal-${event.id}');
    } catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(
        emit,
        error,
        'personal-${event.id}',
        fallback: 'Unable to delete that resource.',
      );
    }
  }

  Future<void> _togglePersonalFavorite(
    TogglePersonalFavorite event,
    Emitter<ResourcesState> emit,
  ) async {
    add(
      UpdatePersonalResource(
        event.resource.id,
        {'isFavorite': !event.resource.isFavorite},
      ),
    );
  }

  Future<void> _openPersonalResource(
    OpenPersonalResource event,
    Emitter<ResourcesState> emit,
  ) async {
    try {
      final updated = await repository.recordPersonalResourceAccess(event.id);
      if (emit.isDone) return;
      emit(
        state.copyWith(
          personalResources: _replacePersonal(updated),
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      if (emit.isDone) return;
      // Access tracking should not prevent the URL from opening on the device.
      emit(
        state.copyWith(
          errorMessage: error.type == ApiErrorType.unauthorized
              ? error.message
              : null,
          sessionInvalid: error.type == ApiErrorType.unauthorized,
        ),
      );
    } catch (_) {
      // The caller can still open the resource even if tracking fails.
    }
  }

  Future<void> _createEmergencyResource(
    CreateEmergencyResource event,
    Emitter<ResourcesState> emit,
  ) async {
    emit(state.copyWith(busyKey: 'emergency-create', errorMessage: null));
    try {
      final created = await repository.createEmergencyResource(event.input);
      if (emit.isDone) return;
      emit(
        state.copyWith(
          status: ResourcesStatus.loaded,
          emergencyResources: [...state.emergencyResources, created],
          busyKey: null,
          actionMessage: 'Emergency resource added.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(emit, error, 'emergency-create');
    } catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(
        emit,
        error,
        'emergency-create',
        fallback: 'Unable to add that emergency resource.',
      );
    }
  }

  Future<void> _updateEmergencyResource(
    UpdateEmergencyResource event,
    Emitter<ResourcesState> emit,
  ) async {
    emit(
      state.copyWith(
        busyKey: 'emergency-${event.id}',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      final updated =
          await repository.updateEmergencyResource(event.id, event.input);
      if (emit.isDone) return;
      emit(
        state.copyWith(
          status: ResourcesStatus.loaded,
          emergencyResources: _replaceEmergency(updated),
          busyKey: null,
          actionMessage: 'Emergency resource updated.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(emit, error, 'emergency-${event.id}');
    } catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(
        emit,
        error,
        'emergency-${event.id}',
        fallback: 'Unable to update that emergency resource.',
      );
    }
  }

  Future<void> _deleteEmergencyResource(
    DeleteEmergencyResource event,
    Emitter<ResourcesState> emit,
  ) async {
    emit(
      state.copyWith(
        busyKey: 'emergency-${event.id}',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.deleteEmergencyResource(event.id);
      if (emit.isDone) return;
      emit(
        state.copyWith(
          emergencyResources: state.emergencyResources
              .where((resource) => resource.id != event.id)
              .toList(),
          busyKey: null,
          actionMessage: 'Emergency resource deleted.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(emit, error, 'emergency-${event.id}');
    } catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(
        emit,
        error,
        'emergency-${event.id}',
        fallback: 'Unable to delete that emergency resource.',
      );
    }
  }

  Future<void> _createEmergencyContact(
    CreateEmergencyContact event,
    Emitter<ResourcesState> emit,
  ) async {
    emit(state.copyWith(busyKey: 'contact-create', errorMessage: null));
    try {
      final created = await repository.createEmergencyContact(event.input);
      if (emit.isDone) return;
      emit(
        state.copyWith(
          status: ResourcesStatus.loaded,
          emergencyContacts: [...state.emergencyContacts, created],
          busyKey: null,
          actionMessage: 'Emergency contact added successfully.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(emit, error, 'contact-create');
    } catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(
        emit,
        error,
        'contact-create',
        fallback: 'Unable to add that emergency contact.',
      );
    }
  }

  Future<void> _updateEmergencyContact(
    UpdateEmergencyContact event,
    Emitter<ResourcesState> emit,
  ) async {
    emit(
      state.copyWith(
        busyKey: 'contact-${event.id}',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      final updated =
          await repository.updateEmergencyContact(event.id, event.input);
      if (emit.isDone) return;
      emit(
        state.copyWith(
          status: ResourcesStatus.loaded,
          emergencyContacts: _replaceContact(updated),
          busyKey: null,
          actionMessage: 'Emergency contact updated successfully.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(emit, error, 'contact-${event.id}');
    } catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(
        emit,
        error,
        'contact-${event.id}',
        fallback: 'Unable to update that emergency contact.',
      );
    }
  }

  Future<void> _deleteEmergencyContact(
    DeleteEmergencyContact event,
    Emitter<ResourcesState> emit,
  ) async {
    emit(
      state.copyWith(
        busyKey: 'contact-${event.id}',
        errorMessage: null,
        actionMessage: null,
      ),
    );
    try {
      await repository.deleteEmergencyContact(event.id);
      if (emit.isDone) return;
      emit(
        state.copyWith(
          emergencyContacts: state.emergencyContacts
              .where((contact) => contact.id != event.id)
              .toList(),
          busyKey: null,
          actionMessage: 'Emergency contact deleted successfully.',
          errorMessage: null,
          sessionInvalid: false,
        ),
      );
    } on ApiException catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(emit, error, 'contact-${event.id}');
    } catch (error) {
      if (emit.isDone) return;
      _emitActionFailure(
        emit,
        error,
        'contact-${event.id}',
        fallback: 'Unable to delete that emergency contact.',
      );
    }
  }

  List<PersonalResourceModel> _replacePersonal(PersonalResourceModel updated) {
    return state.personalResources
        .map((resource) => resource.id == updated.id ? updated : resource)
        .toList();
  }

  List<EmergencyResourceModel> _replaceEmergency(
    EmergencyResourceModel updated,
  ) {
    return state.emergencyResources
        .map((resource) => resource.id == updated.id ? updated : resource)
        .toList();
  }

  List<EmergencyContactModel> _replaceContact(
    EmergencyContactModel updated,
  ) {
    return state.emergencyContacts
        .map((contact) => contact.id == updated.id ? updated : contact)
        .toList();
  }

  void _emitFailure(
    Emitter<ResourcesState> emit,
    Object error, {
    String? fallback,
  }) {
    final apiError = error is ApiException ? error : null;
    emit(
      state.copyWith(
        status: ResourcesStatus.failure,
        busyKey: null,
        errorMessage: apiError?.message ??
            (error is FormatException ? error.message : fallback),
        sessionInvalid: apiError?.type == ApiErrorType.unauthorized,
      ),
    );
  }

  void _emitActionFailure(
    Emitter<ResourcesState> emit,
    Object error,
    String busyKey, {
    String? fallback,
  }) {
    final apiError = error is ApiException ? error : null;
    emit(
      state.copyWith(
        status: state.hasResources
            ? ResourcesStatus.loaded
            : ResourcesStatus.failure,
        busyKey: null,
        errorMessage: apiError?.message ??
            (error is FormatException ? error.message : fallback),
        sessionInvalid: apiError?.type == ApiErrorType.unauthorized,
      ),
    );
  }
}