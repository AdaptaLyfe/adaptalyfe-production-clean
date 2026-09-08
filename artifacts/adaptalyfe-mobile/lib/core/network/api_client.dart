import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../error/app_exception.dart';
import '../storage/token_storage.dart';

class ApiClient {
  ApiClient(this._tokens, {Dio? dio})
      : _dio = dio ??
            Dio(BaseOptions(
                baseUrl: AppConfig.apiBaseUrl,
                connectTimeout: const Duration(seconds: 12),
                receiveTimeout: const Duration(seconds: 15),
                sendTimeout: const Duration(seconds: 12)));
  final Dio _dio;
  final TokenStorage _tokens;

  Future<Map<String, dynamic>> getJson(String path,
          {bool authenticated = true}) =>
      _request('GET', path, authenticated: authenticated);
  Future<Map<String, dynamic>> postJson(String path,
          {Map<String, dynamic>? data, bool authenticated = true}) =>
      _request('POST', path, data: data, authenticated: authenticated);
  Future<void> postEmpty(String path, {bool authenticated = true}) async {
    try {
      final headers = <String, dynamic>{
        'Accept': 'application/json',
        'X-Adaptalyfe-Client': 'native'
      };
      if (authenticated) {
        final token = await _tokens.read();
        if (token?.isNotEmpty == true) {
          headers['Authorization'] = 'Bearer $token';
        }
      }
      await _dio.post<dynamic>(path,
          options: Options(headers: headers, responseType: ResponseType.plain));
    } on DioException catch (error) {
      throw mapDioError(error);
    }
  }

  Future<Map<String, dynamic>> _request(String method, String path,
      {Map<String, dynamic>? data, required bool authenticated}) async {
    try {
      final headers = <String, dynamic>{
        'Accept': 'application/json',
        'X-Adaptalyfe-Client': 'native'
      };
      if (authenticated) {
        final token = await _tokens.read();
        if (token != null && token.isNotEmpty) {
          headers['Authorization'] = 'Bearer $token';
        }
      }
      final response = await _dio.request<dynamic>(path,
          data: data,
          options: Options(
              method: method,
              headers: headers,
              contentType: Headers.jsonContentType,
              responseType: ResponseType.json));
      final body = response.data;
      if (body is! Map) throw const InvalidResponseException();
      return Map<String, dynamic>.from(body);
    } on AppException {
      rethrow;
    } on DioException catch (error) {
      throw mapDioError(error);
    } on FormatException {
      throw const InvalidResponseException();
    }
  }
}

AppException mapDioError(DioException error) {
  final status = error.response?.statusCode;
  if (status == 401 || status == 403) return const InvalidSessionException();
  if (status != null && status >= 500) return const ServerException();
  if (error.type == DioExceptionType.connectionTimeout ||
      error.type == DioExceptionType.receiveTimeout ||
      error.type == DioExceptionType.sendTimeout ||
      error.type == DioExceptionType.connectionError) {
    return const NetworkException();
  }
  if (status != null) {
    return InvalidResponseException(_errorMessage(error.response?.data));
  }
  return const InvalidResponseException();
}

String _errorMessage(dynamic data) => data is Map && data['message'] is String
    ? data['message'] as String
    : data is Map && data['error'] is String
        ? data['error'] as String
        : 'The request could not be completed.';
