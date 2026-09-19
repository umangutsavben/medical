import 'package:dio/dio.dart';
import 'api_client.dart';
import '../models/user.dart';

class ProfileService {
  final Dio _dio = ApiClient().dio;

  Future<User> getProfile() async {
    final response = await _dio.get('/profile');
    return User.fromJson(response.data['profile'] as Map<String, dynamic>);
  }

  Future<void> updateProfile({
    String? name,
    String? phone,
    String? dateOfBirth,
    String? gender,
  }) async {
    await _dio.put('/profile', data: {
      'name': name,
      'phone': phone,
      'dateOfBirth': dateOfBirth,
      'gender': gender,
    });
  }
}
