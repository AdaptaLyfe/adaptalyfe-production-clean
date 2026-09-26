import 'package:flutter/services.dart';

List<TextInputFormatter> phoneNumberInputFormatters() => [
      FilteringTextInputFormatter.digitsOnly,
      LengthLimitingTextInputFormatter(10),
    ];

String? validatePhoneNumber(
  String? value, {
  bool required = false,
}) {
  final digits = value ?? '';
  if (digits.isEmpty) {
    return required ? 'Phone number is required' : null;
  }
  if (!RegExp(r'^[0-9]{10}$').hasMatch(digits)) {
    return 'Enter a valid 10-digit phone number';
  }
  return null;
}