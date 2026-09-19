import 'package:dio/dio.dart';
import 'api_client.dart';

class SearchService {
  final Dio _dio = ApiClient().dio;

  Future<Map<String, dynamic>> search(String query,
      {int page = 1, int limit = 20}) async {
    final response = await _dio.get('/search', queryParameters: {
      'q': query,
      'page': page,
      'limit': limit,
    });
    return response.data as Map<String, dynamic>;
  }
}
