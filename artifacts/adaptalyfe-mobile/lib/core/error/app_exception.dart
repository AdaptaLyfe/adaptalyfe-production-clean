sealed class AppException implements Exception {
  const AppException(this.message);
  final String message;
}

class NetworkException extends AppException {
  const NetworkException(
      [super.message =
          'Unable to reach the service. Check your connection and try again.']);
}

class InvalidSessionException extends AppException {
  const InvalidSessionException(
      [super.message = 'Your session has expired. Please sign in again.']);
}

class ServerException extends AppException {
  const ServerException(
      [super.message =
          'The service is unavailable. Please try again shortly.']);
}

class InvalidResponseException extends AppException {
  const InvalidResponseException(
      [super.message = 'The service returned an unexpected response.']);
}
