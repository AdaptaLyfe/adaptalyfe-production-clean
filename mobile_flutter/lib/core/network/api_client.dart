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
    return 'ApiException${code}: $message';
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
    try {
      final response = await _dio.request<dynamic>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: Options(
          method: method,
          headers: await _requestHeaders(),
          validateStatus: _acceptHttpStatus,
        ),
      );

      final statusCode = response.statusCode;
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
      rethrow;
    } on DioException catch (error) {
      throw _dioException(error);
    } catch (error) {
      throw ApiException(
        type: ApiErrorType.unknown,
        message: 'Unexpected API error',
        cause: error,
      );
    }
  }

  Future<Map<String, String>> _requestHeaders() async {
    final token = await _localStorage.readSessionToken();
    final headers = <String, String>{
      // The existing backend uses this marker to return native bearer
      // sessions from login and registration.
      'X-Adaptalyfe-Client': 'native',
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
    return switch (statusCode) {
      400 => ApiErrorType.badRequest,
      401 => ApiErrorType.unauthorized,
      403 => ApiErrorType.forbidden,
      404 => ApiErrorType.notFound,
      >= 500 => ApiErrorType.server,
      _ => ApiErrorType.unknown,
    };
  }

  static String _messageFromPayload(Object? payload, int? statusCode) {
    if (payload is Map) {
      final message = payload['message'] ?? payload['error'];
      if (message is String && message.trim().isNotEmpty) {
        return message;
      }
    }

    if (payload is String && payload.trim().isNotEmpty) {
      return payload;
    }

    return switch (statusCode) {
      400 => 'The request was invalid',
      401 => 'Authentication is required',
      403 => 'You do not have permission to access this resource',
      404 => 'The requested resource was not found',
      >= 500 => 'The server could not complete the request',
      _ => 'The request failed',
    };
  }

  static bool _acceptHttpStatus(int? statusCode) {
    return statusCode != null && statusCode >= 100 && statusCode < 600;
  }
}