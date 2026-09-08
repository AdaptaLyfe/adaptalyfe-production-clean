import 'package:dio/dio.dart';

/// Network client boundary for the future Adaptalyfe API integration.
///
/// Request methods and authentication interceptors are intentionally deferred.
class ApiClient {
  ApiClient({Dio? dio}) : dio = dio ?? Dio();

  final Dio dio;
}