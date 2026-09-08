import 'package:equatable/equatable.dart';

class MedicalConditionModel extends Equatable {
  const MedicalConditionModel({
    required this.id,
    required this.condition,
    required this.status,
    required this.diagnosedDate,
    required this.notes,
  });

  factory MedicalConditionModel.fromJson(Map<String, dynamic> json) {
    return MedicalConditionModel(
      id: _asInt(json['id']),
      condition: _asString(json['condition']),
      status: _asString(json['status'], fallback: 'active'),
      diagnosedDate: _asDate(json['diagnosedDate']),
      notes: _asNullableString(json['notes']),
    );
  }

  final int id;
  final String condition;
  final String status;
  final DateTime? diagnosedDate;
  final String? notes;

  @override
  List<Object?> get props => [id, condition, status, diagnosedDate, notes];
}

class MedicalConditionInput extends Equatable {
  const MedicalConditionInput({
    required this.condition,
    required this.status,
    this.diagnosedDate,
    this.notes,
  });

  final String condition;
  final String status;
  final DateTime? diagnosedDate;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'condition': condition.trim(),
        'status': status,
        if (diagnosedDate != null)
          'diagnosedDate': _dateOnly(diagnosedDate!),
        if (_hasText(notes)) 'notes': notes!.trim(),
      };

  @override
  List<Object?> get props => [condition, status, diagnosedDate, notes];
}

class MedicationModel extends Equatable {
  const MedicationModel({
    required this.id,
    required this.medicationName,
    required this.dosage,
    required this.prescriptionNumber,
    required this.quantity,
    required this.refillsRemaining,
    required this.prescribedBy,
    required this.pharmacyId,
    required this.lastFilled,
    required this.nextRefillDate,
    required this.instructions,
    required this.pillColor,
    required this.pillShape,
    required this.pillSize,
    required this.pillMarkings,
    required this.pillDescription,
    required this.isActive,
    required this.reminderEnabled,
  });

  factory MedicationModel.fromJson(Map<String, dynamic> json) {
    return MedicationModel(
      id: _asInt(json['id']),
      medicationName: _asString(json['medicationName']),
      dosage: _asNullableString(json['dosage']),
      prescriptionNumber: _asNullableString(json['prescriptionNumber']),
      quantity: _asNullableInt(json['quantity']),
      refillsRemaining: _asNullableInt(json['refillsRemaining']) ?? 0,
      prescribedBy: _asNullableString(json['prescribedBy']),
      pharmacyId: _asNullableInt(json['pharmacyId']),
      lastFilled: _asDate(json['lastFilled']),
      nextRefillDate: _asDate(json['nextRefillDate']),
      instructions: _asNullableString(json['instructions']),
      pillColor: _asNullableString(json['pillColor']),
      pillShape: _asNullableString(json['pillShape']),
      pillSize: _asNullableString(json['pillSize']),
      pillMarkings: _asNullableString(json['pillMarkings']),
      pillDescription: _asNullableString(json['pillDescription']),
      isActive: json['isActive'] != false,
      reminderEnabled: json['reminderEnabled'] != false,
    );
  }

  final int id;
  final String medicationName;
  final String? dosage;
  final String? prescriptionNumber;
  final int? quantity;
  final int refillsRemaining;
  final String? prescribedBy;
  final int? pharmacyId;
  final DateTime? lastFilled;
  final DateTime? nextRefillDate;
  final String? instructions;
  final String? pillColor;
  final String? pillShape;
  final String? pillSize;
  final String? pillMarkings;
  final String? pillDescription;
  final bool isActive;
  final bool reminderEnabled;

  @override
  List<Object?> get props => [
        id,
        medicationName,
        dosage,
        prescriptionNumber,
        quantity,
        refillsRemaining,
        prescribedBy,
        pharmacyId,
        lastFilled,
        nextRefillDate,
        instructions,
        pillColor,
        pillShape,
        pillSize,
        pillMarkings,
        pillDescription,
        isActive,
        reminderEnabled,
      ];
}

class MedicationInput extends Equatable {
  const MedicationInput({
    required this.medicationName,
    this.dosage,
    this.prescriptionNumber,
    this.quantity,
    this.refillsRemaining,
    this.prescribedBy,
    this.pharmacyId,
    this.nextRefillDate,
    this.instructions,
    this.pillColor,
    this.pillShape,
    this.pillSize,
    this.pillMarkings,
    this.pillDescription,
  });

  final String medicationName;
  final String? dosage;
  final String? prescriptionNumber;
  final int? quantity;
  final int? refillsRemaining;
  final String? prescribedBy;
  final int? pharmacyId;
  final DateTime? nextRefillDate;
  final String? instructions;
  final String? pillColor;
  final String? pillShape;
  final String? pillSize;
  final String? pillMarkings;
  final String? pillDescription;

  Map<String, dynamic> toJson() => {
        'medicationName': medicationName.trim(),
        if (_hasText(dosage)) 'dosage': dosage!.trim(),
        if (_hasText(prescriptionNumber))
          'prescriptionNumber': prescriptionNumber!.trim(),
        if (quantity != null) 'quantity': quantity,
        if (refillsRemaining != null) 'refillsRemaining': refillsRemaining,
        if (_hasText(prescribedBy)) 'prescribedBy': prescribedBy!.trim(),
        if (pharmacyId != null) 'pharmacyId': pharmacyId,
        if (nextRefillDate != null)
          'nextRefillDate': _dateOnly(nextRefillDate!),
        if (_hasText(instructions)) 'instructions': instructions!.trim(),
        if (_hasText(pillColor)) 'pillColor': pillColor!.trim(),
        if (_hasText(pillShape)) 'pillShape': pillShape!.trim(),
        if (_hasText(pillSize)) 'pillSize': pillSize!.trim(),
        if (_hasText(pillMarkings)) 'pillMarkings': pillMarkings!.trim(),
        if (_hasText(pillDescription))
          'pillDescription': pillDescription!.trim(),
      };

  @override
  List<Object?> get props => [
        medicationName,
        dosage,
        prescriptionNumber,
        quantity,
        refillsRemaining,
        prescribedBy,
        pharmacyId,
        nextRefillDate,
        instructions,
        pillColor,
        pillShape,
        pillSize,
        pillMarkings,
        pillDescription,
      ];
}

class AllergyModel extends Equatable {
  const AllergyModel({
    required this.id,
    required this.allergen,
    required this.severity,
    required this.reaction,
    required this.notes,
  });

  factory AllergyModel.fromJson(Map<String, dynamic> json) {
    return AllergyModel(
      id: _asInt(json['id']),
      allergen: _asString(json['allergen']),
      severity: _asString(json['severity'], fallback: 'mild'),
      reaction: _asNullableString(json['reaction']),
      notes: _asNullableString(json['notes']),
    );
  }

  final int id;
  final String allergen;
  final String severity;
  final String? reaction;
  final String? notes;

  @override
  List<Object?> get props => [id, allergen, severity, reaction, notes];
}

class AllergyInput extends Equatable {
  const AllergyInput({
    required this.allergen,
    required this.severity,
    this.reaction,
    this.notes,
  });

  final String allergen;
  final String severity;
  final String? reaction;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'allergen': allergen.trim(),
        'severity': severity,
        if (_hasText(reaction)) 'reaction': reaction!.trim(),
        if (_hasText(notes)) 'notes': notes!.trim(),
      };

  @override
  List<Object?> get props => [allergen, severity, reaction, notes];
}

class EmergencyContactModel extends Equatable {
  const EmergencyContactModel({
    required this.id,
    required this.name,
    required this.relationship,
    required this.phoneNumber,
    required this.email,
    required this.address,
    required this.isPrimary,
    required this.isEmergencyContact,
    required this.notes,
  });

  factory EmergencyContactModel.fromJson(Map<String, dynamic> json) {
    return EmergencyContactModel(
      id: _asInt(json['id']),
      name: _asString(json['name']),
      relationship: _asNullableString(json['relationship']),
      phoneNumber: _asString(json['phoneNumber']),
      email: _asNullableString(json['email']),
      address: _asNullableString(json['address']),
      isPrimary: json['isPrimary'] == true,
      isEmergencyContact: json['isEmergencyContact'] != false,
      notes: _asNullableString(json['notes']),
    );
  }

  final int id;
  final String name;
  final String? relationship;
  final String phoneNumber;
  final String? email;
  final String? address;
  final bool isPrimary;
  final bool isEmergencyContact;
  final String? notes;

  @override
  List<Object?> get props => [
        id,
        name,
        relationship,
        phoneNumber,
        email,
        address,
        isPrimary,
        isEmergencyContact,
        notes,
      ];
}

class EmergencyContactInput extends Equatable {
  const EmergencyContactInput({
    required this.name,
    this.relationship,
    required this.phoneNumber,
    this.email,
    this.address,
    this.isPrimary = false,
    this.isEmergencyContact = true,
    this.notes,
  });

  final String name;
  final String? relationship;
  final String phoneNumber;
  final String? email;
  final String? address;
  final bool isPrimary;
  final bool isEmergencyContact;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'name': name.trim(),
        if (_hasText(relationship)) 'relationship': relationship!.trim(),
        'phoneNumber': phoneNumber.trim(),
        if (_hasText(email)) 'email': email!.trim(),
        if (_hasText(address)) 'address': address!.trim(),
        'isPrimary': isPrimary,
        'isEmergencyContact': isEmergencyContact,
        if (_hasText(notes)) 'notes': notes!.trim(),
      };

  @override
  List<Object?> get props => [
        name,
        relationship,
        phoneNumber,
        email,
        address,
        isPrimary,
        isEmergencyContact,
        notes,
      ];
}

String _asString(Object? value, {String fallback = ''}) =>
    value is String ? value : fallback;

String? _asNullableString(Object? value) {
  if (value is! String || value.trim().isEmpty) return null;
  return value;
}

int _asInt(Object? value) =>
    value is int ? value : value is num ? value.toInt() : int.tryParse('$value') ?? 0;

int? _asNullableInt(Object? value) {
  if (value == null) return null;
  return value is int
      ? value
      : value is num
          ? value.toInt()
          : int.tryParse('$value');
}

DateTime? _asDate(Object? value) =>
    value is String && value.isNotEmpty ? DateTime.tryParse(value) : null;

String _dateOnly(DateTime date) {
  final local = date.toLocal();
  final month = local.month.toString().padLeft(2, '0');
  final day = local.day.toString().padLeft(2, '0');
  return '${local.year}-$month-$day';
}

bool _hasText(String? value) => value != null && value.trim().isNotEmpty;