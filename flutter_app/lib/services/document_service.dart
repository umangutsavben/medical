import 'package:dio/dio.dart';
import 'api_client.dart';
import '../models/document.dart';
import '../models/category.dart';

class DocumentService {
  final Dio _dio = ApiClient().dio;

  Future<Map<String, dynamic>> upload(
    String filePath,
    String fileName, {
    void Function(int, int)? onProgress,
  }) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
    });

    final response = await _dio.post(
      '/documents/upload',
      data: formData,
      options: Options(headers: {'Content-Type': 'multipart/form-data'}),
      onSendProgress: onProgress,
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> list({
    int page = 1,
    int limit = 20,
    String? status,
    String? categoryId,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (status != null && status.isNotEmpty) params['status'] = status;
    if (categoryId != null && categoryId.isNotEmpty) {
      params['categoryId'] = categoryId;
    }

    final response = await _dio.get('/documents', queryParameters: params);
    return response.data as Map<String, dynamic>;
  }

  Future<MedicalDocument> get(String id) async {
    final response = await _dio.get('/documents/$id');
    return MedicalDocument.fromJson(
        response.data['document'] as Map<String, dynamic>);
  }

  Future<void> delete(String id) async {
    await _dio.delete('/documents/$id');
  }

  Future<void> process(String id) async {
    await _dio.post('/documents/$id/process');
  }

  Future<String> getText(String id) async {
    final response = await _dio.get('/documents/$id/text');
    return response.data['text'] as String? ?? '';
  }

  Future<void> updateCategory(String docId, String categoryId) async {
    await _dio.patch('/documents/$docId/category', data: {
      'categoryId': categoryId,
    });
  }

  Future<List<MedicalCategory>> getCategories() async {
    final response = await _dio.get('/categories');
    final list = response.data['categories'] as List<dynamic>;
    return list
        .map((c) => MedicalCategory.fromJson(c as Map<String, dynamic>))
        .toList();
  }
}
