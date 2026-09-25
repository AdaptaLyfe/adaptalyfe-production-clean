import 'package:flutter/foundation.dart';

/// Native subscription purchases must stay in the platform's store.
bool get usesNativeStoreBilling =>
    !kIsWeb &&
    (defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS);