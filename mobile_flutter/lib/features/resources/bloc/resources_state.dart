import 'package:equatable/equatable.dart';

import '../models/resource_models.dart';
import '../../medical/models/medical_models.dart';

enum ResourcesStatus {
  initial,
  loading,
  loaded,
  failure,
}

class ResourcesState extends Equatable {
  const ResourcesState({
    this.status = ResourcesStatus.initial,
    this.personalResources = const [],
    this.emergencyResources = const [],
    this.emergencyContacts = const [],
    this.selectedCategory = 'all',
    this.searchQuery = '',
    this.busyKey,
    this.errorMessage,
    this.actionMessage,
    this.sessionInvalid = false,
  });

  final ResourcesStatus status;
  final List<PersonalResourceModel> personalResources;
  final List<EmergencyResourceModel> emergencyResources;
  final List<EmergencyContactModel> emergencyContacts;
  final String selectedCategory;
  final String searchQuery;
  final String? busyKey;
  final String? errorMessage;
  final String? actionMessage;
  final bool sessionInvalid;

  bool get isLoading => status == ResourcesStatus.loading;
  bool get hasResources =>
      personalResources.isNotEmpty ||
      emergencyResources.isNotEmpty ||
      emergencyContacts.isNotEmpty;

  List<PersonalResourceModel> get visiblePersonalResources {
    final query = searchQuery.trim().toLowerCase();
    return personalResources.where((resource) {
      final matchesCategory = selectedCategory == 'all' ||
          resource.category.toLowerCase() == selectedCategory.toLowerCase();
      if (!matchesCategory) return false;
      if (query.isEmpty) return true;
      final searchable = [
        resource.title,
        resource.url,
        resource.description ?? '',
        resource.category,
        resource.tags ?? '',
      ].join(' ').toLowerCase();
      return searchable.contains(query);
    }).toList();
  }

  List<String> get categories {
    return const [
      'all',
      'music',
      'videos',
      'websites',
      'apps',
      'relaxation',
      'entertainment',
      'other',
    ];
  }

  ResourcesState copyWith({
    ResourcesStatus? status,
    List<PersonalResourceModel>? personalResources,
    List<EmergencyResourceModel>? emergencyResources,
    List<EmergencyContactModel>? emergencyContacts,
    String? selectedCategory,
    String? searchQuery,
    Object? busyKey = _notSet,
    Object? errorMessage = _notSet,
    Object? actionMessage = _notSet,
    bool? sessionInvalid,
  }) {
    return ResourcesState(
      status: status ?? this.status,
      personalResources: personalResources ?? this.personalResources,
      emergencyResources: emergencyResources ?? this.emergencyResources,
      emergencyContacts: emergencyContacts ?? this.emergencyContacts,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      searchQuery: searchQuery ?? this.searchQuery,
      busyKey: identical(busyKey, _notSet) ? this.busyKey : busyKey as String?,
      errorMessage: identical(errorMessage, _notSet)
          ? this.errorMessage
          : errorMessage as String?,
      actionMessage: identical(actionMessage, _notSet)
          ? this.actionMessage
          : actionMessage as String?,
      sessionInvalid: sessionInvalid ?? this.sessionInvalid,
    );
  }

  @override
  List<Object?> get props => [
        status,
        personalResources,
        emergencyResources,
        emergencyContacts,
        selectedCategory,
        searchQuery,
        busyKey,
        errorMessage,
        actionMessage,
        sessionInvalid,
      ];
}

const _notSet = Object();