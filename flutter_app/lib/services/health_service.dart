import 'package:dio/dio.dart';
import 'api_client.dart';
import '../models/health_parameter.dart';

class HealthService {
  final Dio _dio = ApiClient().dio;

  Future<List<HealthParameter>> getParameters() async {
    final response = await _dio.get('/health-parameters');
    final list = response.data['parameters'] as List<dynamic>;
    return list
        .map((p) => HealthParameter.fromJson(p as Map<String, dynamic>))
        .toList();
  }

  Future<void> correctMeasurement(
    String measurementId, {
    required double value,
    String? measuredAt,
  }) async {
    final data = <String, dynamic>{'value': value};
    if (measuredAt != null) data['measuredAt'] = measuredAt;
    await _dio.post('/health-parameters/$measurementId/correct', data: data);
  }

  Future<HealthTrendData> getTrends(String parameter) async {
    final response = await _dio.get('/health-trends/$parameter');
    return HealthTrendData.fromJson(response.data as Map<String, dynamic>);
  }
}
