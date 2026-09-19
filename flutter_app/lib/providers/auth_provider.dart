import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _loading = true;
  final AuthService _authService = AuthService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  User? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    try {
      final token = await _storage.read(key: 'token');
      final savedUser = await _storage.read(key: 'user');

      if (token != null && savedUser != null) {
        _user = User.fromJson(jsonDecode(savedUser) as Map<String, dynamic>);
        notifyListeners();

        // Verify token is still valid
        try {
          final freshUser = await _authService.me();
          _user = freshUser;
          await _storage.write(
              key: 'user', value: jsonEncode(freshUser.toJson()));
        } catch (_) {
          await _clearAuth();
        }
      }
    } catch (_) {
      await _clearAuth();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    final data = await _authService.login(email: email, password: password);
    final token = data['token'] as String;
    final userJson = data['user'] as Map<String, dynamic>;

    await ApiClient().setToken(token);
    await _storage.write(key: 'user', value: jsonEncode(userJson));

    _user = User.fromJson(userJson);
    notifyListeners();
  }

  Future<void> register(String name, String email, String password) async {
    final data = await _authService.register(
        name: name, email: email, password: password);
    final token = data['token'] as String;
    final userJson = data['user'] as Map<String, dynamic>;

    await ApiClient().setToken(token);
    await _storage.write(key: 'user', value: jsonEncode(userJson));

    _user = User.fromJson(userJson);
    notifyListeners();
  }

  Future<void> logout() async {
    await _authService.logout();
    await _clearAuth();
    notifyListeners();
  }

  Future<void> _clearAuth() async {
    _user = null;
    await ApiClient().clearToken();
  }
}
