class ApiConfig {
  // Change this to your machine's local IP when testing on a physical device.
  // For Android emulator, use 10.0.2.2 instead of localhost.
  // For iOS simulator, localhost works fine.
  static const String baseUrl = 'http://localhost:3001/api';

  // For physical device testing, uncomment and set your machine's IP:
  // static const String baseUrl = 'http://192.168.1.XXX:3001/api';

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const int maxFileSizeMB = 10;
}
