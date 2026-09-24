class ApiConfig {
  // Production URL on Render
  static const String baseUrl = 'https://medical-0n1w.onrender.com/api';

  // For physical device testing locally, uncomment and set your machine's IP:
  // static const String baseUrl = 'http://192.168.1.XXX:3001/api';

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const int maxFileSizeMB = 10;
}
