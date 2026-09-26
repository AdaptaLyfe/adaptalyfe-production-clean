import 'package:flutter/services.dart';

class TextToSpeechService {
  const TextToSpeechService._();

  static const _channel = MethodChannel('adaptalyfe/text_to_speech');

  static Future<bool> speak({
    required String text,
    required double rate,
  }) async {
    try {
      await _channel.invokeMethod<void>('speak', {
        'text': text,
        'rate': rate.clamp(.5, 2).toDouble(),
      });
      return true;
    } on MissingPluginException {
      return false;
    } on PlatformException {
      return false;
    }
  }
}