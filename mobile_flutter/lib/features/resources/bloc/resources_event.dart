import 'package:equatable/equatable.dart';

import '../models/resource_models.dart';

sealed class ResourcesEvent extends Equatable {
  const ResourcesEvent();

  @override
  List<Object?> get props => [];
}

final class ResourcesStarted extends ResourcesEvent {
  const ResourcesStarted();
}

final class RefreshResources extends ResourcesEvent {
  const RefreshResources();
}

final class FilterPersonalResources extends ResourcesEvent {
  const FilterPersonalResources(this.category);

  final String category;

  @override
  List<Object?> get props => [category];
}

final class SearchPersonalResources extends ResourcesEvent {
  const SearchPersonalResources(this.query);

  final String query;

  @override
  List<Object?> get props => [query];
}

final class CreatePersonalResource extends ResourcesEvent {
  const CreatePersonalResource(this.input);

  final PersonalResourceInput input;

  @override
  List<Object?> get props => [input];
}

final class UpdatePersonalResource extends ResourcesEvent {
  const UpdatePersonalResource(this.id, this.updates);

  final int id;
  final Map<String, dynamic> updates;

  @override
  List<Object?> get props => [id, updates];
}

final class DeletePersonalResource extends ResourcesEvent {
  const DeletePersonalResource(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}

final class TogglePersonalFavorite extends ResourcesEvent {
  const TogglePersonalFavorite(this.resource);

  final PersonalResourceModel resource;

  @override
  List<Object?> get props => [resource];
}

final class OpenPersonalResource extends ResourcesEvent {
  const OpenPersonalResource(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}

final class CreateEmergencyResource extends ResourcesEvent {
  const CreateEmergencyResource(this.input);

  final EmergencyResourceInput input;

  @override
  List<Object?> get props => [input];
}

final class UpdateEmergencyResource extends ResourcesEvent {
  const UpdateEmergencyResource(this.id, this.input);

  final int id;
  final EmergencyResourceInput input;

  @override
  List<Object?> get props => [id, input];
}

final class DeleteEmergencyResource extends ResourcesEvent {
  const DeleteEmergencyResource(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}