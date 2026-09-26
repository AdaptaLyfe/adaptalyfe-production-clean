import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';

import '../constants/app_constants.dart';
import '../storage/local_storage.dart';

enum ApiErrorType {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  server,
  network,
  timeout,
  unknown,
}

void _logLifeSkillsApi(String message) {
  if (kDebugMode) {
    debugPrint('[LifeSkills][ApiClient] $message');
  }
}

void _logEmergencyResourceApi(String message) {
  if (kDebugMode) {
    debugPrint('[EmergencyResource][ApiClient] $message');
  }
}

/// A successful API result with the original status and parsed response data.
class ApiResponse<T> {
  const ApiResponse({
    required this.statusCode,
    required this.data,
    required this.headers,
  });

  final int? statusCode;
  final T data;
  final Headers headers;

  bool get isSuccess =>
      statusCode != null && statusCode! >= 200 && statusCode! < 300;
}

/// A normalized error for HTTP, network, and timeout failures.
class ApiException implements Exception {
  const ApiException({
    required this.type,
    required this.message,
    this.statusCode,
    this.data,
    this.cause,
  });

  final ApiErrorType type;
  final String message;
  final int? statusCode;
  final Object? data;
  final Object? cause;

  @override
  String toString() {
    final code = statusCode == null ? '' : ' ($statusCode)';
    return 'ApiException$code: $message';
  }
}

/// Centralized HTTP client for the existing Adaptalyfe REST API.
///
/// It keeps request construction, native authentication headers, response
/// parsing, and failure normalization in one place. Endpoint-specific
/// repositories should provide paths and optional response parsers.
class ApiClient {
  ApiClient({
    Dio? dio,
    LocalStorage? localStorage,
    String baseUrl = AppConstants.apiBaseUrl,
  })  : _localStorage = localStorage ?? LocalStorage(),
        _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: baseUrl,
                connectTimeout: const Duration(seconds: 15),
                receiveTimeout: const Duration(seconds: 15),
                sendTimeout: const Duration(seconds: 15),
                headers: const {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                },
                // Dio otherwise throws before the client can normalize the
                // backend's 400/401/403/404/500 response body.
                validateStatus: _acceptHttpStatus,
              ),
            );

  final Dio _dio;
  final LocalStorage _localStorage;

  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic data)? parser,
  }) {
    return _request<T>(
      method: 'GET',
      path: path,
      queryParameters: queryParameters,
      parser: parser,
    );
  }

  Future<ApiResponse<T>> post<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic data)? parser,
  }) {
    return _request<T>(
      method: 'POST',
      path: path,
      data: data,
      queryParameters: queryParameters,
      parser: parser,
    );
  }

  Future<ApiResponse<T>> patch<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic data)? parser,
  }) {
    return _request<T>(
      method: 'PATCH',
      path: path,
      data: data,
      queryParameters: queryParameters,
      parser: parser,
    );
  }

  Future<ApiResponse<T>> put<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic data)? parser,
  }) {
    return _request<T>(
      method: 'PUT',
      path: path,
      data: data,
      queryParameters: queryParameters,
      parser: parser,
    );
  }

  Future<ApiResponse<T>> delete<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic data)? parser,
  }) {
    return _request<T>(
      method: 'DELETE',
      path: path,
      data: data,
      queryParameters: queryParameters,
      parser: parser,
    );
  }

  Future<ApiResponse<T>> _request<T>({
    required String method,
    required String path,
    Object? data,
    Map<String, dynamic>? queryParameters,
    T Function(dynamic data)? parser,
  }) async {
    final isLifeSkillsRequest = path.startsWith('/api/transition-skills');
    final isEmergencyResourceRequest =
        path == '/api/emergency-resources' ||
        path.startsWith('/api/emergency-resources/');
    final requestHeaders = await _requestHeaders();
    if (isLifeSkillsRequest) {
      _logLifeSkillsApi(
        'request method=$method path=$path '
        'payload=${data ?? '<none>'} '
        'hasBearerToken=${requestHeaders.containsKey('Authorization')}',
      );
    }
    if (isEmergencyResourceRequest) {
      _logEmergencyResourceApi(
        'request origin=${_safeRequestOrigin(_dio.options.baseUrl)} '
        'method=$method path=$path '
        'hasBearerToken=${requestHeaders.containsKey('Authorization')} '
        'payloadShape=${_safeEmergencyResourcePayloadShape(data)}',
      );
    }

    try {
      final response = await _dio.request<dynamic>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: Options(
          method: method,
          headers: requestHeaders,
          validateStatus: _acceptHttpStatus,
        ),
      );

      final statusCode = response.statusCode;
      if (isEmergencyResourceRequest) {
        _logEmergencyResourceApi(
          'response method=$method path=$path '
          'status=${statusCode ?? 'unknown'} '
          'bodyShape=${_safeEmergencyResourcePayloadShape(response.data)}',
        );
      }
      if (isLifeSkillsRequest) {
        _logLifeSkillsApi(
          'response method=$method path=$path status=$statusCode '
          'body=${response.data}',
        );
      }
      if (statusCode == null || statusCode < 200 || statusCode >= 300) {
        throw _httpException(response);
      }

      final parsedData = parser == null ? response.data as T : parser(response.data);
      return ApiResponse<T>(
        statusCode: statusCode,
        data: parsedData,
        headers: response.headers,
      );
    } on ApiException {
      if (isLifeSkillsRequest) {
        _logLifeSkillsApi('normalized failure method=$method path=$path');
      }
      rethrow;
    } on DioException catch (error) {
      final normalized = _dioException(error);
      if (isEmergencyResourceRequest) {
        _logEmergencyResourceApi(
          'transport failure method=$method path=$path '
          'type=${normalized.type} status=${normalized.statusCode ?? 'none'}',
        );
      }
      if (isLifeSkillsRequest) {
        _logLifeSkillsApi(
          'dio failure method=$method path=$path error=$normalized',
        );
      }
      throw normalized;
    } catch (error) {
      if (isEmergencyResourceRequest) {
        _logEmergencyResourceApi(
          'unexpected failure method=$method path=$path '
          'type=${error.runtimeType}',
        );
      }
      if (isLifeSkillsRequest) {
        _logLifeSkillsApi(
          'unexpected failure method=$method path=$path error=$error',
        );
      }
      throw ApiException(
        type: ApiErrorType.unknown,
        message: 'Unexpected API error',
        cause: error,
      );
    }
  }

  Future<Map<String, String>> _requestHeaders() async {
    final token = await _localStorage.getSessionToken();
    final headers = <String, String>{
      // The existing backend uses this marker to return native bearer
      // sessions from login and registration.
      'X-Adaptalyfe-Client': 'native',
      // Streak and date-scoped task calculations use the device's calendar day.
      'X-User-Timezone-Offset-Minutes':
          DateTime.now().timeZoneOffset.inMinutes.toString(),
    };

    if (token != null && token.trim().isNotEmpty) {
      headers['Authorization'] = 'Bearer ${token.trim()}';
    }

    return headers;
  }

  ApiException _httpException(Response<dynamic> response) {
    final statusCode = response.statusCode;
    return ApiException(
      type: _errorTypeForStatus(statusCode),
      statusCode: statusCode,
      message: _messageFromPayload(response.data, statusCode),
      data: response.data,
    );
  }

  ApiException _dioException(DioException error) {
    final response = error.response;
    if (response != null &&
        response.statusCode != null &&
        (response.statusCode! < 200 || response.statusCode! >= 300)) {
      return _httpException(response);
    }

    final type = switch (error.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout =>
        ApiErrorType.timeout,
      DioExceptionType.connectionError => ApiErrorType.network,
      _ => ApiErrorType.unknown,
    };

    return ApiException(
      type: type,
      statusCode: response?.statusCode,
      message: type == ApiErrorType.timeout
          ? 'The request timed out'
          : type == ApiErrorType.network
              ? 'A network connection could not be established'
              : error.message ?? 'The request failed',
      data: response?.data,
      cause: error,
    );
  }

  static ApiErrorType _errorTypeForStatus(int? statusCode) {
    if (statusCode == 400) return ApiErrorType.badRequest;
    if (statusCode == 401) return ApiErrorType.unauthorized;
    if (statusCode == 403) return ApiErrorType.forbidden;
    if (statusCode == 404) return ApiErrorType.notFound;
    if (statusCode != null && statusCode >= 500) {
      return ApiErrorType.server;
    }
    return ApiErrorType.unknown;
  }

  static String _messageFromPayload(Object? payload, int? statusCode) {
    if (payload is Map) {
      final message = payload['message'] ?? payload['error'];
      if (message is String &&
          message.trim().isNotEmpty &&
          !_looksLikeRawError(message)) {
        return message;
      }
    }

    if (payload is String &&
        payload.trim().isNotEmpty &&
        !_looksLikeRawError(payload)) {
      return payload;
    }

    if (statusCode == 400) return 'The request was invalid';
    if (statusCode == 401) return 'Authentication is required';
    if (statusCode == 403) {
      return 'You do not have permission to access this resource';
    }
    if (statusCode == 404) {
      return 'The requested resource was not found';
    }
    if (statusCode != null && statusCode >= 500) {
      return 'The server could not complete the request';
    }
    return 'The request failed';
  }

  static bool _looksLikeRawError(String value) {
    final trimmed = value.trimLeft();
    return trimmed.startsWith('<') ||
        trimmed.startsWith('{') ||
        trimmed.startsWith('[') ||
        trimmed.contains('package:flutter/') ||
        RegExp(r'\bat [\w./\\:-]+\([^)]*\)').hasMatch(trimmed);
  }

  static String _safeRequestOrigin(String baseUrl) {
    final uri = Uri.tryParse(baseUrl);
    if (uri == null || uri.host.isEmpty) return '<unknown>';
    final port = uri.hasPort ? ':${uri.port}' : '';
    return '${uri.scheme}://${uri.host}$port';
  }

  /// Logs only JSON keys and value shapes; resource values may be sensitive.
  static String _safeEmergencyResourcePayloadShape(Object? payload) {
    if (payload is Map) {
      final fields = payload.entries.map((entry) {
        return '${entry.key}:${_safeEmergencyResourceValueShape(entry.value)}';
      }).join(',');
      return '{$fields}';
    }
    if (payload is List) return 'list(count=${payload.length})';
    return _safeEmergencyResourceValueShape(payload);
  }

  static String _safeEmergencyResourceValueShape(Object? value) {
    if (value == null) return 'null';
    if (value is String) {
      return value.trim().isEmpty ? 'empty-string' : 'string';
    }
    if (value is bool) return 'bool';
    if (value is num) return 'number';
    if (value is Map) return 'object';
    if (value is List) return 'list';
    return value.runtimeType.toString();
  }

  static bool _acceptHttpStatus(int? statusCode) {
    return statusCode != null && statusCode >= 100 && statusCode < 600;
  }
}