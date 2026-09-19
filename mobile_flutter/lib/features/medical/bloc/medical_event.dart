import 'package:equatable/equatable.dart';

import '../models/medical_models.dart';

sealed class MedicalEvent extends Equatable {
  const MedicalEvent();

  @override
  List<Object?> get props => [];
}

final class MedicalStarted extends MedicalEvent {
  const MedicalStarted();
}

final class RefreshMedical extends MedicalEvent {
  const RefreshMedical();
}

final class AddCondition extends MedicalEvent {
  const AddCondition(this.input);

  final MedicalConditionInput input;

  @override
  List<Object?> get props => [input];
}

final class EditCondition extends MedicalEvent {
  const EditCondition(this.id, this.input);

  final int id;
  final MedicalConditionInput input;

  @override
  List<Object?> get props => [id, input];
}

final class DeleteCondition extends MedicalEvent {
  const DeleteCondition(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}

final class AddMedication extends MedicalEvent {
  const AddMedication(this.input);

  final MedicationInput input;

  @override
  List<Object?> get props => [input];
}

final class AddCustomPharmacy extends MedicalEvent {
  const AddCustomPharmacy(this.input);

  final PharmacyInput input;

  @override
  List<Object?> get props => [input];
}

final class LinkPharmacy extends MedicalEvent {
  const LinkPharmacy(this.input);

  final UserPharmacyInput input;

  @override
  List<Object?> get props => [input];
}

final class CreateRefillReminder extends MedicalEvent {
  const CreateRefillReminder(this.input);

  final RefillOrderInput input;

  @override
  List<Object?> get props => [input];
}

final class AddAllergy extends MedicalEvent {
  const AddAllergy(this.input);

  final AllergyInput input;

  @override
  List<Object?> get props => [input];
}

final class EditAllergy extends MedicalEvent {
  const EditAllergy(this.id, this.input);

  final int id;
  final AllergyInput input;

  @override
  List<Object?> get props => [id, input];
}

final class DeleteAllergy extends MedicalEvent {
  const DeleteAllergy(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}

final class AddEmergencyContact extends MedicalEvent {
  const AddEmergencyContact(this.input);

  final EmergencyContactInput input;

  @override
  List<Object?> get props => [input];
}

final class EditEmergencyContact extends MedicalEvent {
  const EditEmergencyContact(this.id, this.input);

  final int id;
  final EmergencyContactInput input;

  @override
  List<Object?> get props => [id, input];
}

final class DeleteEmergencyContact extends MedicalEvent {
  const DeleteEmergencyContact(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}

final class AddAdverseMedication extends MedicalEvent {
  const AddAdverseMedication(this.input);

  final AdverseMedicationInput input;

  @override
  List<Object?> get props => [input];
}

final class EditAdverseMedication extends MedicalEvent {
  const EditAdverseMedication(this.id, this.input);

  final int id;
  final AdverseMedicationInput input;

  @override
  List<Object?> get props => [id, input];
}

final class DeleteAdverseMedication extends MedicalEvent {
  const DeleteAdverseMedication(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}

final class AddPrimaryCareProvider extends MedicalEvent {
  const AddPrimaryCareProvider(this.input);

  final PrimaryCareProviderInput input;

  @override
  List<Object?> get props => [input];
}

final class EditPrimaryCareProvider extends MedicalEvent {
  const EditPrimaryCareProvider(this.id, this.input);

  final int id;
  final PrimaryCareProviderInput input;

  @override
  List<Object?> get props => [id, input];
}

final class DeletePrimaryCareProvider extends MedicalEvent {
  const DeletePrimaryCareProvider(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}

final class AddSymptomEntry extends MedicalEvent {
  const AddSymptomEntry(this.input);

  final SymptomEntryInput input;

  @override
  List<Object?> get props => [input];
}

final class EditSymptomEntry extends MedicalEvent {
  const EditSymptomEntry(this.id, this.input);

  final int id;
  final SymptomEntryInput input;

  @override
  List<Object?> get props => [id, input];
}

final class DeleteSymptomEntry extends MedicalEvent {
  const DeleteSymptomEntry(this.id);

  final int id;

  @override
  List<Object?> get props => [id];
}